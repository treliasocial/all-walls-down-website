import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const dbPath = path.join(dataDir, "portal-db.json");
const port = Number(process.env.AWD_API_PORT || 8787);
const frontendPort = Number(process.env.AWD_FRONTEND_PORT || 5173);
const isProduction = process.env.NODE_ENV === "production";
const sessionCookieName = "awd_session";
const sessionTtlMs = Number(process.env.AWD_SESSION_TTL_MS || 1000 * 60 * 60 * 8);
const sessionIdleTtlMs = Number(process.env.AWD_SESSION_IDLE_TTL_MS || 1000 * 60 * 60);
const bodyLimitBytes = Number(process.env.AWD_BODY_LIMIT_BYTES || 100_000);
const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];
const allowedOrigins = String(process.env.AWD_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigins = allowedOrigins.length ? allowedOrigins : defaultAllowedOrigins;

const rolePermissions = {
  Administrator: ["*"],
  "User Admin": [
    "dashboard.read",
    "users.read",
    "users.create",
    "users.update",
    "users.deactivate",
    "roles.manage",
    "security.read",
    "security.manage",
    "audit.read",
  ],
  "Content Manager": ["dashboard.read", "content.read", "content.update", "content.publish", "testimonials.read", "testimonials.approve"],
  "Prayer Team": ["dashboard.read", "prayer.read", "prayer.confidential.read", "prayer.update"],
  Communications: ["dashboard.read", "contacts.read", "contacts.update", "testimonials.read"],
  "Donation Manager": ["dashboard.read", "donations.read"],
  "Read Only": ["dashboard.read", "contacts.read", "prayer.read", "testimonials.read", "donations.read", "content.read"],
  Auditor: ["dashboard.read", "security.read", "audit.read"],
};

const allPermissions = [
  "dashboard.read",
  "users.read",
  "users.create",
  "users.update",
  "users.deactivate",
  "roles.manage",
  "security.read",
  "security.manage",
  "contacts.read",
  "contacts.update",
  "prayer.read",
  "prayer.confidential.read",
  "prayer.update",
  "testimonials.read",
  "testimonials.approve",
  "donations.read",
  "content.read",
  "content.update",
  "content.publish",
  "audit.read",
  "settings.read",
  "settings.update",
];

const defaultDb = {
  meta: { schemaVersion: 1, createdAt: new Date().toISOString() },
  users: [],
  sessions: [],
  loginChallenges: [],
  contacts: [],
  prayerRequests: [],
  testimonials: [],
  donations: [],
  auditLogs: [],
  securityEvents: [],
  settings: {
    portalUrl: process.env.AWD_PORTAL_URL || "/portal",
    publicSiteUrl: process.env.AWD_PUBLIC_SITE_URL || "http://localhost:5173",
    donationProvider: "Zeffy",
  },
};

const privateIpv4Ranges = [/^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./];
const getWifiAddress = () => {
  const addresses = Object.entries(os.networkInterfaces()).flatMap(([name, entries = []]) =>
    entries.filter((entry) => entry.family === "IPv4" && !entry.internal).map((entry) => ({ name, address: entry.address })),
  );
  return (
    addresses.find((entry) => /^en\d+$/.test(entry.name))?.address ||
    addresses.find((entry) => privateIpv4Ranges.some((range) => range.test(entry.address)))?.address ||
    addresses[0]?.address ||
    ""
  );
};

const networkStatus = () => {
  const wifiAddress = getWifiAddress();
  return {
    connected: Boolean(wifiAddress),
    wifiAddress,
    frontendLocalUrl: `http://localhost:${frontendPort}/`,
    frontendWifiUrl: wifiAddress ? `http://${wifiAddress}:${frontendPort}/` : "",
    apiLocalUrl: `http://localhost:${port}/`,
    apiWifiUrl: wifiAddress ? `http://${wifiAddress}:${port}/` : "",
  };
};

const isLocalDevOrigin = (origin) => {
  if (!origin || isProduction) return false;
  try {
    const url = new URL(origin);
    const isFrontendPort = Number(url.port) === frontendPort;
    const isLocalHost = ["localhost", "127.0.0.1"].includes(url.hostname);
    const isWifiHost = getWifiAddress() === url.hostname;
    return url.protocol === "http:" && isFrontendPort && (isLocalHost || isWifiHost);
  } catch {
    return false;
  }
};

const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(8).toString("hex")}`;
const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const hmac = (value) => crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");

const getSessionSecret = () => {
  const secret = process.env.AWD_SESSION_SECRET;
  if (!secret || secret.length < 32) return "";
  return secret;
};

const hashSecret = (value, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.scryptSync(String(value), salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyHash = (value, stored) => {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const actual = hashSecret(value, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(actual, "hex"));
};

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const base32Secret = () => {
  const bytes = crypto.randomBytes(20);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  return bits.match(/.{1,5}/g).map((chunk) => base32Alphabet[Number.parseInt(chunk.padEnd(5, "0"), 2)]).join("");
};

const decodeBase32 = (secret) => {
  let bits = "";
  for (const char of String(secret).replace(/=+$/g, "").toUpperCase()) {
    const value = base32Alphabet.indexOf(char);
    if (value >= 0) bits += value.toString(2).padStart(5, "0");
  }
  return Buffer.from((bits.match(/.{1,8}/g) || []).map((byte) => Number.parseInt(byte, 2)));
};

const totp = (secret, step = Math.floor(Date.now() / 30000)) => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = crypto.createHmac("sha1", decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
};

const verifyTotp = (secret, token) => {
  const clean = String(token || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const step = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((offset) => totp(secret, step + offset) === clean);
};

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  roles: user.roles || [],
  permissions: getPermissions(user),
  isActive: user.isActive !== false,
  mfaRequired: user.mfaRequired !== false,
  mfaEnabled: Boolean(user.mfaEnabled),
  mfaEnrolledAt: user.mfaEnrolledAt || "",
  requirePasswordReset: Boolean(user.requirePasswordReset),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getPermissions = (user) => {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (roles.some((role) => rolePermissions[role]?.includes("*"))) return allPermissions;
  return [...new Set(roles.flatMap((role) => rolePermissions[role] || []))];
};

const hasPermission = (user, permission) => getPermissions(user).includes(permission);

const loadDb = async () => {
  await fs.mkdir(dataDir, { recursive: true });
  let db;
  try {
    db = JSON.parse(await fs.readFile(dbPath, "utf8"));
  } catch {
    db = structuredClone(defaultDb);
  }
  db = { ...structuredClone(defaultDb), ...db };
  db.settings = { ...defaultDb.settings, ...(db.settings || {}) };
  await bootstrapAdmin(db);
  await writeDb(db);
  return db;
};

const writeDb = async (db) => fs.writeFile(dbPath, JSON.stringify(db, null, 2));

const markDbForWrite = (db) => {
  Object.defineProperty(db, "__needsWrite", { value: true, writable: true, enumerable: false, configurable: true });
};

const bootstrapAdmin = async (db) => {
  if (db.users.length) return;
  const email = process.env.AWD_ADMIN_EMAIL;
  const name = process.env.AWD_ADMIN_NAME;
  const password = process.env.AWD_ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !name || !password || password.length < 12 || !getSessionSecret()) return;
  const now = new Date().toISOString();
  const user = {
    id: id("user"),
    name,
    email: email.toLowerCase(),
    passwordHash: hashSecret(password),
    roles: ["Administrator"],
    isActive: true,
    mfaRequired: true,
    mfaEnabled: false,
    requirePasswordReset: true,
    createdAt: now,
    updatedAt: now,
  };
  db.users.push(user);
  writeAudit(db, null, "user.bootstrap", "user", user.id, { email: user.email });
};

const clientIp = (request) => request.headers["x-forwarded-for"]?.split(",")[0]?.trim() || request.socket.remoteAddress || "";
const userAgent = (request) => request.headers["user-agent"] || "";

const writeAudit = (db, auth, action, entityType, entityId, metadata = {}, request = null) => {
  db.auditLogs.unshift({
    id: id("audit"),
    actorUserId: auth?.user?.id || null,
    actorEmail: auth?.user?.email || metadata.actorEmail || null,
    action,
    entityType,
    entityId,
    ipAddress: request ? clientIp(request) : "",
    userAgent: request ? userAgent(request) : "",
    metadata,
    createdAt: new Date().toISOString(),
  });
  db.auditLogs = db.auditLogs.slice(0, 2000);
};

const writeSecurityEvent = (db, request, action, severity, metadata = {}, auth = null) => {
  db.securityEvents.unshift({
    id: id("security"),
    action,
    severity,
    actorUserId: auth?.user?.id || null,
    actorEmail: auth?.user?.email || metadata.actorEmail || null,
    ipAddress: request ? clientIp(request) : "",
    userAgent: request ? userAgent(request) : "",
    metadata,
    createdAt: new Date().toISOString(),
  });
  db.securityEvents = db.securityEvents.slice(0, 1000);
  writeAudit(db, auth, action, "securityEvent", null, { severity, ...metadata }, request);
};

const securityHeaders = () => ({
  "Content-Security-Policy": "default-src 'self'; frame-ancestors 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' http://localhost:8787 http://127.0.0.1:8787",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "X-Frame-Options": "SAMEORIGIN",
  ...(isProduction ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } : {}),
});

const corsHeaders = (request) => {
  const origin = request.headers.origin;
  const allowOrigin = corsOrigins.includes(origin) || isLocalDevOrigin(origin) ? origin : corsOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    Vary: "Origin",
  };
};

const sendJson = (request, response, status, body, headers = {}) => {
  response.writeHead(status, {
    ...securityHeaders(),
    ...corsHeaders(request),
    "Content-Type": "application/json",
    ...headers,
  });
  response.end(JSON.stringify(body));
};

const readBody = (request) =>
  new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > bodyLimitBytes) {
        reject(Object.assign(new Error("Request body too large"), { status: 413 }));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(Object.assign(new Error("Invalid JSON"), { status: 400 }));
      }
    });
  });

const parseCookies = (request) =>
  Object.fromEntries(
    String(request.headers.cookie || "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, decodeURIComponent(value)]),
  );

const cookie = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", `SameSite=${options.sameSite || "Lax"}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (isProduction) parts.push("Secure");
  return parts.join("; ");
};

