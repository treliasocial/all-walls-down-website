import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const dbPath = path.join(dataDir, "portal.sqlite");
const legacyJsonDbPath = path.join(dataDir, "portal-db.json");
const legacyJsonBackupPath = path.join(dataDir, "portal-db.backup.json");
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
const roleNames = Object.keys(rolePermissions);
const editableUserFields = ["name", "title", "ministry", "phone", "bio", "image", "notes", "showOnLeadership", "isActive"];

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

const jsonColumns = {
  users: ["roles", "recoveryCodes"],
  auditLogs: ["metadata"],
  securityEvents: ["metadata"],
};

const tablePrimaryKeys = {
  users: "id",
  sessions: "id",
  loginChallenges: "id",
  contacts: "id",
  prayerRequests: "id",
  testimonials: "id",
  donations: "id",
  auditLogs: "id",
  securityEvents: "id",
  settings: "key",
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
  title: user.title || "",
  ministry: user.ministry || "",
  phone: user.phone || "",
  bio: user.bio || "",
  image: user.image || "",
  notes: user.notes || "",
  showOnLeadership: Boolean(user.showOnLeadership),
  roles: user.roles || [],
  permissions: getPermissions(user),
  isActive: user.isActive !== false,
  mfaRequired: user.mfaRequired !== false,
  mfaEnabled: Boolean(user.mfaEnabled),
  mfaEnrolledAt: user.mfaEnrolledAt || "",
  requirePasswordReset: Boolean(user.requirePasswordReset),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  deactivatedAt: user.deactivatedAt || "",
});

const publicStaffUser = (user) => ({
  id: user.id,
  name: user.name,
  title: user.title || "",
  ministry: user.ministry || "",
  bio: user.bio || "",
  image: user.image || "",
  showOnLeadership: Boolean(user.showOnLeadership),
});

const getPermissions = (user) => {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (roles.some((role) => rolePermissions[role]?.includes("*"))) return allPermissions;
  return [...new Set(roles.flatMap((role) => rolePermissions[role] || []))];
};

const hasPermission = (user, permission) => getPermissions(user).includes(permission);
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const sanitizeRoles = (roles) => {
  const assigned = [...new Set((Array.isArray(roles) ? roles : []).filter((role) => roleNames.includes(role)))];
  return assigned.length > 1 ? assigned.filter((role) => role !== "Read Only") : assigned;
};
const randomPassword = () => `${crypto.randomBytes(9).toString("base64url")}A1!`;
const leadershipPinnedNames = ["monta", "kim"];
const isPinnedLeadershipUser = (user) => {
  const name = String(user?.name || "").toLowerCase();
  return leadershipPinnedNames.some((item) => new RegExp(`(^|\\s|\\W)${item}(\\s|\\W|$)`, "i").test(name));
};

const staffPayload = (user, db) => ({
  ...safeUser(user),
  activeSessions: db.sessions.filter((session) => session.userId === user.id && !session.revokedAt && new Date(session.expiresAt).getTime() > Date.now()).length,
});

const userAuditHistory = (db, userId) =>
  db.auditLogs
    .filter((item) => item.entityType === "user" && item.entityId === userId)
    .slice(0, 30);

let sqlDb;

