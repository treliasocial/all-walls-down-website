import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const dbPath = path.join(dataDir, "ministry-crm.json");
const port = Number(process.env.AWD_API_PORT || 8787);
const frontendPort = Number(process.env.AWD_FRONTEND_PORT || 5173);
const networkPollMs = Number(process.env.AWD_NETWORK_POLL_MS || 5000);

const privateIpv4Ranges = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
];

const getWifiAddress = () => {
  const interfaces = os.networkInterfaces();
  const addresses = Object.entries(interfaces).flatMap(([name, entries = []]) =>
    entries
      .filter((entry) => entry.family === "IPv4" && !entry.internal)
      .map((entry) => ({ name, address: entry.address })),
  );
  const wifiAddress = addresses.find((entry) => /^en\d+$/.test(entry.name));
  const privateAddress = addresses.find((entry) =>
    privateIpv4Ranges.some((range) => range.test(entry.address)),
  );
  return wifiAddress?.address || privateAddress?.address || addresses[0]?.address || "";
};

const buildNetworkStatus = () => {
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

let networkStatus = buildNetworkStatus();
const networkClients = new Set();

const sendNetworkEvent = (response, status) => {
  response.write(`event: network-status\n`);
  response.write(`data: ${JSON.stringify(status)}\n\n`);
};

const broadcastNetworkStatus = () => {
  networkClients.forEach((response) => sendNetworkEvent(response, networkStatus));
};

const logNetworkStatus = (reason = "current") => {
  const lines = [
    `AWD network ${reason}: ${networkStatus.connected ? networkStatus.wifiAddress : "offline"}`,
    `  Frontend local: ${networkStatus.frontendLocalUrl}`,
    networkStatus.frontendWifiUrl ? `  Frontend Wi-Fi: ${networkStatus.frontendWifiUrl}` : "",
    `  API local: ${networkStatus.apiLocalUrl}`,
    networkStatus.apiWifiUrl ? `  API Wi-Fi: ${networkStatus.apiWifiUrl}` : "",
  ].filter(Boolean);
  console.log(lines.join("\n"));
};

const startNetworkWatcher = () => {
  logNetworkStatus("ready");
  setInterval(() => {
    const nextStatus = buildNetworkStatus();
    const addressChanged = nextStatus.wifiAddress !== networkStatus.wifiAddress;
    const connectionChanged = nextStatus.connected !== networkStatus.connected;
    if (addressChanged || connectionChanged) {
      networkStatus = nextStatus;
      logNetworkStatus(nextStatus.connected ? "reconnected/refreshed" : "disconnected");
      broadcastNetworkStatus();
      return;
    }
    networkStatus = nextStatus;
  }, networkPollMs).unref();
};

const defaultCategories = [
  "General Contact",
  "Volunteer",
  "Partnership",
  "Prayer",
  "Brothers Keepers",
  "Daughters of the King",
  "Giving",
  "Pastoral Follow Up",
];
const leadershipStaffSeeds = [
  { name: "Monta (Ta') Cheathem", email: "monta.cheathem@allwallsdown.org", role: "Administrator" },
  { name: "Kim Cheathem", email: "kim.cheathem@allwallsdown.org", role: "Administrator" },
  { name: "Levell Cheathem", email: "levell.cheathem@allwallsdown.org" },
  { name: "Antoine Herron", email: "antoine.herron@allwallsdown.org" },
  { name: "Stephen MacKenzie", email: "stephen.mackenzie@allwallsdown.org" },
  { name: "Chris Smith", email: "chris.smith@allwallsdown.org" },
  { name: "Dr. Josh Snyder", email: "josh.snyder@allwallsdown.org" },
  { name: "Emilio Jesus Ortega", email: "emilio.ortega@allwallsdown.org" },
  { name: "Adrian Ahtone", email: "adrian.ahtone@allwallsdown.org" },
  { name: "Justin Hamlin", email: "justin.hamlin@allwallsdown.org" },
  { name: "Mon Lorenzo", email: "mon.lorenzo@allwallsdown.org" },
  { name: "Bobby Lowe", email: "bobby.lowe@allwallsdown.org" },
  { name: "Andrew Kirkland", email: "andrew.kirkland@allwallsdown.org" },
  { name: "Mike Best", email: "mike.best@allwallsdown.org" },
];
const defaultAdministrator = {
  id: "staff-jeremiah-johnson-admin",
  name: "Jeremiah Johnson",
  email: "treliasocialceo@gmail.com",
  role: "Administrator",
  roles: ["Administrator"],
  passwordHash: "",
  showOnLeadership: false,
  isActive: true,
  mfaRequired: false,
  mfaEnabled: false,
  mfaMethods: {},
  mfaEnrollmentStatus: "Administrator Exempt",
  requirePasswordReset: true,
  createdAt: "2026-06-26T00:00:00.000Z",
  updatedAt: "2026-06-26T00:00:00.000Z",
};
const defaultMfaPolicy = {
  requireMfaForStaff: true,
  exemptAdministrators: true,
  forceFirstLoginEnrollment: true,
  allowedMethods: {
    authenticator: true,
    googleAuthenticator: true,
    biometric: true,
    passwordManager: true,
  },
};

const defaultDb = {
  users: [],
  sessions: [],
  contacts: [],
  prayerRequests: [],
  testimonials: [],
  contactCategories: defaultCategories,
  emailMessages: [],
  mailSettings: {
    providerName: "Google Workspace",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    pop3Host: "pop.gmail.com",
    pop3Port: 995,
    username: "",
    fromName: "All Walls Down Organization",
    fromEmail: "",
    useTls: true,
  },
  mfaPolicy: defaultMfaPolicy,
  webAuthnChallenges: [],
};

const json = (response, status, body) => {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": process.env.AWD_ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Headers": "content-type, authorization, x-awd-staff-email",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(body));
};