const getSessionFromRequest = (request, db, { allowUnverifiedMfa = false, touch = false } = {}) => {
  const token = parseCookies(request)[sessionCookieName];
  if (!token) return null;
  const tokenHash = sha256(token);
  const session = db.sessions.find((item) => item.tokenHash === tokenHash && !item.revokedAt);
  if (!session) return null;
  const now = Date.now();
  const absoluteExpiresAt = new Date(session.expiresAt).getTime();
  const lastSeenAt = new Date(session.lastSeenAt || session.createdAt || 0).getTime();
  const idleExpiresAt = new Date(session.idleExpiresAt || lastSeenAt + sessionIdleTtlMs).getTime();
  if (absoluteExpiresAt < now || idleExpiresAt < now) {
    session.revokedAt = new Date().toISOString();
    markDbForWrite(db);
    return null;
  }
  const user = db.users.find((item) => item.id === session.userId && item.isActive !== false);
  if (!user) {
    session.revokedAt = new Date().toISOString();
    markDbForWrite(db);
    return null;
  }
  if (user.mfaRequired !== false && !user.mfaEnabled && !allowUnverifiedMfa) return null;
  if (user.mfaRequired !== false && user.mfaEnabled && !session.mfaVerified && !allowUnverifiedMfa) return null;
  if (touch) {
    const touchedAt = new Date().toISOString();
    session.lastSeenAt = touchedAt;
    session.idleExpiresAt = new Date(now + sessionIdleTtlMs).toISOString();
    markDbForWrite(db);
  }
  return { session, user };
};