const openSqlDb = async () => {
  if (sqlDb) return sqlDb;
  await fs.mkdir(dataDir, { recursive: true });
  sqlDb = new DatabaseSync(dbPath);
  sqlDb.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      title TEXT DEFAULT '',
      ministry TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      image TEXT DEFAULT '',
      showOnLeadership INTEGER DEFAULT 0,
      passwordHash TEXT NOT NULL,
      roles TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      mfaRequired INTEGER DEFAULT 1,
      mfaEnabled INTEGER DEFAULT 0,
      mfaEnrolledAt TEXT DEFAULT '',
      totpSecret TEXT,
      pendingTotpSecret TEXT,
      recoveryCodes TEXT DEFAULT '[]',
      requirePasswordReset INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deactivatedAt TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      tokenHash TEXT NOT NULL UNIQUE,
      mfaVerified INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      lastSeenAt TEXT,
      idleExpiresAt TEXT,
      revokedAt TEXT DEFAULT '',
      ipAddress TEXT DEFAULT '',
      userAgent TEXT DEFAULT '',
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS loginChallenges (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, payload TEXT NOT NULL, status TEXT DEFAULT 'New', submittedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS prayerRequests (id TEXT PRIMARY KEY, payload TEXT NOT NULL, status TEXT DEFAULT 'Pending', submittedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS testimonials (id TEXT PRIMARY KEY, payload TEXT NOT NULL, status TEXT DEFAULT 'Pending Review', submittedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS donations (id TEXT PRIMARY KEY, payload TEXT NOT NULL, status TEXT DEFAULT '', submittedAt TEXT DEFAULT '');
    CREATE TABLE IF NOT EXISTS auditLogs (
      id TEXT PRIMARY KEY,
      actorUserId TEXT,
      actorEmail TEXT,
      action TEXT NOT NULL,
      entityType TEXT,
      entityId TEXT,
      ipAddress TEXT DEFAULT '',
      userAgent TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS securityEvents (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      severity TEXT NOT NULL,
      actorUserId TEXT,
      actorEmail TEXT,
      ipAddress TEXT DEFAULT '',
      userAgent TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  const userColumns = new Set(sqlDb.prepare("PRAGMA table_info(users)").all().map((column) => column.name));
  if (!userColumns.has("notes")) sqlDb.exec("ALTER TABLE users ADD COLUMN notes TEXT DEFAULT ''");
  return sqlDb;
};

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeSqlRow = (table, row) => {
  if (!row) return row;
  const normalized = { ...row };
  for (const column of jsonColumns[table] || []) normalized[column] = parseJson(normalized[column], column === "metadata" ? {} : []);
  for (const key of ["showOnLeadership", "isActive", "mfaRequired", "mfaEnabled", "requirePasswordReset", "mfaVerified"]) {
    if (key in normalized) normalized[key] = Boolean(normalized[key]);
  }
  if (table === "contacts" || table === "prayerRequests" || table === "testimonials" || table === "donations") {
    return { ...parseJson(normalized.payload, {}), id: normalized.id, status: normalized.status, submittedAt: normalized.submittedAt };
  }
  return normalized;
};

const readSqlTable = (database, table, orderBy = "") =>
  database.prepare(`SELECT * FROM ${table}${orderBy ? ` ORDER BY ${orderBy}` : ""}`).all().map((row) => normalizeSqlRow(table, row));

const upsertRows = (database, table, rows) => {
  const key = tablePrimaryKeys[table];
  for (const row of rows) {
    let payload = { ...row };
    if (table === "contacts" || table === "prayerRequests" || table === "testimonials" || table === "donations") {
      payload = { id: row.id, status: row.status || "", submittedAt: row.submittedAt || "", payload: JSON.stringify(row) };
    }
    for (const column of jsonColumns[table] || []) payload[column] = JSON.stringify(payload[column] || (column === "metadata" ? {} : []));
    for (const keyName of ["showOnLeadership", "isActive", "mfaRequired", "mfaEnabled", "requirePasswordReset", "mfaVerified"]) {
      if (keyName in payload) payload[keyName] = payload[keyName] ? 1 : 0;
    }
    const columns = Object.keys(payload);
    const placeholders = columns.map(() => "?").join(", ");
    const updates = columns.filter((column) => column !== key).map((column) => `${column} = excluded.${column}`).join(", ");
    database.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT(${key}) DO UPDATE SET ${updates}`).run(...columns.map((column) => payload[column] ?? ""));
  }
};

const migrateLegacyJson = async (database) => {
  const userCount = database.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (userCount) return;
  let legacyDb = null;
  for (const legacyPath of [legacyJsonDbPath, legacyJsonBackupPath]) {
    try {
      const candidate = JSON.parse(await fs.readFile(legacyPath, "utf8"));
      if (candidate.users?.length) {
        legacyDb = candidate;
        break;
      }
    } catch {
      // Ignore missing or invalid legacy files.
    }
  }
  if (legacyDb) await writeDb({ ...structuredClone(defaultDb), ...legacyDb });
};

const sampleCrmContacts = () => {
  const now = Date.now();
  return [
    ["contact_sample_1", "Michelle Johnson", "michelle.johnson@example.com", "(214) 555-0182", "Partnership", "New", "High", "Communications", "2026-07-12", "Interested in partnering for a community outreach weekend.", "Called once, wants a ministry overview packet."],
    ["contact_sample_2", "David Anderson", "david.anderson@example.com", "(214) 555-0144", "Volunteer", "In Progress", "Normal", "Prayer Team", "2026-07-09", "Asked how to volunteer with family support and outreach events.", "Send volunteer onboarding steps."],
    ["contact_sample_3", "Tiffany Brooks", "tiffany.brooks@example.com", "(972) 555-0199", "Speaking Request", "Follow-Up Needed", "Urgent", "Leadership Team", "2026-07-06", "Requested an AWD speaker for a youth leadership gathering.", "Needs a call back before Friday."],
    ["contact_sample_4", "Marcus Williams", "marcus.williams@example.com", "(469) 555-0173", "General Contact", "Resolved", "Low", "Communications", "", "Asked for general information about All Walls Down.", "Information sent by email."],
    ["contact_sample_5", "Alicia Thompson", "alicia.thompson@example.com", "(817) 555-0128", "Ministry Support", "New", "Normal", "Content Ministry", "2026-07-15", "Looking for ministry resources for a local small group.", ""],
  ].map(([idValue, name, email, phone, reason, status, priority, assignedTo, followUpDate, message, notes], index) => ({
    id: idValue,
    name,
    email,
    phone,
    reason,
    status,
    priority,
    assignedTo,
    followUpDate,
    message,
    notes,
    activity: notes ? [{ note: notes, actor: "System sample", createdAt: new Date(now - index * 86400000).toISOString() }] : [],
    submittedAt: new Date(now - (index + 1) * 7200000).toISOString(),
    updatedAt: new Date(now - index * 3600000).toISOString(),
  }));
};

const loadDb = async () => {
  const database = await openSqlDb();
  await migrateLegacyJson(database);
  const settingsRows = database.prepare("SELECT key, value FROM settings").all();
  const db = {
    ...structuredClone(defaultDb),
    users: readSqlTable(database, "users", "createdAt DESC"),
    sessions: readSqlTable(database, "sessions", "createdAt DESC"),
    loginChallenges: readSqlTable(database, "loginChallenges", "expiresAt DESC"),
    contacts: readSqlTable(database, "contacts", "submittedAt DESC"),
    prayerRequests: readSqlTable(database, "prayerRequests", "submittedAt DESC"),
    testimonials: readSqlTable(database, "testimonials", "submittedAt DESC"),
    donations: readSqlTable(database, "donations", "submittedAt DESC"),
    auditLogs: readSqlTable(database, "auditLogs", "createdAt DESC"),
    securityEvents: readSqlTable(database, "securityEvents", "createdAt DESC"),
    settings: {
      ...defaultDb.settings,
      ...Object.fromEntries(settingsRows.map((row) => [row.key, row.value])),
    },
  };
  const bootstrapped = await bootstrapAdmin(db);
  const seededLeadershipAccounts = ensureLeadershipAccounts(db);
  let seededContacts = false;
  if (!db.contacts.length && process.env.AWD_SEED_SAMPLE_CONTACTS !== "false") {
    db.contacts = sampleCrmContacts();
    seededContacts = true;
  }
  if (bootstrapped || seededLeadershipAccounts || seededContacts) await writeDb(db);
  return db;
};

const writeDb = async (db) => {
  const database = await openSqlDb();
  database.exec("BEGIN IMMEDIATE");
  try {
    upsertRows(database, "users", db.users || []);
    upsertRows(database, "sessions", db.sessions || []);
    upsertRows(database, "loginChallenges", db.loginChallenges || []);
    upsertRows(database, "contacts", db.contacts || []);
    upsertRows(database, "prayerRequests", db.prayerRequests || []);
    upsertRows(database, "testimonials", db.testimonials || []);
    upsertRows(database, "donations", db.donations || []);
    upsertRows(database, "auditLogs", db.auditLogs || []);
    upsertRows(database, "securityEvents", db.securityEvents || []);
    const nextSettings = db.settings || defaultDb.settings;
    for (const [key, value] of Object.entries(nextSettings)) {
      database.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, String(value));
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
};

const markDbForWrite = (db) => {
  Object.defineProperty(db, "__needsWrite", { value: true, writable: true, enumerable: false, configurable: true });
};

const bootstrapAdmin = async (db) => {
  if (db.users.length) return false;
  const email = process.env.AWD_ADMIN_EMAIL;
  const name = process.env.AWD_ADMIN_NAME;
  const password = process.env.AWD_ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !name || !password || password.length < 12 || !getSessionSecret()) return false;
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
  return true;
};

const ensureLeadershipAccounts = (db) => {
  const now = new Date().toISOString();
  const leaders = [
    { name: "Monta (Ta') Cheathem", email: "monta.cheathem@allwallsdown.org", title: "Founder / Director", ministry: "Brothers Keepers" },
    { name: "Kim Cheathem", email: "kim.cheathem@allwallsdown.org", title: "Founder / Director", ministry: "Daughters of the King" },
    { name: "Levell Cheathem", email: "levell.cheathem@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
    { name: "Antoine Herron", email: "antoine.herron@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
    { name: "Stephen MacKenzie", email: "stephen.mackenzie@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
    { name: "Chris Smith", email: "chris.smith@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
    { name: "Dr. Josh Snyder", email: "josh.snyder@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
    { name: "Emilio Jesus Ortega", email: "emilio.ortega@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
    { name: "Adrian Ahtone", email: "adrian.ahtone@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
    { name: "Justin Hamlin", email: "justin.hamlin@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
    { name: "Mon Lorenzo", email: "mon.lorenzo@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
    { name: "Bobby Lowe", email: "bobby.lowe@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
    { name: "Andrew Kirkland", email: "andrew.kirkland@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
    { name: "Mike Best", email: "mike.best@allwallsdown.org", title: "Core Leadership", ministry: "Brothers Keepers" },
  ];
  let changed = false;
  for (const leader of leaders) {
    const existing = db.users.find((user) => normalizeEmail(user.email) === leader.email);
    if (existing) {
      for (const [key, value] of Object.entries({ title: leader.title, ministry: leader.ministry, showOnLeadership: true, isActive: true })) {
        if (existing[key] !== value) {
          existing[key] = value;
          changed = true;
        }
      }
      continue;
    }
    const user = {
      id: id("user"),
      name: leader.name,
      email: leader.email,
      title: leader.title,
      ministry: leader.ministry,
      phone: "",
      bio: "",
      image: "",
      notes: "Seeded ministry leader account.",
      showOnLeadership: true,
      passwordHash: hashSecret(randomPassword()),
      roles: ["Read Only"],
      isActive: true,
      mfaRequired: true,
      mfaEnabled: false,
      requirePasswordReset: true,
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(user);
    writeAudit(db, null, "user.leadership_seeded", "user", user.id, { email: user.email });
    changed = true;
  }
  return changed;
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

const securityHeaders = () => {
  const wifiAddress = getWifiAddress();
  const connectSources = [
    "'self'",
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
    ...(wifiAddress ? [`http://${wifiAddress}:${port}`] : []),
  ];
  return {
    "Content-Security-Policy": `default-src 'self'; frame-ancestors 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src ${connectSources.join(" ")}`,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "X-Frame-Options": "SAMEORIGIN",
    ...(isProduction ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } : {}),
  };
};

const corsHeaders = (request) => {
  const origin = request.headers.origin;
  const allowOrigin = corsOrigins.includes(origin) || isLocalDevOrigin(origin) ? origin : corsOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
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

  "PATCH /api/auth/me": async (request, response, db) => {
    const auth = requireAuth(request, response, db);
    if (!auth) return;
    const body = await readBody(request);
    for (const field of ["name", "title", "ministry", "phone", "bio", "image", "notes", "showOnLeadership"]) {
      if (Object.hasOwn(body, field)) {
        auth.user[field] = field === "showOnLeadership" ? Boolean(body[field]) : String(body[field] || "").trim();
      }
    }
    auth.user.updatedAt = new Date().toISOString();
    writeAudit(db, auth, "profile.updated", "user", auth.user.id, { fields: Object.keys(body) }, request);
    await writeDb(db);
    sendJson(request, response, 200, { user: safeUser(auth.user) });
  },

  "POST /api/auth/change-password": async (request, response, db) => {
    const auth = requireAuth(request, response, db);
    if (!auth) return;
    const body = await readBody(request);
    const currentPassword = String(body.currentPassword || "");
    const nextPassword = String(body.nextPassword || "");
    if (!verifyHash(currentPassword, auth.user.passwordHash)) return sendJson(request, response, 400, { error: "Current password is incorrect." });
    if (nextPassword.length < 12) return sendJson(request, response, 400, { error: "New password must be at least 12 characters." });
    auth.user.passwordHash = hashSecret(nextPassword);
    auth.user.requirePasswordReset = false;
    auth.user.updatedAt = new Date().toISOString();
    writeAudit(db, auth, "profile.password_changed", "user", auth.user.id, {}, request);
    await writeDb(db);
    sendJson(request, response, 200, { ok: true });
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

  "GET /api/users": async (request, response, db) => {
    const auth = requireAuth(request, response, db, "users.read");
    if (!auth) return;
    sendJson(request, response, 200, {
      users: db.users.map((user) => staffPayload(user, db)),
      roles: roleNames,
    });
  },

  "POST /api/users": async (request, response, db) => {
    const auth = requireAuth(request, response, db, "users.create");
    if (!auth) return;
    const body = await readBody(request);
    const email = normalizeEmail(body.email);
    if (!isValidEmail(email)) return sendJson(request, response, 400, { error: "Enter a valid staff email address." });
    if (db.users.some((user) => user.email === email)) return sendJson(request, response, 409, { error: "A staff account already exists for this email." });
    const roles = sanitizeRoles(body.roles);
    if (!roles.length) return sendJson(request, response, 400, { error: "Select at least one role." });
    if (!hasPermission(auth.user, "roles.manage") && roles.join("|") !== "Read Only") return sendJson(request, response, 403, { error: "Role management permission is required." });
    const password = String(body.temporaryPassword || "").trim() || randomPassword();
    if (password.length < 12) return sendJson(request, response, 400, { error: "Temporary password must be at least 12 characters." });
    const now = new Date().toISOString();
    const user = {
      id: id("user"),
      name: String(body.name || email).trim(),
      email,
      title: String(body.title || "").trim(),
      ministry: String(body.ministry || "").trim(),
      phone: String(body.phone || "").trim(),
      bio: String(body.bio || "").trim(),
      image: String(body.image || "").trim(),
      showOnLeadership: Boolean(body.showOnLeadership),
      passwordHash: hashSecret(password),
      roles,
      isActive: true,
      mfaRequired: true,
      mfaEnabled: false,
      requirePasswordReset: true,
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(user);
    writeAudit(db, auth, "user.created", "user", user.id, { email: user.email, roles });
    await writeDb(db);
    sendJson(request, response, 201, { user: staffPayload(user, db), temporaryPassword: body.temporaryPassword ? undefined : password });
  },

  "GET /api/public/leadership": async (request, response, db) => {
    const users = db.users
      .filter((user) => user.isActive !== false && (user.showOnLeadership || isPinnedLeadershipUser(user)))
      .map(publicStaffUser);
    sendJson(request, response, 200, { users });
  },

  "POST /api/public/contact": async (request, response, db) => {
    const body = await readBody(request);
    const now = new Date().toISOString();
    db.contacts.unshift({
      id: id("contact"),
      name: String(body.name || "").trim(),
      email: normalizeEmail(body.email),
      phone: String(body.phone || "").trim(),
      reason: String(body.reason || body.category || "General Contact").trim(),
      message: String(body.message || "").trim(),
      status: "New",
      priority: "Normal",
      assignedTo: "",
      followUpDate: "",
      notes: "",
      activity: [{ note: "Created from public website contact form.", actor: "Public website", createdAt: now }],
      submittedAt: now,
      updatedAt: now,
    });
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
    const now = new Date().toISOString();
    db.testimonials.unshift({
      id: id("testimonial"),
      name: String(body.name || "").trim(),
      email: normalizeEmail(body.email),
      city: String(body.city || "").trim(),
      ministry: String(body.ministry || "All Walls Down").trim(),
      quote: String(body.quote || body.story || body.message || "").trim(),
      story: String(body.story || body.quote || body.message || "").trim(),
      status: "Pending Review",
      displayOnSite: false,
      featured: false,
      notes: "",
      submittedAt: now,
      updatedAt: now,
    });
    await writeDb(db);
    sendJson(request, response, 201, { ok: true });
  },

  "GET /api/public/testimonials": async (request, response, db) => {
    const testimonials = db.testimonials
      .filter((item) => item.status === "Approved" && item.displayOnSite)
      .map((item) => ({
        id: item.id,
        name: item.name || "AWD Community Member",
        city: item.city || "",
        ministry: item.ministry || "All Walls Down",
        quote: item.quote || item.story || item.message || "",
        featured: Boolean(item.featured),
        submittedAt: item.submittedAt || "",
      }));
    sendJson(request, response, 200, { testimonials });
  },
};

const handleUserRoute = async (request, response, db, url) => {
  const match = url.pathname.match(/^\/api\/users\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return false;
  const [, userId, action] = match;
  const user = db.users.find((item) => item.id === userId);
  if (!user) {
    const auth = requireAuth(request, response, db, "users.read");
    if (!auth) return true;
    sendJson(request, response, 404, { error: "Staff account not found." });
    return true;
  }

  if (request.method === "GET" && !action) {
    const auth = requireAuth(request, response, db, "users.read");
    if (!auth) return true;
    sendJson(request, response, 200, { user: staffPayload(user, db), auditHistory: userAuditHistory(db, user.id), roles: roleNames });
    return true;
  }

  if (request.method === "PATCH" && !action) {
    const auth = requireAuth(request, response, db, "users.update");
    if (!auth) return true;
    const body = await readBody(request);
    if (Array.isArray(body.roles)) {
      if (!hasPermission(auth.user, "roles.manage")) return sendJson(request, response, 403, { error: "Role management permission is required." });
      const roles = sanitizeRoles(body.roles);
      if (!roles.length) return sendJson(request, response, 400, { error: "Select at least one role." });
      user.roles = roles;
    }
    for (const field of editableUserFields) {
      if (Object.hasOwn(body, field)) {
        user[field] = field === "showOnLeadership" || field === "isActive" ? Boolean(body[field]) : String(body[field] || "").trim();
      }
    }
    user.updatedAt = new Date().toISOString();
    writeAudit(db, auth, "user.updated", "user", user.id, { fields: Object.keys(body).filter((field) => field !== "temporaryPassword") }, request);
    await writeDb(db);
    sendJson(request, response, 200, { user: staffPayload(user, db), auditHistory: userAuditHistory(db, user.id) });
    return true;
  }

  if (request.method === "POST" && action === "force-password-reset") {
    const auth = requireAuth(request, response, db, "users.update");
    if (!auth) return true;
    user.requirePasswordReset = true;
    user.updatedAt = new Date().toISOString();
    writeAudit(db, auth, "user.password_reset_required", "user", user.id, {}, request);
    await writeDb(db);
    sendJson(request, response, 200, { user: staffPayload(user, db) });
    return true;
  }

  if (request.method === "POST" && action === "reset-mfa") {
    const auth = requireAuth(request, response, db, "security.manage");
    if (!auth) return true;
    delete user.totpSecret;
    delete user.pendingTotpSecret;
    user.mfaEnabled = false;
    user.mfaRequired = true;
    user.mfaEnrolledAt = "";
    user.updatedAt = new Date().toISOString();
    db.sessions.forEach((session) => {
      if (session.userId === user.id && !session.revokedAt) session.revokedAt = new Date().toISOString();
    });
    writeAudit(db, auth, "user.mfa_reset", "user", user.id, {}, request);
    await writeDb(db);
    sendJson(request, response, 200, { user: staffPayload(user, db) });
    return true;
  }

  if (request.method === "POST" && action === "revoke-sessions") {
    const auth = requireAuth(request, response, db, "security.manage");
    if (!auth) return true;
    db.sessions.forEach((session) => {
      if (session.userId === user.id && !session.revokedAt) session.revokedAt = new Date().toISOString();
    });
    writeAudit(db, auth, "user.sessions_revoked", "user", user.id, {}, request);
    await writeDb(db);
    sendJson(request, response, 200, { user: staffPayload(user, db) });
    return true;
  }

  if (request.method === "POST" && action === "deactivate") {
    const auth = requireAuth(request, response, db, "users.deactivate");
    if (!auth) return true;
    user.isActive = false;
    user.showOnLeadership = false;
    user.deactivatedAt = new Date().toISOString();
    user.updatedAt = user.deactivatedAt;
    db.sessions.forEach((session) => {
      if (session.userId === user.id && !session.revokedAt) session.revokedAt = new Date().toISOString();
    });
    writeAudit(db, auth, "user.deactivated", "user", user.id, {}, request);
    await writeDb(db);
    sendJson(request, response, 200, { user: staffPayload(user, db) });
    return true;
  }

  if (request.method === "POST" && action === "offboard") {
    const auth = requireAuth(request, response, db, "users.deactivate");
    if (!auth) return true;
    user.isActive = false;
    user.showOnLeadership = false;
    user.roles = ["Read Only"];
    user.deactivatedAt = new Date().toISOString();
    user.updatedAt = user.deactivatedAt;
    delete user.totpSecret;
    delete user.pendingTotpSecret;
    db.sessions.forEach((session) => {
      if (session.userId === user.id && !session.revokedAt) session.revokedAt = new Date().toISOString();
    });
    writeAudit(db, auth, "user.offboarded", "user", user.id, {}, request);
    await writeDb(db);
    sendJson(request, response, 200, { user: staffPayload(user, db) });
    return true;
  }

  if (request.method === "POST" && action === "delete") {
    const auth = requireAuth(request, response, db, "users.deactivate");
    if (!auth) return true;
    if (auth.user.id === user.id) return sendJson(request, response, 400, { error: "You cannot delete your own staff account." });
    db.sessions = db.sessions.filter((session) => session.userId !== user.id);
    db.users = db.users.filter((staffUser) => staffUser.id !== user.id);
    writeAudit(db, auth, "user.deleted", "user", user.id, { email: user.email }, request);
    await writeDb(db);
    const database = await openSqlDb();
    database.prepare("DELETE FROM users WHERE id = ?").run(user.id);
    sendJson(request, response, 200, { deleted: true, message: "Staff account deleted." });
    return true;
  }

  if (request.method === "POST" && action === "invite") {
    const auth = requireAuth(request, response, db, "users.create");
    if (!auth) return true;
    writeAudit(db, auth, "user.invite_staged", "user", user.id, { email: user.email }, request);
    await writeDb(db);
    sendJson(request, response, 200, { ok: true, message: "Invitation staged. Email delivery will be enabled in the mail settings release." });
    return true;
  }

  sendJson(request, response, 404, { error: "Not found" });
  return true;
};

const inboxModules = {
  contacts: {
    collection: "contacts",
    entityType: "contact",
    readPermission: "contacts.read",
    updatePermission: "contacts.update",
    statuses: ["New", "In Progress", "Follow-Up Needed", "Resolved", "Archived"],
  },
  "prayer-requests": {
    collection: "prayerRequests",
    entityType: "prayerRequest",
    readPermission: "prayer.read",
    updatePermission: "prayer.update",
    statuses: ["Pending", "In Prayer", "Follow-Up Needed", "Prayed", "Archived"],
  },
  testimonials: {
    collection: "testimonials",
    entityType: "testimonial",
    readPermission: "testimonials.read",
    updatePermission: "testimonials.approve",
    statuses: ["Pending Review", "Approved", "Needs Edits", "Rejected", "Published", "Archived"],
  },
};

const defaultContactCategories = ["General Contact", "Volunteer", "Partnership", "Prayer Follow-Up", "Speaking Request", "Donation Question", "Ministry Support"];

const sanitizeInboxUpdate = (body, config) => {
  const next = {};
  const textFields = ["assignedTo", "notes", "priority", "followUpDate", "category", "placement", "internalNotes", "phone", "reason", "message"];
  for (const field of textFields) {
    if (Object.hasOwn(body, field)) next[field] = String(body[field] || "").trim();
  }
  if (Array.isArray(body.activity)) {
    next.activity = body.activity.slice(0, 50).map((item) => ({
      note: String(item.note || "").trim(),
      actor: String(item.actor || "").trim(),
      createdAt: String(item.createdAt || new Date().toISOString()),
    })).filter((item) => item.note);
  }
  if (Object.hasOwn(body, "status")) {
    const status = String(body.status || "").trim();
    if (config.statuses.includes(status)) next.status = status;
  }
  if (Object.hasOwn(body, "confidential")) next.confidential = Boolean(body.confidential);
  if (Object.hasOwn(body, "displayOnSite")) next.displayOnSite = Boolean(body.displayOnSite);
  if (Object.hasOwn(body, "featured")) next.featured = Boolean(body.featured);
  return next;
};

const safeInboxItem = (item, config, auth) => {
  if (config.collection !== "prayerRequests") return item;
  const confidential = Boolean(item.confidential || item.isConfidential || item.privacy === "Private");
  if (!confidential || hasPermission(auth.user, "prayer.confidential.read")) return item;
  return {
    ...item,
    request: "Confidential prayer request.",
    message: "Confidential prayer request.",
    notes: "",
    confidential: true,
  };
};

const handleInboxRoute = async (request, response, db, url) => {
  const match = url.pathname.match(/^\/api\/(contacts|prayer-requests|testimonials)(?:\/([^/]+))?$/);
  if (!match) return false;
  const [, moduleName, itemId] = match;
  const config = inboxModules[moduleName];
  const auth = requireAuth(request, response, db, ["PATCH", "POST", "DELETE"].includes(request.method) ? config.updatePermission : config.readPermission);
  if (!auth) return true;
  const collection = db[config.collection];

  if (moduleName === "contacts" && itemId === "categories") {
    const current = parseJson(db.settings.contactCategories, defaultContactCategories);
    if (request.method === "GET") {
      sendJson(request, response, 200, { categories: current });
      return true;
    }
    if (request.method === "PATCH") {
      const body = await readBody(request);
      const categories = [...new Set((Array.isArray(body.categories) ? body.categories : current).map((item) => String(item || "").trim()).filter(Boolean))];
      db.settings.contactCategories = JSON.stringify(categories.length ? categories : defaultContactCategories);
      writeAudit(db, auth, "contact.categories.updated", "settings", "contactCategories", { count: categories.length }, request);
      await writeDb(db);
      sendJson(request, response, 200, { categories: categories.length ? categories : defaultContactCategories });
      return true;
    }
  }

  if (request.method === "GET" && !itemId) {
    sendJson(request, response, 200, {
      items: collection.map((item) => safeInboxItem(item, config, auth)),
      statuses: config.statuses,
    });
    return true;
  }

  if (request.method === "POST" && !itemId && moduleName === "contacts") {
    const body = await readBody(request);
    const now = new Date().toISOString();
    const item = {
      id: id("contact"),
      name: String(body.name || "").trim(),
      email: normalizeEmail(body.email),
      phone: String(body.phone || "").trim(),
      reason: String(body.reason || body.category || "General Contact").trim(),
      message: String(body.message || "").trim(),
      status: String(body.status || "New").trim(),
      priority: String(body.priority || "Normal").trim(),
      assignedTo: String(body.assignedTo || "").trim(),
      followUpDate: String(body.followUpDate || "").trim(),
      notes: String(body.notes || "").trim(),
      activity: [],
      submittedAt: now,
      updatedAt: now,
    };
    if (!item.name || !isValidEmail(item.email)) return sendJson(request, response, 400, { error: "Name and valid email are required." });
    collection.unshift(item);
    writeAudit(db, auth, "contact.created", "contact", item.id, { email: item.email }, request);
    await writeDb(db);
    sendJson(request, response, 201, { item });
    return true;
  }

  if (request.method === "PATCH" && !itemId && moduleName === "contacts") {
    const body = await readBody(request);
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const updates = sanitizeInboxUpdate(body, config);
    collection.forEach((item) => {
      if (ids.includes(item.id)) Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    });
    writeAudit(db, auth, "contact.bulk_updated", "contact", "bulk", { ids, fields: Object.keys(updates) }, request);
    await writeDb(db);
    sendJson(request, response, 200, { items: collection.map((item) => safeInboxItem(item, config, auth)), statuses: config.statuses });
    return true;
  }

  const item = collection.find((entry) => entry.id === itemId);
  if (!item) {
    sendJson(request, response, 404, { error: "Inbox record not found." });
    return true;
  }

  if (request.method === "GET") {
    sendJson(request, response, 200, { item: safeInboxItem(item, config, auth), statuses: config.statuses });
    return true;
  }

  if (request.method === "DELETE" && moduleName === "contacts") {
    const index = collection.findIndex((entry) => entry.id === itemId);
    collection.splice(index, 1);
    writeAudit(db, auth, "contact.deleted", "contact", itemId, { email: item.email }, request);
    await writeDb(db);
    const database = await openSqlDb();
    database.prepare("DELETE FROM contacts WHERE id = ?").run(itemId);
    sendJson(request, response, 200, { deleted: true, message: "Contact removed." });
    return true;
  }

  if (request.method === "PATCH") {
    const body = await readBody(request);
    Object.assign(item, sanitizeInboxUpdate(body, config), { updatedAt: new Date().toISOString() });
    writeAudit(db, auth, `${config.entityType}.updated`, config.entityType, item.id, { fields: Object.keys(body) }, request);
    await writeDb(db);
    sendJson(request, response, 200, { item: safeInboxItem(item, config, auth), statuses: config.statuses });
    return true;
  }

  sendJson(request, response, 405, { error: "Method not allowed." });
  return true;
};

const server = http.createServer(async (request, response) => {
  const db = await loadDb();
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (request.method === "OPTIONS") return sendJson(request, response, 204, {});
  if (await handleUserRoute(request, response, db, url)) return;
  if (await handleInboxRoute(request, response, db, url)) return;
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