const readBody = async (request) =>
  new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });

const ensureDb = async () => {
  await fs.mkdir(dataDir, { recursive: true });
  const seededDb = structuredClone(defaultDb);
  seededDb.users = [
    {
      ...defaultAdministrator,
      passwordHash: hashPassword(process.env.AWD_SEEDED_ADMIN_PASSWORD || "ChangeMe123!"),
    },
  ];
  try {
    const db = JSON.parse(await fs.readFile(dbPath, "utf8"));
    db.mfaPolicy = db.mfaPolicy || defaultMfaPolicy;
    const leadershipSeedNames = new Set(
      leadershipStaffSeeds.map((seed) => seed.name.toLowerCase()),
    );
    db.users = (db.users || []).map((user) => {
      const roles = Array.isArray(user.roles) && user.roles.length
        ? user.roles
        : [user.role || "Ministry Staff"];
      const isSeededLeadershipUser =
        leadershipSeedNames.has(String(user.name || "").toLowerCase()) ||
        leadershipStaffSeeds.some(
          (seed) => seed.email.toLowerCase() === String(user.email || "").toLowerCase(),
        );
      return {
        ...user,
        roles,
        role: user.role || roles[0],
        showOnLeadership:
          typeof user.showOnLeadership === "boolean"
            ? user.showOnLeadership
            : isSeededLeadershipUser,
        isActive: user.isActive !== false,
        mfaRequired:
          typeof user.mfaRequired === "boolean"
            ? user.mfaRequired
            : !roles.includes("Administrator"),
        mfaEnrollmentStatus:
          user.mfaEnrollmentStatus ||
          (Object.values(user.mfaMethods || {}).some(Boolean)
            ? "Enrolled"
            : roles.includes("Administrator")
              ? "Administrator Exempt"
              : "Required"),
      };
    });
    if (
      !db.users.some(
        (user) => user.email.toLowerCase() === defaultAdministrator.email.toLowerCase(),
      )
    ) {
      db.users.unshift(seededDb.users[0]);
    }
    leadershipStaffSeeds.forEach((seed) => {
      if (
        !db.users.some(
          (user) => user.email.toLowerCase() === seed.email.toLowerCase(),
        )
      ) {
        db.users.push(createSeededLeadershipUser(seed));
      }
    });
    await writeDb(db);
    return db;
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(seededDb, null, 2));
    return seededDb;
  }
};

const writeDb = async (db) => {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
};

const id = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(hashPassword(password, salt).split(":")[1], "hex"),
  );
};