const requireAuth = (request, response, db, permission = null, options = {}) => {
  const auth = getSessionFromRequest(request, db, { touch: true, ...options });
  if (!auth) {
    writeSecurityEvent(db, request, "unauthorized.access", "medium", { path: request.url });
    sendJson(request, response, 401, { error: "Authentication required" });
    return null;
  }
  if (permission && !hasPermission(auth.user, permission)) {
    writeSecurityEvent(db, request, "unauthorized.permission", "medium", { path: request.url, permission }, auth);
    sendJson(request, response, 403, { error: "Access denied" });
    return null;
  }
  return auth;
};

const createSession = (db, request, user, mfaVerified) => {
  const token = crypto.randomBytes(32).toString("base64url");
  const session = {
    id: id("session"),
    userId: user.id,
    tokenHash: sha256(token),
    mfaVerified,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
    lastSeenAt: new Date().toISOString(),
    idleExpiresAt: new Date(Date.now() + sessionIdleTtlMs).toISOString(),
    ipAddress: clientIp(request),
    userAgent: userAgent(request),
  };
  db.sessions.push(session);
  return { token, session };
};

const clearCookieHeader = cookie(sessionCookieName, "", { maxAge: 0 });
const sessionCookieHeader = (token) => cookie(sessionCookieName, token, { maxAge: Math.floor(sessionTtlMs / 1000) });