const leadershipSeedId = (email) =>
  `staff-${email.split("@")[0].replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

const createSeededLeadershipUser = (seed) => {
  const roles = [seed.role || "Ministry Staff"];
  return {
    id: leadershipSeedId(seed.email),
    name: seed.name,
    email: seed.email,
    passwordHash: hashPassword("ChangeMe123!"),
    role: roles[0],
    roles,
    showOnLeadership: true,
    isActive: true,
    mfaRequired: !roles.includes("Administrator"),
    mfaEnabled: false,
    mfaMethods: {},
    mfaEnrollmentStatus: roles.includes("Administrator") ? "Administrator Exempt" : "Required",
    requirePasswordReset: true,
    createdAt: "2026-06-27T00:00:00.000Z",
    updatedAt: "2026-06-27T00:00:00.000Z",
  };
};

function getUserRoles(user) {
  return Array.isArray(user?.roles) && user.roles.length
    ? user.roles
    : [user?.role || "Ministry Staff"];
}

function isAdminUser(user) {
  const roles = getUserRoles(user);
  return roles.includes("Administrator") || roles.includes("User Admin");
}

function shouldRequireMfa(user, policy = defaultMfaPolicy) {
  if (!policy.requireMfaForStaff) return false;
  if (policy.exemptAdministrators && getUserRoles(user).includes("Administrator")) return false;
  return user?.mfaRequired !== false;
}

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const base32Secret = () => {
  const bytes = crypto.randomBytes(20);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  return bits
    .match(/.{1,5}/g)
    .map((chunk) => base32Alphabet[Number.parseInt(chunk.padEnd(5, "0"), 2)])
    .join("");
};

const decodeBase32 = (secret) => {
  let bits = "";
  for (const char of secret.replace(/=+$/g, "").toUpperCase()) {
    const value = base32Alphabet.indexOf(char);
    if (value >= 0) bits += value.toString(2).padStart(5, "0");
  }
  return Buffer.from(bits.match(/.{1,8}/g).map((byte) => Number.parseInt(byte, 2)));
};

const totp = (secret, step = Math.floor(Date.now() / 30000)) => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac("sha1", decodeBase32(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
};

const verifyTotp = (secret, token) => {
  const currentStep = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((drift) => totp(secret, currentStep + drift) === token);
};

const getSession = (request, db) => {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;
  const user = db.users.find((item) => item.id === session.userId && item.isActive !== false);
  return user ? { session, user } : null;
};

const requireAuth = (request, response, db) => {
  const auth = getSession(request, db);
  if (!auth) {
    json(response, 401, { error: "Authentication required" });
    return null;
  }
  return auth;
};

const requireUserAdmin = (request, response, db) => {
  const auth = requireAuth(request, response, db);
  if (!auth) return null;
  if (!isAdminUser(auth.user)) {
    json(response, 403, { error: "User Admin permission required" });
    return null;
  }
  return auth;
};

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || getUserRoles(user)[0],
  roles: getUserRoles(user),
  showOnLeadership: Boolean(user.showOnLeadership),
  isActive: user.isActive !== false,
  mfaRequired: Boolean(user.mfaRequired),
  mfaEnabled: Boolean(user.mfaEnabled),
  mfaMethods: user.mfaMethods || {},
  mfaEnrollmentStatus: user.mfaEnrollmentStatus || "Required",
  requirePasswordReset: Boolean(user.requirePasswordReset),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const routes = {
  "GET /api/health": async (_, response) => json(response, 200, { ok: true }),

  "GET /api/network-status": async (_, response) => {
    networkStatus = buildNetworkStatus();
    json(response, 200, networkStatus);
  },

  "GET /api/network-events": async (request, response) => {
    response.writeHead(200, {
      "Access-Control-Allow-Origin": process.env.AWD_ALLOWED_ORIGIN || "*",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    });
    networkStatus = buildNetworkStatus();
    networkClients.add(response);
    sendNetworkEvent(response, networkStatus);
    request.on("close", () => {
      networkClients.delete(response);
    });
  },

  "POST /api/auth/register": async (request, response, db) => {
    const body = await readBody(request);
    if (!body.email || !body.password || !body.name) {
      return json(response, 400, { error: "Name, email, and password are required" });
    }
    if (db.users.some((user) => user.email.toLowerCase() === body.email.toLowerCase())) {
      return json(response, 409, { error: "A staff user already exists for this email" });
    }
    const roles = db.users.length ? ["Ministry Staff"] : [body.role || "Administrator"];
    const user = {
      id: id("staff"),
      name: body.name,
      email: body.email,
      passwordHash: hashPassword(body.password),
      role: roles[0],
      roles,
      showOnLeadership: Boolean(body.showOnLeadership),
      isActive: true,
      mfaRequired: !roles.includes("Administrator"),
      mfaEnabled: false,
      mfaMethods: {},
      mfaEnrollmentStatus: roles.includes("Administrator") ? "Administrator Exempt" : "Required",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(user);
    await writeDb(db);
    json(response, 201, { user: publicUser(user) });
  },

  "POST /api/auth/login": async (request, response, db) => {
    const body = await readBody(request);
    const user = db.users.find(
      (item) => item.email.toLowerCase() === String(body.email || "").toLowerCase(),
    );
    if (!user || user.isActive === false || !verifyPassword(body.password, user.passwordHash)) {
      return json(response, 401, { error: "Invalid staff credentials" });
    }
    const mfaRequired = shouldRequireMfa(user, db.mfaPolicy);
    const hasMfa = Object.values(user.mfaMethods || {}).some(Boolean);
    if (db.mfaPolicy.forceFirstLoginEnrollment && mfaRequired && !hasMfa) {
      return json(response, 202, {
        mfaSetupRequired: true,
        methods: db.mfaPolicy.allowedMethods || {},
        user: publicUser(user),
      });
    }
    if (mfaRequired && user.mfaEnabled && !body.mfaToken) {
      return json(response, 202, { mfaRequired: true, methods: user.mfaMethods || {} });
    }
    if (user.totpSecret && body.mfaToken && !verifyTotp(user.totpSecret, body.mfaToken)) {
      return json(response, 401, { error: "Invalid MFA code" });
    }
    const session = {
      id: id("session"),
      userId: user.id,
      token: crypto.randomBytes(32).toString("hex"),
      createdAt: new Date().toISOString(),
    };
    db.sessions.push(session);
    await writeDb(db);
    json(response, 200, { token: session.token, user: publicUser(user) });
  },

  "GET /api/users": async (request, response, db) => {
    if (!requireUserAdmin(request, response, db)) return;
    json(response, 200, { users: db.users.map(publicUser) });
  },

  "POST /api/users": async (request, response, db) => {
    const auth = requireUserAdmin(request, response, db);
    if (!auth) return;
    const body = await readBody(request);
    if (!body.email || !body.password || !body.name) {
      return json(response, 400, { error: "Name, email, and password are required" });
    }
    if (db.users.some((user) => user.email.toLowerCase() === body.email.toLowerCase())) {
      return json(response, 409, { error: "A staff user already exists for this email" });
    }
    const roles = Array.isArray(body.roles) && body.roles.length
      ? body.roles
      : [body.role || "Ministry Staff"];
    const user = {
      id: id("staff"),
      name: body.name,
      email: body.email,
      passwordHash: hashPassword(body.password),
      role: roles[0],
      roles,
      showOnLeadership: Boolean(body.showOnLeadership),
      isActive: body.isActive !== false,
      mfaRequired:
        typeof body.mfaRequired === "boolean"
          ? body.mfaRequired
          : !roles.includes("Administrator"),
      mfaEnabled: false,
      mfaMethods: {},
      mfaEnrollmentStatus: roles.includes("Administrator")
        ? "Administrator Exempt"
        : "Required",
      requirePasswordReset: true,
      createdByUserId: auth.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(user);
    await writeDb(db);
    json(response, 201, { user: publicUser(user) });
  },

  "PATCH /api/users": async (request, response, db, url) => {
    const auth = requireUserAdmin(request, response, db);
    if (!auth) return;
    const userId = url.searchParams.get("id");
    const body = await readBody(request);
    const user = db.users.find((item) => item.id === userId);
    if (!user) return json(response, 404, { error: "Staff user not found" });
    if (Array.isArray(body.roles) && body.roles.length) {
      user.roles = body.roles;
      user.role = body.roles[0];
    } else if (body.role) {
      user.role = body.role;
      user.roles = [body.role];
    }
    if (typeof body.isActive === "boolean") user.isActive = body.isActive;
    if (typeof body.showOnLeadership === "boolean") {
      user.showOnLeadership = body.showOnLeadership;
    }
    if (typeof body.mfaRequired === "boolean") user.mfaRequired = body.mfaRequired;
    if (body.mfaMethods) user.mfaMethods = body.mfaMethods;
    if (typeof body.mfaEnabled === "boolean") user.mfaEnabled = body.mfaEnabled;
    if (body.mfaEnrollmentStatus) user.mfaEnrollmentStatus = body.mfaEnrollmentStatus;
    if (typeof body.requirePasswordReset === "boolean") {
      user.requirePasswordReset = body.requirePasswordReset;
    }
    if (body.password) user.passwordHash = hashPassword(body.password);
    user.updatedAt = new Date().toISOString();
    await writeDb(db);
    json(response, 200, { user: publicUser(user) });
  },

  "GET /api/users/me": async (request, response, db) => {
    const auth = requireAuth(request, response, db);
    if (!auth) return;
    json(response, 200, { user: publicUser(auth.user) });
  },

  "PATCH /api/users/me": async (request, response, db) => {
    const auth = requireAuth(request, response, db);
    if (!auth) return;
    const body = await readBody(request);
    Object.assign(auth.user, {
      name: body.name ?? auth.user.name,
      email: body.email ?? auth.user.email,
      updatedAt: new Date().toISOString(),
    });
    if (body.password) auth.user.passwordHash = hashPassword(body.password);
    await writeDb(db);
    json(response, 200, { user: publicUser(auth.user) });
  },

  "GET /api/mfa-policy": async (request, response, db) => {
    if (!requireUserAdmin(request, response, db)) return;
    json(response, 200, { mfaPolicy: db.mfaPolicy || defaultMfaPolicy });
  },

  "PATCH /api/mfa-policy": async (request, response, db) => {
    if (!requireUserAdmin(request, response, db)) return;
    const body = await readBody(request);
    db.mfaPolicy = {
      ...(db.mfaPolicy || defaultMfaPolicy),
      ...body,
      allowedMethods: {
        ...((db.mfaPolicy || defaultMfaPolicy).allowedMethods || {}),
        ...(body.allowedMethods || {}),
      },
    };
    await writeDb(db);
    json(response, 200, { mfaPolicy: db.mfaPolicy });
  },

  "POST /api/mfa/totp/setup": async (request, response, db) => {
    const auth = requireAuth(request, response, db);
    if (!auth) return;
    auth.user.pendingTotpSecret = base32Secret();
    await writeDb(db);
    json(response, 200, {
      secret: auth.user.pendingTotpSecret,
      otpauthUrl: `otpauth://totp/AWD:${encodeURIComponent(auth.user.email)}?secret=${auth.user.pendingTotpSecret}&issuer=All%20Walls%20Down`,
    });
  },

  "POST /api/mfa/totp/verify": async (request, response, db) => {
    const auth = requireAuth(request, response, db);
    if (!auth) return;
    const body = await readBody(request);
    if (!auth.user.pendingTotpSecret || !verifyTotp(auth.user.pendingTotpSecret, body.token)) {
      return json(response, 400, { error: "Invalid authenticator code" });
    }
    auth.user.totpSecret = auth.user.pendingTotpSecret;
    delete auth.user.pendingTotpSecret;
    auth.user.mfaEnabled = true;
    auth.user.mfaMethods = { ...(auth.user.mfaMethods || {}), authenticator: true };
    auth.user.mfaEnrollmentStatus = "Enrolled";
    auth.user.lastMfaUpdatedAt = new Date().toISOString();
    await writeDb(db);
    json(response, 200, { user: publicUser(auth.user) });
  },

  "POST /api/webauthn/register/options": async (request, response, db) => {
    const auth = requireAuth(request, response, db);
    if (!auth) return;
    const challenge = crypto.randomBytes(32).toString("base64url");
    db.webAuthnChallenges.push({
      id: id("webauthn"),
      userId: auth.user.id,
      challenge,
      createdAt: new Date().toISOString(),
    });
    await writeDb(db);
    json(response, 200, {
      challenge,
      rp: { name: "All Walls Down Organization" },
      user: { id: auth.user.id, name: auth.user.email, displayName: auth.user.name },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    });
  },

  "GET /api/contact-categories": async (request, response, db) => {
    if (!requireAuth(request, response, db)) return;
    json(response, 200, { categories: db.contactCategories });
  },

  "POST /api/contact-categories": async (request, response, db) => {
    if (!requireAuth(request, response, db)) return;
    const body = await readBody(request);
    const category = String(body.category || "").trim();
    if (!category) return json(response, 400, { error: "Category is required" });
    if (!db.contactCategories.includes(category)) db.contactCategories.push(category);
    await writeDb(db);
    json(response, 201, { categories: db.contactCategories });
  },

  "GET /api/contacts": async (request, response, db, url) => {
    if (!requireAuth(request, response, db)) return;
    const status = url.searchParams.get("status") || "active";
    const category = url.searchParams.get("category") || "";
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const contacts = db.contacts.filter((contact) => {
      const statusOk =
        status === "all" ||
        (status === "active" ? contact.status !== "Closed" : contact.status === status);
      const categoryOk = !category || contact.category === category;
      const queryOk =
        !q ||
        [contact.name, contact.email, contact.phone, contact.category, contact.reason]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q));
      return statusOk && categoryOk && queryOk;
    });
    json(response, 200, { contacts });
  },

  "POST /api/contacts": async (request, response, db) => {
    const body = await readBody(request);
    if (!body.name || !body.email || !body.message) {
      return json(response, 400, { error: "Name, email, and message are required" });
    }
    const contact = {
      id: id("contact"),
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      category: body.category || body.reason || "General Contact",
      reason: body.reason || "General Contact",
      status: body.status || "New",
      tags: body.tags || [],
      priority: body.priority || "Normal",
      assignedTo: body.assignedTo || "",
      nextFollowUp: body.nextFollowUp || "",
      message: body.message || "",
      notes: body.notes || "",
      emailHistory: [],
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.contacts.unshift(contact);
    await writeDb(db);
    json(response, 201, { contact });
  },

  "PATCH /api/contacts": async (request, response, db, url) => {
    if (!requireAuth(request, response, db)) return;
    const contact = db.contacts.find((item) => item.id === url.searchParams.get("id"));
    if (!contact) return json(response, 404, { error: "Contact not found" });
    Object.assign(contact, await readBody(request), { updatedAt: new Date().toISOString() });
    await writeDb(db);
    json(response, 200, { contact });
  },

  "GET /api/prayer-requests": async (request, response, db, url) => {
    if (!requireAuth(request, response, db)) return;
    const status = url.searchParams.get("status") || "all";
    const requests = (db.prayerRequests || []).filter((item) =>
      status === "all" ? true : item.status === status,
    );
    json(response, 200, { prayerRequests: requests });
  },

  "POST /api/prayer-requests": async (request, response, db) => {
    const body = await readBody(request);
    if (!body.name || !body.request) {
      return json(response, 400, { error: "Name and prayer request are required" });
    }
    const prayerRequest = {
      id: id("prayer"),
      name: body.name,
      email: body.email || "",
      phone: body.phone || "",
      request: body.request,
      isConfidential: Boolean(body.isConfidential),
      status: "Pending Prayer",
      notes: "",
      submittedAt: new Date().toISOString(),
      prayedAt: "",
      updatedAt: new Date().toISOString(),
    };
    db.prayerRequests = db.prayerRequests || [];
    db.prayerRequests.unshift(prayerRequest);
    await writeDb(db);
    json(response, 201, { prayerRequest });
  },

  "PATCH /api/prayer-requests": async (request, response, db, url) => {
    if (!requireAuth(request, response, db)) return;
    const prayerRequest = (db.prayerRequests || []).find(
      (item) => item.id === url.searchParams.get("id"),
    );
    if (!prayerRequest) return json(response, 404, { error: "Prayer request not found" });
    const patch = await readBody(request);
    Object.assign(prayerRequest, patch, {
      prayedAt:
        patch.status === "We have Prayed"
          ? new Date().toISOString()
          : prayerRequest.prayedAt,
      updatedAt: new Date().toISOString(),
    });
    await writeDb(db);
    json(response, 200, { prayerRequest });
  },

  "GET /api/testimonials": async (request, response, db, url) => {
    if (!requireAuth(request, response, db)) return;
    const status = url.searchParams.get("status") || "all";
    const display = url.searchParams.get("display");
    const testimonials = (db.testimonials || []).filter((item) => {
      const statusOk = status === "all" ? true : item.status === status;
      const displayOk =
        display === null ? true : String(Boolean(item.displayOnSite)) === display;
      return statusOk && displayOk;
    });
    json(response, 200, { testimonials });
  },

  "POST /api/testimonials": async (request, response, db) => {
    const body = await readBody(request);
    if (!body.name || !body.email || !body.quote) {
      return json(response, 400, { error: "Name, email, and testimony are required" });
    }
    const testimonial = {
      id: id("testimonial"),
      name: body.name,
      email: body.email,
      city: body.city || "",
      ministry: body.ministry || "All Walls Down",
      quote: body.quote,
      status: "Pending Review",
      displayOnSite: false,
      notes: "",
      submittedAt: new Date().toISOString(),
      reviewedAt: "",
      updatedAt: new Date().toISOString(),
    };
    db.testimonials = db.testimonials || [];
    db.testimonials.unshift(testimonial);
    await writeDb(db);
    json(response, 201, { testimonial });
  },

  "PATCH /api/testimonials": async (request, response, db, url) => {
    if (!requireAuth(request, response, db)) return;
    const testimonial = (db.testimonials || []).find(
      (item) => item.id === url.searchParams.get("id"),
    );
    if (!testimonial) return json(response, 404, { error: "Testimonial not found" });
    const patch = await readBody(request);
    Object.assign(testimonial, patch, {
      reviewedAt:
        patch.status === "Approved" ? new Date().toISOString() : testimonial.reviewedAt,
      displayOnSite: patch.status && patch.status !== "Approved" ? false : testimonial.displayOnSite,
      updatedAt: new Date().toISOString(),
    });
    await writeDb(db);
    json(response, 200, { testimonial });
  },

  "PATCH /api/mail-settings": async (request, response, db) => {
    if (!requireUserAdmin(request, response, db)) return;
    db.mailSettings = { ...db.mailSettings, ...(await readBody(request)) };
    await writeDb(db);
    json(response, 200, { mailSettings: db.mailSettings });
  },

  "POST /api/email/send": async (request, response, db) => {
    const body = await readBody(request);
    const auth =
      getSession(request, db) ||
      (() => {
        const staffEmail = request.headers["x-awd-staff-email"];
        const user = db.users.find(
          (item) =>
            item.email.toLowerCase() === String(staffEmail || "").toLowerCase() &&
            item.isActive !== false,
        );
        if (user) return { session: null, user };
        const localStaff = body?.staff;
        return localStaff?.email &&
          String(localStaff.email).toLowerCase() === String(staffEmail || "").toLowerCase()
          ? {
              session: null,
              user: {
                id: localStaff.id || id("staff"),
                name: localStaff.name || localStaff.email,
                email: localStaff.email,
                roles: ["Ministry Staff"],
              },
            }
          : null;
      })();
    if (!auth) return json(response, 401, { error: "Authentication required" });
    const settings = { ...db.mailSettings, ...(body.smtp || {}) };
    if (!body.to || !body.subject || !(body.text || body.message || body.html)) {
      return json(response, 400, { error: "Recipient, subject, and message are required" });
    }
    if (!settings.smtpHost || !settings.smtpPort || !settings.username || !settings.password) {
      return json(response, 400, {
        error: "SMTP host, port, username, and password are required",
      });
    }
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: Number(settings.smtpPort),
      secure: Number(settings.smtpPort) === 465,
      auth: settings.username && settings.password
        ? { user: settings.username, pass: settings.password }
        : undefined,
      tls: { rejectUnauthorized: settings.useTls !== false },
    });
    const message = {
      from: `"${settings.fromName}" <${settings.fromEmail || settings.username}>`,
      to: body.to,
      subject: body.subject,
      text: body.text || body.message,
      html: body.html,
    };
    const record = {
      id: id("email"),
      contactId: body.contactId || "",
      staffUserId: auth.user.id,
      toEmail: body.to,
      subject: body.subject,
      status: "Queued",
      preparedAt: new Date().toISOString(),
    };
    try {
      const sent = await transporter.sendMail(message);
      record.status = "Sent";
      record.sentAt = new Date().toISOString();
      record.providerMessageId = sent.messageId;
      db.emailMessages.unshift(record);
      await writeDb(db);
      json(response, 200, { email: record });
    } catch (error) {
      record.status = "Failed";
      record.errorMessage = error.message;
      db.emailMessages.unshift(record);
      await writeDb(db);
      json(response, 502, { error: "Email send failed", email: record });
    }
  },
};

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return json(response, 204, {});
  const url = new URL(request.url, `http://${request.headers.host}`);
  const db = await ensureDb();
  const route = routes[`${request.method} ${url.pathname}`];
  if (!route) return json(response, 404, { error: "Route not found" });
  try {
    await route(request, response, db, url);
  } catch (error) {
    json(response, 500, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`AWD identity/email API listening on http://localhost:${port}`);
  startNetworkWatcher();
});