const createRecoveryCodes = (user) => {
  const codes = Array.from({ length: 10 }, () => crypto.randomBytes(5).toString("hex").toUpperCase().match(/.{1,5}/g).join("-"));
  user.recoveryCodes = codes.map((code) => ({ hash: hashSecret(code), usedAt: "" }));
  return codes;
};

const consumeRecoveryCode = (user, code) => {
  const item = (user.recoveryCodes || []).find((candidate) => !candidate.usedAt && verifyHash(String(code || "").toUpperCase(), candidate.hash));
  if (!item) return false;
  item.usedAt = new Date().toISOString();
  return true;
};

const loginRate = new Map();
const rateLimit = (request, key, limit, windowMs) => {
  const bucketKey = `${key}:${clientIp(request)}`;
  const now = Date.now();
  const bucket = (loginRate.get(bucketKey) || []).filter((timestamp) => now - timestamp < windowMs);
  bucket.push(now);
  loginRate.set(bucketKey, bucket);
  return bucket.length <= limit;
};

const setupStatus = (db) => ({
  configured: Boolean(getSessionSecret()),
  adminBootstrapped: db.users.length > 0,
  missing: [
    !getSessionSecret() ? "AWD_SESSION_SECRET with at least 32 characters" : "",
    !db.users.length ? "AWD_ADMIN_EMAIL, AWD_ADMIN_NAME, AWD_ADMIN_BOOTSTRAP_PASSWORD" : "",
  ].filter(Boolean),
});

const routes = {
  "GET /api/health": async (request, response, db) =>
    sendJson(request, response, 200, {
      ok: true,
      service: "awd-portal-api",
      setup: setupStatus(db),
      network: networkStatus(),
    }),

  "GET /api/network-status": async (request, response) => sendJson(request, response, 200, networkStatus()),

  "POST /api/auth/login": async (request, response, db) => {
    if (!rateLimit(request, "login", 8, 15 * 60 * 1000)) {
      writeSecurityEvent(db, request, "login.rate_limited", "high");
      return sendJson(request, response, 429, { error: "Too many attempts. Try again later." });
    }
    const setup = setupStatus(db);
    if (!setup.configured || !setup.adminBootstrapped) {
      return sendJson(request, response, 503, { error: "Portal setup is incomplete.", setup });
    }
    const body = await readBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    const user = db.users.find((item) => item.email === email);
    if (!user || user.isActive === false || !verifyHash(body.password || "", user.passwordHash)) {
      writeSecurityEvent(db, request, "login.failure", "medium", { actorEmail: email });
      await writeDb(db);
      return sendJson(request, response, 401, { error: "Invalid email or password." });
    }
    if (user.mfaEnabled) {
      const challenge = { id: id("challenge"), userId: user.id, expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() };
      db.loginChallenges.push(challenge);
      writeAudit(db, { user }, "login.password_accepted", "user", user.id, {}, request);
      await writeDb(db);
      return sendJson(request, response, 202, { mfaRequired: true, challengeId: challenge.id });
    }
    const { token } = createSession(db, request, user, false);
    writeAudit(db, { user }, "login.success", "session", null, { mfaEnrollmentRequired: user.mfaRequired !== false }, request);
    await writeDb(db);
    sendJson(request, response, 200, { user: safeUser(user), mfaEnrollmentRequired: user.mfaRequired !== false }, { "Set-Cookie": sessionCookieHeader(token) });
  },

  "POST /api/auth/mfa/verify-login": async (request, response, db) => {
    if (!rateLimit(request, "mfa-login", 10, 15 * 60 * 1000)) return sendJson(request, response, 429, { error: "Too many attempts. Try again later." });
    const body = await readBody(request);
    const challenge = db.loginChallenges.find((item) => item.id === body.challengeId);
    if (!challenge || new Date(challenge.expiresAt).getTime() < Date.now()) return sendJson(request, response, 401, { error: "MFA challenge expired." });
    const user = db.users.find((item) => item.id === challenge.userId && item.isActive !== false);
    const verified = user && ((user.totpSecret && verifyTotp(user.totpSecret, body.code)) || consumeRecoveryCode(user, body.recoveryCode));
    if (!verified) {
      writeSecurityEvent(db, request, "mfa.verify.failure", "high", { actorEmail: user?.email || "" });
      await writeDb(db);
      return sendJson(request, response, 401, { error: "Invalid MFA code." });
    }
    db.loginChallenges = db.loginChallenges.filter((item) => item.id !== challenge.id);
    const { token } = createSession(db, request, user, true);
    writeAudit(db, { user }, "mfa.verify.success", "session", null, {}, request);
    await writeDb(db);
    sendJson(request, response, 200, { user: safeUser(user) }, { "Set-Cookie": sessionCookieHeader(token) });
  },

  "POST /api/auth/logout": async (request, response, db) => {
    const auth = getSessionFromRequest(request, db, { allowUnverifiedMfa: true });
    if (auth) {
      auth.session.revokedAt = new Date().toISOString();
      writeAudit(db, auth, "logout", "session", auth.session.id, {}, request);
      await writeDb(db);
    }
    sendJson(request, response, 200, { ok: true }, { "Set-Cookie": clearCookieHeader });
  },

  "POST /api/auth/logout-all": async (request, response, db) => {
    const auth = requireAuth(request, response, db, null, { allowUnverifiedMfa: true });
    if (!auth) return;
    db.sessions.forEach((session) => {
      if (session.userId === auth.user.id && !session.revokedAt) session.revokedAt = new Date().toISOString();
    });
    writeAudit(db, auth, "session.revoked_all", "user", auth.user.id, {}, request);
    await writeDb(db);
    sendJson(request, response, 200, { ok: true }, { "Set-Cookie": clearCookieHeader });
  },

  "GET /api/auth/me": async (request, response, db) => {
    const auth = requireAuth(request, response, db, null, { allowUnverifiedMfa: true });
    if (!auth) return;
    sendJson(request, response, 200, {
      user: safeUser(auth.user),
      session: {
        id: auth.session.id,
        mfaVerified: auth.session.mfaVerified,
        expiresAt: auth.session.expiresAt,
        lastSeenAt: auth.session.lastSeenAt,
        idleExpiresAt: auth.session.idleExpiresAt,
      },
      mfaEnrollmentRequired: auth.user.mfaRequired !== false && !auth.user.mfaEnabled,
    });
  },

  "GET /api/auth/session": async (request, response, db) => {
    const auth = getSessionFromRequest(request, db, { allowUnverifiedMfa: true });
    sendJson(request, response, 200, { valid: Boolean(auth), user: auth ? safeUser(auth.user) : null });
  },

  "POST /api/auth/session/touch": async (request, response, db) => {
    const auth = requireAuth(request, response, db, null, { allowUnverifiedMfa: true });
    if (!auth) return;
    sendJson(request, response, 200, {
      ok: true,
      session: {
        id: auth.session.id,
        mfaVerified: auth.session.mfaVerified,
        expiresAt: auth.session.expiresAt,
        lastSeenAt: auth.session.lastSeenAt,
        idleExpiresAt: auth.session.idleExpiresAt,
      },
    });
  },

  "POST /api/mfa/enroll/start": async (request, response, db) => {
    const auth = requireAuth(request, response, db, null, { allowUnverifiedMfa: true });
    if (!auth) return;
    auth.user.pendingTotpSecret = base32Secret();
    const issuer = "All Walls Down";
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(auth.user.email)}?secret=${auth.user.pendingTotpSecret}&issuer=${encodeURIComponent(issuer)}`;
    writeAudit(db, auth, "mfa.enrollment.started", "user", auth.user.id, {}, request);
    await writeDb(db);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 220,
    });
    sendJson(request, response, 200, {
      secret: auth.user.pendingTotpSecret,
      otpauthUrl,
      qrCodeUrl: qrCodeDataUrl,
    });
  },

  "POST /api/mfa/enroll/verify": async (request, response, db) => {
    const auth = requireAuth(request, response, db, null, { allowUnverifiedMfa: true });
    if (!auth) return;
    const body = await readBody(request);
    if (!auth.user.pendingTotpSecret || !verifyTotp(auth.user.pendingTotpSecret, body.code)) {
      writeSecurityEvent(db, request, "mfa.enrollment.failure", "high", {}, auth);
      await writeDb(db);
      return sendJson(request, response, 401, { error: "Invalid authenticator code." });
    }
    auth.user.totpSecret = auth.user.pendingTotpSecret;
    delete auth.user.pendingTotpSecret;
    auth.user.mfaEnabled = true;
    auth.user.mfaRequired = true;
    auth.user.mfaEnrolledAt = new Date().toISOString();
    auth.session.mfaVerified = true;
    const recoveryCodes = createRecoveryCodes(auth.user);
    writeAudit(db, auth, "mfa.enrollment.completed", "user", auth.user.id, {}, request);
    await writeDb(db);
    sendJson(request, response, 200, { user: safeUser(auth.user), recoveryCodes });
  },

  "POST /api/mfa/recovery-codes/regenerate": async (request, response, db) => {
    const auth = requireAuth(request, response, db);
    if (!auth) return;
    const recoveryCodes = createRecoveryCodes(auth.user);
    writeAudit(db, auth, "mfa.recovery_codes.regenerated", "user", auth.user.id, {}, request);
    await writeDb(db);
    sendJson(request, response, 200, { recoveryCodes });
  },

  "POST /api/mfa/recovery/verify": async (request, response, db) => {
    const auth = requireAuth(request, response, db, null, { allowUnverifiedMfa: true });
    if (!auth) return;
    const body = await readBody(request);
    const ok = consumeRecoveryCode(auth.user, body.recoveryCode);
    writeAudit(db, auth, ok ? "mfa.recovery.verify.success" : "mfa.recovery.verify.failure", "user", auth.user.id, {}, request);
    await writeDb(db);
    sendJson(request, response, ok ? 200 : 401, ok ? { ok: true } : { error: "Invalid recovery code." });
  },

  "GET /api/dashboard/summary": async (request, response, db) => {
    const auth = requireAuth(request, response, db, "dashboard.read");
    if (!auth) return;
    sendJson(request, response, 200, {
      summary: {
        newContacts: db.contacts.filter((item) => item.status === "New").length,
        pendingPrayerRequests: db.prayerRequests.filter((item) => item.status !== "Prayed").length,
        pendingTestimonials: db.testimonials.filter((item) => item.status !== "Approved").length,
        securityAlerts: db.securityEvents.filter((item) => item.severity === "high").length,
        recentActivity: db.auditLogs.slice(0, 8),
        staffRequiringMfa: db.users.filter((user) => user.mfaRequired !== false && !user.mfaEnabled).length,
        donationProviderStatus: "Zeffy provider-hosted donations configured",
      },
    });
  },

  "GET /api/audit": async (request, response, db) => {
    const auth = requireAuth(request, response, db, "audit.read");
    if (!auth) return;
    sendJson(request, response, 200, { auditLogs: db.auditLogs.slice(0, 200), securityEvents: db.securityEvents.slice(0, 100) });
  },

  "POST /api/public/contact": async (request, response, db) => {
    const body = await readBody(request);
    db.contacts.unshift({ id: id("contact"), ...body, status: "New", submittedAt: new Date().toISOString() });
    await writeDb(db);
    sendJson(request, response, 201, { ok: true });
  },

  "POST /api/public/prayer": async (request, response, db) => {
    const body = await readBody(request);
    db.prayerRequests.unshift({ id: id("prayer"), ...body, status: "Pending", submittedAt: new Date().toISOString() });
    await writeDb(db);
    sendJson(request, response, 201, { ok: true });
  },

  "POST /api/public/testimonial": async (request, response, db) => {
    const body = await readBody(request);
    db.testimonials.unshift({ id: id("testimonial"), ...body, status: "Pending Review", submittedAt: new Date().toISOString() });
    await writeDb(db);
    sendJson(request, response, 201, { ok: true });
  },
};

const server = http.createServer(async (request, response) => {
  const db = await loadDb();
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (request.method === "OPTIONS") return sendJson(request, response, 204, {});
  const handler = routes[`${request.method} ${url.pathname}`];
  if (!handler) return sendJson(request, response, 404, { error: "Not found" });
  try {
    await handler(request, response, db, url);
    if (db.__needsWrite) await writeDb(db);
  } catch (error) {
    if (db.__needsWrite) await writeDb(db);
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    sendJson(request, response, status, {
      error: status >= 500 && isProduction ? "Unexpected server error" : error.message,
    });
  }
});

server.listen(port, () => {
  const status = networkStatus();
  console.log(`AWD secure portal API listening on http://localhost:${port}`);
  console.log(`AWD network ready: ${status.wifiAddress || "offline"}`);
});
