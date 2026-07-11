import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  Crown,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Heart,
  History,
  KeyRound,
  Landmark,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquareQuote,
  MoreVertical,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Upload,
  User,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../shared/api";

const idleLogoutMs = 60 * 60 * 1000;
const activityEvents = ["click", "keydown", "pointerdown", "scroll", "touchstart"];
const defaultRoles = ["Administrator", "User Admin", "Content Manager", "Prayer Team", "Communications", "Donation Manager", "Read Only", "Auditor"];
const ministryOptions = [
  "All Walls Down",
  "Brothers Keepers",
  "Daughters of the King",
];
const inboxModuleConfig = {
  contacts: {
    title: "Contact Submissions",
    route: "/api/contacts",
    icon: Mail,
    summary: "Manage contact forms, assignments, statuses, notes, priority, and follow-up dates.",
    searchPlaceholder: "Search contacts by name, email, subject, or message...",
    fields: {
      name: ["name", "fullName"],
      email: ["email"],
      subject: ["subject", "category", "interest"],
      body: ["message", "body", "details"],
    },
  },
  prayer: {
    title: "Prayer Requests",
    route: "/api/prayer-requests",
    icon: Shield,
    summary: "Manage prayer requests, confidentiality, assignments, follow-up, and team notes.",
    searchPlaceholder: "Search prayer requests by requester, category, or request...",
    fields: {
      name: ["name", "requester", "requesterName"],
      email: ["email"],
      subject: ["category", "title", "prayerType"],
      body: ["request", "message", "details"],
    },
  },
  testimonials: {
    title: "Testimonials",
    route: "/api/testimonials",
    icon: MessageSquareQuote,
    summary: "Review, approve, publish, reject, and place submitted community stories.",
    searchPlaceholder: "Search testimonials by name, quote, ministry, or city...",
    fields: {
      name: ["name"],
      email: ["email"],
      subject: ["ministry", "category", "city"],
      body: ["quote", "story", "message"],
    },
  },
};
const rolePermissionLabels = [
  "Full system access",
  "Manage staff and roles",
  "Content management",
  "MFA & security settings",
  "View reports and analytics",
];
const rolePermissionMap = {
  Administrator: rolePermissionLabels,
  "User Admin": ["Manage staff and roles", "MFA & security settings", "View reports and analytics"],
  "Content Manager": ["Content management", "View reports and analytics"],
  "Prayer Team": ["View reports and analytics"],
  Communications: ["Content management", "View reports and analytics"],
  "Donation Manager": ["View reports and analytics"],
  Auditor: ["View reports and analytics"],
  "Read Only": ["View reports and analytics"],
};
const blankStaffForm = {
  name: "",
  email: "",
  title: "",
  ministry: "All Walls Down",
  phone: "",
  bio: "",
  image: "",
  showOnLeadership: false,
  roles: ["Read Only"],
  temporaryPassword: "",
};

function LoadingPanel() {
  return <section className="portal-loading">Loading secure portal...</section>;
}

function AccessDenied() {
  return (
    <section className="portal-screen portal-denied">
      <AlertTriangle />
      <h1>Access denied</h1>
      <p>Your session is missing or does not include permission for this portal area.</p>
      <a className="button button--gold" href="/">Return to public site</a>
    </section>
  );
}

function userInitials(user) {
  return initialsFor(user?.name || user?.email || "AWD");
}

function permissionsForRoles(roles = []) {
  const included = new Set();
  roles.forEach((role) => (rolePermissionMap[role] || []).forEach((permission) => included.add(permission)));
  return rolePermissionLabels.map((label) => ({ label, checked: included.has(label) }));
}

function roleList(roles = []) {
  const assigned = [...new Set((Array.isArray(roles) ? roles : []).filter(Boolean))];
  return assigned.length > 1 ? assigned.filter((role) => role !== "Read Only") : assigned;
}

function primaryRole(roles = []) {
  const assigned = roleList(roles);
  return defaultRoles.find((role) => assigned.includes(role)) || assigned[0] || "Read Only";
}

function toggleRoleAssignment(currentRoles = [], role) {
  const assigned = new Set(roleList(currentRoles));
  if (assigned.has(role)) assigned.delete(role);
  else assigned.add(role);
  if (role === "Read Only" && assigned.has("Read Only")) {
    return ["Read Only"];
  }
  if (role !== "Read Only" && assigned.has(role)) {
    assigned.delete("Read Only");
  }
  const next = defaultRoles.filter((item) => assigned.has(item));
  return next.length ? next : ["Read Only"];
}

function normalizedMinistry(value) {
  return ministryOptions.includes(value) ? value : "All Walls Down";
}

function firstValue(item, keys, fallback = "") {
  for (const key of keys) {
    if (item?.[key]) return item[key];
  }
  return fallback;
}

function testimonialText(item) {
  return firstValue(item, ["quote", "story", "message", "body", "details"], "No testimonial text provided.");
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function PortalShell({ user, session, onLogout, mfaEnrollmentRequired = false, children }) {
  const location = useLocation();
  const isProfile = location.pathname === "/portal/profile";
  const portalLinks = [
    { to: "/portal/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/portal/staff", label: "Staff", icon: Users, gated: true },
    { to: "/portal/security", label: "MFA & Security", icon: ShieldCheck },
    { to: "/portal/profile", label: "Profile", icon: User, gated: true },
    { to: "/portal/contacts", label: "Contacts", icon: Mail, gated: true },
    { to: "/portal/content", label: "Content", icon: FileText, gated: true },
    { to: "/portal/donations", label: "Donations", icon: Heart, gated: true },
    { to: "/portal/prayer-requests", label: "Prayer Requests", icon: Shield, gated: true },
    { to: "/portal/testimonials", label: "Testimonials", icon: MessageSquareQuote, gated: true },
    { to: "/portal/settings", label: "Settings", icon: Settings, gated: true },
  ];

  return (
    <section className="management-portal">
      <aside className="management-portal__sidebar">
        <div className="management-portal__brand">
          <span>
            <img src="/assets/awd-logo.webp" alt="All Walls Down" width="1190" height="1322" />
          </span>
          <div>
            <strong>AWD Portal</strong>
            <small>Management Portal</small>
          </div>
        </div>
        <nav>
          {portalLinks.map(({ to, label, icon: Icon, gated }) => (!gated || !mfaEnrollmentRequired ? (
            <NavLink key={to} to={to}><Icon size={18} /> {label}</NavLink>
          ) : null))}
        </nav>
        <button type="button" onClick={onLogout}>
          <LogOut size={18} /> Logout
        </button>
        <footer>
          <span>© 2025 All Walls Down</span>
          <span>All rights reserved.</span>
        </footer>
      </aside>
      <main className="management-portal__main">
        <header className="management-portal__topbar">
          <div>
            <h1>{isProfile ? "Profile Settings" : `Welcome, ${user.name}`}</h1>
            <span>{isProfile ? "AWD Portal  /  Profile Settings" : "All Walls Down Management Portal"}</span>
          </div>
          <div className="portal-session-chip">
            <ShieldCheck size={22} />
            <span>
              <strong>{user.roles[0] || "Staff"}</strong>
              <small>Session {session.mfaVerified ? "verified" : "pending MFA"}</small>
            </span>
            <div className="portal-user-avatar">{userInitials(user)}</div>
          </div>
        </header>
        {children}
      </main>
    </section>
  );
}

function Dashboard({ summary }) {
  const cards = [
    { label: "Total Staff", value: 28, note: "+ 3 this month", icon: Users },
    { label: "Unread Contact Forms", value: summary.newContacts, note: "View all inquiries", icon: Mail },
    { label: "New Prayer Requests", value: summary.pendingPrayerRequests, note: "+ 2 today", icon: Shield },
    { label: "Donations This Month", value: "$24,580", note: "+ 18% vs last month", icon: Heart },
    { label: "Testimonials Pending", value: summary.pendingTestimonials, note: "Review & approve", icon: MessageSquareQuote },
    { label: "Content Updates", value: 3, note: "Updates pending", icon: FileText },
  ];
  const contactRows = [
    ["Michelle Johnson", "Partnership Inquiry", "2m ago"],
    ["David Anderson", "Volunteer Opportunity", "15m ago"],
    ["Tiffany Brooks", "Speaking Request", "1h ago"],
    ["Marcus Williams", "General Question", "2h ago"],
    ["Alicia Thompson", "Ministry Information", "3h ago"],
  ];
  const prayerRows = [
    ["Sarah M.", "Please pray for healing and strength as I walk this out.", "10m ago"],
    ["James R.", "Pray for my job situation and provision for my family.", "45m ago"],
    ["Denise L.", "Please cover my family in prayer during this season.", "1h ago"],
    ["Kevin D.", "Pray for wisdom and guidance in a major decision.", "2h ago"],
  ];
  const quickActions = [
    ["Add Staff Member", "Create a new staff account", UserPlus],
    ["New Content", "Create new content", FileText],
    ["View Donations", "View all donations & reports", Heart],
    ["Export Inquiries", "Export contact submissions", Download],
    ["Security Settings", "Manage MFA & security", ShieldCheck],
    ["Audit Log", "View system activity", History],
  ];
  return (
    <section className="portal-screen">
      <div className="portal-summary-grid dashboard-kpis">
        {cards.map(({ label, value, note, icon: Icon }) => (
          <article key={label}>
            <Icon />
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <PortalListCard title="Recent Contact Submissions" icon={MessageSquareQuote} action="View All" rows={contactRows} />
        <PortalListCard title="Recent Prayer Requests" icon={Shield} action="View All" rows={prayerRows} />
        <section className="portal-card donation-trend-card">
          <header><h3><BarChart3 size={19} /> Donation Trend</h3><button type="button">This Month</button></header>
          <div className="portal-chart" aria-hidden="true"><span /></div>
        </section>
        <section className="portal-card">
          <h3><MessageSquareQuote size={19} /> Testimonial Moderation Queue</h3>
          <ul className="portal-avatar-list">
            {["Jonathan P.", "Brittany L.", "Michael T.", "Courtney R.", "Daniel K."].map((name) => (
              <li key={name}><span>{initialsFor(name)}</span><strong>{name}</strong><small>Awaiting review</small><button type="button"><Eye size={16} /></button></li>
            ))}
          </ul>
        </section>
        <section className="portal-card">
          <h3><ShieldCheck size={19} /> Recent Staff & Security Activity</h3>
          <ul className="portal-activity-list">
            {(summary.recentActivity || []).slice(0, 5).map((item) => (
              <li key={item.id}><span>{item.action}</span><small>{new Date(item.createdAt).toLocaleString()}</small></li>
            ))}
          </ul>
        </section>
        <section className="portal-card quick-actions-card">
          <h3><Activity size={19} /> Quick Actions</h3>
          <div>
            {quickActions.map(([label, text, Icon]) => (
              <button type="button" key={label}><Icon size={25} /><span><strong>{label}</strong><small>{text}</small></span></button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function PortalListCard({ title, icon: Icon, action, rows }) {
  return (
    <section className="portal-card portal-list-card">
      <header><h3><Icon size={19} /> {title}</h3><button type="button">{action}</button></header>
      <ul>
        {rows.map(([name, detail, time]) => (
          <li key={`${name}-${detail}`}><span /><strong>{name}</strong><small>{detail}</small><em>{time}</em></li>
        ))}
      </ul>
    </section>
  );
}

function SecurityScreen({ user, refreshUser }) {
  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [securityModal, setSecurityModal] = useState("");
  const [passwords, setPasswords] = useState({ currentPassword: "", nextPassword: "" });
  const [auditData, setAuditData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const startEnrollment = async () => {
    setError("");
    setMessage("");
    const result = await apiRequest("/api/mfa/enroll/start", { method: "POST" });
    setEnrollment(result);
    setSecurityModal("mfa");
  };

  const regenerateRecoveryCodes = async () => {
    setError("");
    setMessage("");
    try {
      const result = await apiRequest("/api/mfa/recovery-codes/regenerate", { method: "POST" });
      setRecoveryCodes(result.recoveryCodes || []);
      setMessage("Recovery codes regenerated. Save them now.");
      setSecurityModal("recovery");
    } catch (recoveryError) {
      setError(recoveryError.message);
    }
  };

  const changeSecurityPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/api/auth/change-password", { method: "POST", body: passwords });
      setPasswords({ currentPassword: "", nextPassword: "" });
      setSecurityModal("");
      setMessage("Password changed.");
      await refreshUser();
    } catch (passwordError) {
      setError(passwordError.message);
    }
  };

  const openAuditLog = async () => {
    setError("");
    try {
      const result = await apiRequest("/api/audit");
      setAuditData(result);
      setSecurityModal("audit");
    } catch (auditError) {
      setError(auditError.message);
    }
  };

  const verifyEnrollment = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const result = await apiRequest("/api/mfa/enroll/verify", {
        method: "POST",
        body: { code },
      });
      setRecoveryCodes(result.recoveryCodes || []);
      setEnrollment(null);
      setCode("");
      await refreshUser();
    } catch (verifyError) {
      setError(verifyError.message);
    }
  };

  return (
    <section className="portal-screen">
      <div className="portal-screen__heading">
        <Shield />
        <div>
          <h2>MFA & Security</h2>
          <p>Manage authentication methods, security settings, and account protection.</p>
        </div>
      </div>
      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="security-grid">
        <section className="portal-card account-summary-card">
          <h3><User size={19} /> Account Summary</h3>
          <div className="security-profile">
            <span className="security-avatar">{initialsFor(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <b>{user.roles[0]}</b>
              <small>{user.email}</small>
            </div>
          </div>
          <StatusRow label="Member since" value={new Date(user.createdAt).toLocaleDateString()} good />
          <StatusRow label="Last login" value="Current session" good />
        </section>
        <section className="portal-card">
          <h3><Shield size={19} /> Password Status</h3>
          <p>Your password helps protect your account.</p>
          <div className="password-meter"><span /></div>
          <StatusRow label="Password strength" value="Strong" good />
          <button className="button button--gold" type="button" onClick={() => setSecurityModal("password")}><Lock size={18} /> Change Password</button>
        </section>
        <section className="portal-card">
          <h3><Lock size={19} /> Multi-Factor Authentication</h3>
          <button className="security-method" type="button" onClick={user.mfaEnabled ? () => setSecurityModal("authenticator") : startEnrollment}><Smartphone size={18} /><span>Authenticator App<small>{user.mfaEnabled ? "Enabled" : "Required"}</small></span><ArrowRight size={16} /></button>
          <button className="security-method" type="button" onClick={() => setSecurityModal("email")}><Mail size={18} /><span>Email Verification<small>{user.email}</small></span><ArrowRight size={16} /></button>
          {!user.mfaEnabled ? <button className="button button--gold" type="button" onClick={startEnrollment}><KeyRound size={18} /> Start authenticator enrollment</button> : null}
        </section>
        <section className="portal-card">
          <h3><KeyRound size={19} /> Backup Codes</h3>
          <div className="backup-code-box">10 backup codes remaining</div>
          <button className="button button--gold" type="button" onClick={regenerateRecoveryCodes}><RotateCcw size={18} /> Regenerate Codes</button>
        </section>
        <section className="portal-card">
          <h3><Smartphone size={19} /> Trusted Devices</h3>
          <StatusRow label="MacBook Pro" value="Current Device" good />
          <StatusRow label="iPhone" value="Last used today" good />
          <button className="button button--outline" type="button" onClick={() => setSecurityModal("devices")}><Smartphone size={18} /> Manage Trusted Devices</button>
        </section>
        <section className="portal-card">
          <h3><History size={19} /> Audit Actions</h3>
          <StatusRow label="MFA status" value={user.mfaEnabled ? "Success" : "Required"} good={user.mfaEnabled} />
          <StatusRow label="Password reset flag" value={user.requirePasswordReset ? "Required" : "Clear"} good={!user.requirePasswordReset} />
          <button className="button button--outline" type="button" onClick={openAuditLog}><History size={18} /> View Full Audit Log</button>
        </section>
        <section className="portal-card">
          <h3><MonitorIcon /> Active Sessions</h3>
          <StatusRow label="Dallas, TX, USA" value="This Device" good />
          <button className="button button--outline" type="button" onClick={() => setSecurityModal("sessions")}><Eye size={18} /> Manage Sessions</button>
        </section>
        <section className="portal-card">
          <h3><Bell size={19} /> Login Alerts</h3>
          <StatusRow label="New sign-in detected" value="Today" good />
          <StatusRow label="Unusual sign-in blocked" value="Protected" good />
        </section>
        <section className="portal-card">
          <h3><ShieldCheck size={19} /> Account Integrity</h3>
          <StatusRow label="Two-Factor Required" value="Enabled" good />
          <StatusRow label="Session Expiration" value="60 minutes idle" good />
        </section>
      </div>
      {securityModal ? (
        <div className="portal-modal-backdrop" role="presentation" onMouseDown={() => setSecurityModal("")}>
          <section className="portal-card security-modal" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <h3>{securityModal === "password" ? "Change Password" : securityModal === "mfa" ? "Authenticator Enrollment" : securityModal === "recovery" ? "Recovery Codes" : securityModal === "devices" ? "Trusted Devices" : securityModal === "audit" ? "Audit Log" : securityModal === "sessions" ? "Active Sessions" : securityModal === "email" ? "Email Verification" : "Authenticator App"}</h3>
              <button type="button" onClick={() => setSecurityModal("")} aria-label="Close security modal"><XCircle size={18} /></button>
            </header>
            {securityModal === "password" ? (
              <form className="portal-form security-modal-form" onSubmit={changeSecurityPassword}>
                <label>Current Password<input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} required /></label>
                <label>New Password<input type="password" value={passwords.nextPassword} onChange={(event) => setPasswords((current) => ({ ...current, nextPassword: event.target.value }))} required minLength={12} /></label>
                <button className="button button--gold" type="submit"><Lock size={18} /> Save Password</button>
              </form>
            ) : null}
            {securityModal === "mfa" && enrollment ? (
              <div className="portal-mfa-enroll">
                <img src={enrollment.qrCodeUrl} alt="Authenticator QR code" />
                <p>Manual setup key: <code>{enrollment.secret}</code></p>
                <form className="portal-form security-modal-form" onSubmit={verifyEnrollment}>
                  <label>6-digit code<input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" required /></label>
                  <button className="button button--gold" type="submit"><CheckCircle2 size={18} /> Verify and enable MFA</button>
                </form>
              </div>
            ) : null}
            {securityModal === "recovery" ? (
              <>
                <p>Save these now. They are shown only once.</p>
                <div className="portal-recovery-grid">{recoveryCodes.map((item) => <code key={item}>{item}</code>)}</div>
              </>
            ) : null}
            {securityModal === "devices" ? <SecurityList rows={[["MacBook Pro", "Current device"], ["iPhone", "Last used today"]]} /> : null}
            {securityModal === "sessions" ? <SecurityList rows={[["Dallas, TX, USA", "This device"], ["Session expiration", "60 minutes idle"]]} /> : null}
            {securityModal === "email" ? <SecurityList rows={[[user.email, "Verified staff account email"], ["Delivery", "Used for login and recovery notices"]]} /> : null}
            {securityModal === "authenticator" ? <SecurityList rows={[["Authenticator App", user.mfaEnabled ? "Enabled" : "Required"], ["Recovery Codes", "Available from Backup Codes"]]} /> : null}
            {securityModal === "audit" ? (
              <ul className="portal-activity-list security-audit-list">
                {(auditData?.auditLogs || []).slice(0, 12).map((item) => <li key={item.id}><span>{item.action}</span><small>{item.actorEmail || "System"} · {new Date(item.createdAt).toLocaleString()}</small></li>)}
              </ul>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}

function SecurityList({ rows }) {
  return (
    <div className="security-modal-list">
      {rows.map(([label, value]) => <StatusRow key={label} label={label} value={value} good />)}
    </div>
  );
}

function MonitorIcon() {
  return <span className="inline-icon"><Activity size={19} /></span>;
}

function StatusRow({ label, value, good }) {
  return (
    <div className="portal-status-row">
      <span>{label}</span>
      <strong className={good ? "is-good" : "is-warning"}>{value}</strong>
    </div>
  );
}

function initialsFor(name) {
  return String(name || "Staff")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StaffManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(defaultRoles);
  const [selectedId, setSelectedId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [form, setForm] = useState(blankStaffForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [staffPhotoOpen, setStaffPhotoOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [staffQuery, setStaffQuery] = useState("");
  const [staffFilter, setStaffFilter] = useState("All Staff");

  const loadUsers = async () => {
    const result = await apiRequest("/api/users");
    setUsers(result.users || []);
    setRoles(result.roles || defaultRoles);
  };

  const loadUser = async (userId) => {
    const result = await apiRequest(`/api/users/${userId}`);
    setSelectedUser(result.user);
    setAuditHistory(result.auditHistory || []);
  };

  useEffect(() => {
    loadUsers().catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    if (selectedId) loadUser(selectedId).catch((loadError) => setError(loadError.message));
    else {
      setSelectedUser(null);
      setAuditHistory([]);
    }
  }, [selectedId]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleFormRole = (role) =>
    setForm((current) => ({
      ...current,
      roles: toggleRoleAssignment(current.roles, role),
    }));

  const updateSelected = (field, value) => setSelectedUser((current) => ({ ...current, [field]: value }));
  const toggleSelectedRole = (role) =>
    setSelectedUser((current) => ({
      ...current,
      roles: toggleRoleAssignment(current.roles, role),
    }));

  const createStaff = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setNewPassword("");
    try {
      const result = await apiRequest("/api/users", { method: "POST", body: form });
      setNewPassword(result.temporaryPassword || "");
      setMessage("Staff account created.");
      setForm(blankStaffForm);
      setCreateOpen(false);
      await loadUsers();
      setSelectedId(result.user.id);
    } catch (createError) {
      setError(createError.message);
    }
  };

  const saveSelected = async () => {
    setError("");
    setMessage("");
    try {
      const result = await apiRequest(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        body: {
          name: selectedUser.name,
          title: selectedUser.title,
          ministry: selectedUser.ministry,
          phone: selectedUser.phone,
          bio: selectedUser.bio,
          image: selectedUser.image,
          notes: selectedUser.notes,
          showOnLeadership: selectedUser.showOnLeadership,
          isActive: selectedUser.isActive,
          roles: selectedUser.roles,
        },
      });
      setSelectedUser(result.user);
      setAuditHistory(result.auditHistory || []);
      setMessage("Staff profile saved.");
      await loadUsers();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const staffAction = async (action, successMessage) => {
    setError("");
    setMessage("");
    try {
      if (["deactivate", "offboard", "delete"].includes(action) && !window.confirm(`Are you sure you want to ${action.replace("-", " ")} this staff account?`)) return;
      const result = await apiRequest(`/api/users/${selectedUser.id}/${action}`, { method: "POST" });
      if (result.deleted) {
        setSelectedId("");
        setSelectedUser(null);
        setMessage(result.message || successMessage);
        await loadUsers();
        return;
      }
      if (result.user) setSelectedUser(result.user);
      setMessage(result.message || successMessage);
      await loadUsers();
      await loadUser(selectedUser.id);
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = [user.name, user.email, user.title, user.roles?.join(" ")].join(" ").toLowerCase().includes(staffQuery.toLowerCase());
    const matchesFilter =
      staffFilter === "All Staff" ||
      (staffFilter === "Active" && user.isActive) ||
      (staffFilter === "Invited" && !user.mfaEnabled) ||
      (staffFilter === "Suspended" && !user.isActive);
    return matchesSearch && matchesFilter;
  });

  if (selectedUser) {
    const selectedPermissions = permissionsForRoles(selectedUser.roles);
    return (
      <section className="portal-screen profile-page staff-detail-page">
        <div className="portal-screen__heading portal-screen__heading--split">
          <div>
            <button className="button button--outline" type="button" onClick={() => setSelectedId("")}>
              <ArrowRight className="icon-flip" size={18} /> Back to staff
            </button>
            <h2>{selectedUser.name}</h2>
            <p>{selectedUser.email}</p>
          </div>
          <button className="button button--gold" type="button" onClick={saveSelected}>
            <Save size={18} /> Save profile
          </button>
        </div>
        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        <div className="profile-hero portal-card">
          <div className="profile-hero__avatar-wrap">
            {selectedUser.image ? <img className="profile-hero__avatar" src={selectedUser.image} alt="" /> : <div className="profile-hero__avatar">{initialsFor(selectedUser.name)}</div>}
            <button type="button" aria-label="Update profile photo"><Camera size={18} /></button>
          </div>
          <div className="profile-hero__identity">
            <h2>{selectedUser.name}</h2>
            <span><Crown size={15} /> {primaryRole(selectedUser.roles)}</span>
            <ul>
              <li><Mail size={16} /> {selectedUser.email}</li>
              <li><Phone size={16} /> {selectedUser.phone || "(214) 555-0198"}</li>
              <li><Landmark size={16} /> {selectedUser.ministry || "All Walls Down"}</li>
              <li><MapPin size={16} /> Dallas, TX, USA</li>
              <li><Calendar size={16} /> Member since {new Date(selectedUser.createdAt).toLocaleDateString()}</li>
            </ul>
          </div>
          <div className="profile-hero__badges"><b>{selectedUser.isActive ? "Active" : "Suspended"}</b><b>{selectedUser.mfaEnabled ? "MFA Verified" : "MFA Required"}</b></div>
        </div>
        <div className="profile-settings-grid">
          <section className="portal-card portal-form profile-info-card">
            <h3><User size={19} /> Staff Profile</h3>
            <p>Manage staff profile details and public visibility.</p>
            <div className="profile-form-grid">
              <label>Display Name<input value={selectedUser.name || ""} onChange={(event) => updateSelected("name", event.target.value)} /></label>
              <label>Full Name<input value={selectedUser.name || ""} onChange={(event) => updateSelected("name", event.target.value)} /></label>
              <label>Email Address<input value={selectedUser.email || ""} readOnly /></label>
              <label>Phone Number<input value={selectedUser.phone || ""} onChange={(event) => updateSelected("phone", event.target.value)} /></label>
              <label>Title / Position<input value={selectedUser.title || ""} onChange={(event) => updateSelected("title", event.target.value)} /></label>
              <label>Organization / Ministry<select value={normalizedMinistry(selectedUser.ministry)} onChange={(event) => updateSelected("ministry", event.target.value)}>{ministryOptions.map((ministry) => <option key={ministry} value={ministry}>{ministry}</option>)}</select></label>
              <label>Location<input value="Dallas, TX, USA" readOnly /></label>
              <div className="profile-photo-field"><span>Profile Photo</span><button className="button button--outline" type="button" onClick={() => setStaffPhotoOpen(true)}><Camera size={18} /> Update Photo</button></div>
              <label>Short Bio<textarea value={selectedUser.bio || ""} onChange={(event) => updateSelected("bio", event.target.value)} /></label>
              <label>Internal Notes<textarea value={selectedUser.notes || ""} onChange={(event) => updateSelected("notes", event.target.value)} /></label>
            </div>
            <div className="profile-lower-grid">
              <div className="profile-toggle-stack">
                <div className="profile-toggle-row"><span><MapPin size={20} /> <em>Leadership Page<small>Show on leadership page</small></em></span><input type="checkbox" checked={Boolean(selectedUser.showOnLeadership)} onChange={(event) => updateSelected("showOnLeadership", event.target.checked)} /></div>
                <div className="profile-toggle-row"><span><ShieldCheck size={20} /> <em>Active Account<small>Allow portal access</small></em></span><input type="checkbox" checked={selectedUser.isActive !== false} onChange={(event) => updateSelected("isActive", event.target.checked)} /></div>
              </div>
              <div className="profile-notifications">
                <strong>Security Status</strong>
                <small>Account access and MFA state.</small>
                <div>
                  <label><input type="checkbox" checked={selectedUser.mfaEnabled} readOnly /> MFA</label>
                  <label><input type="checkbox" checked={selectedUser.requirePasswordReset} readOnly /> Reset</label>
                  <label><input type="checkbox" checked={selectedUser.isActive !== false} readOnly /> Active</label>
                  <label><input type="checkbox" checked={Boolean(selectedUser.showOnLeadership)} readOnly /> Public</label>
                </div>
              </div>
            </div>
          </section>
          <aside className="profile-side-stack">
            <section className="portal-card">
              <h3><Shield size={19} /> Roles & Permissions</h3>
              <p>User Admins and Administrators can modify RBAC and account permissions.</p>
              <div className="profile-role-list">
                {roles.map((role) => (
                  <label key={role}>
                    <span>{role}</span>
                    <input type="checkbox" checked={(selectedUser.roles || []).includes(role)} onChange={() => toggleSelectedRole(role)} />
                  </label>
                ))}
              </div>
              <div className="profile-permission-note">
                <p>Permissions included for selected roles.</p>
                <ul>
                  {selectedPermissions.map(({ label, checked }) => (
                    <li key={label}><label><input type="checkbox" checked={checked} readOnly /> {label}</label></li>
                  ))}
                </ul>
              </div>
            </section>
            <section className="portal-card">
              <h3><Activity size={19} /> Account Actions</h3>
              <p>Perform administrative actions for this staff account.</p>
              <div className="account-action-grid staff-account-actions">
                <button type="button" onClick={() => staffAction("invite", "Invitation staged.")}><UserPlus size={18} /> Stage Invite</button>
                <button type="button" onClick={() => staffAction("force-password-reset", "Password reset required.")}><KeyRound size={18} /> Force Password Reset</button>
                <button type="button" onClick={() => staffAction("reset-mfa", "MFA reset and sessions revoked.")}><RotateCcw size={18} /> Reset MFA</button>
                <button type="button" onClick={() => staffAction("revoke-sessions", "Sessions revoked.")}><Lock size={18} /> Revoke Sessions</button>
                <button type="button" className="is-danger" onClick={() => staffAction("deactivate", "Account deactivated.")}><EyeOff size={18} /> Disable Account</button>
                <button type="button" className="is-danger" onClick={() => staffAction("delete", "Staff account deleted.")}><XCircle size={18} /> Delete Staff</button>
              </div>
            </section>
          </aside>
          <section className="portal-card staff-audit-card">
            <h3><History size={18} /> Staff Audit History</h3>
            {auditHistory.length ? (
              <ul className="portal-activity-list">
                {auditHistory.map((item) => (
                  <li key={item.id}>
                    <span>{item.action}</span>
                    <small>{new Date(item.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            ) : <p>No staff audit history yet.</p>}
          </section>
        </div>
        {staffPhotoOpen ? (
          <div className="portal-modal-backdrop" role="presentation" onMouseDown={() => setStaffPhotoOpen(false)}>
            <section className="portal-card staff-photo-modal" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <h3><Camera size={19} /> Staff Profile Photo</h3>
                <button type="button" onClick={() => setStaffPhotoOpen(false)} aria-label="Close staff profile photo"><XCircle size={18} /></button>
              </header>
              <label>Image URL<input value={selectedUser.image || ""} onChange={(event) => updateSelected("image", event.target.value)} placeholder="/assets/profile-photo.webp" /></label>
              <div className="staff-photo-preview">{selectedUser.image ? <img src={selectedUser.image} alt="" /> : <span>{initialsFor(selectedUser.name)}</span>}</div>
              <footer>
                <button className="button button--outline" type="button" onClick={() => setStaffPhotoOpen(false)}>Close</button>
                <button className="button button--gold" type="button" onClick={() => setStaffPhotoOpen(false)}><CheckCircle2 size={18} /> OK</button>
              </footer>
            </section>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="portal-screen">
      <div className="portal-screen__heading portal-screen__heading--split">
        <div>
          <h2>Staff Management</h2>
          <p>Manage access, MFA, roles, leadership visibility, and offboarding.</p>
        </div>
        <button className="button button--gold" type="button" onClick={() => setCreateOpen((open) => !open)}>
          <UserPlus size={18} /> Invite Staff Member
        </button>
      </div>
      <div className="portal-summary-grid staff-kpis">
        {[
          ["Total Staff", users.length, "All team members", Users],
          ["Invited", users.filter((user) => !user.mfaEnabled).length, "Pending acceptance", UserPlus],
          ["Active", users.filter((user) => user.isActive).length, "Currently active", CheckCircle2],
          ["Suspended", users.filter((user) => !user.isActive).length, "Access suspended", XCircle],
          ["Role Assignments", users.reduce((sum, user) => sum + (user.roles?.length || 0), 0), "Across all staff", ShieldCheck],
        ].map(([label, value, note, Icon]) => (
          <article key={label}><Icon /><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
        ))}
      </div>
      {message ? <p className="form-success">{message}</p> : null}
      {newPassword ? <p className="form-success">Temporary password: <code>{newPassword}</code></p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {createOpen ? (
        <div className="portal-modal-backdrop" role="presentation" onMouseDown={() => setCreateOpen(false)}>
          <form className="portal-card portal-form staff-create-modal" onSubmit={createStaff} onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <h3><UserPlus size={19} /> Create staff account</h3>
              <button type="button" onClick={() => setCreateOpen(false)} aria-label="Close create staff"><XCircle size={18} /></button>
            </header>
            <label>Name<input value={form.name} onChange={(event) => updateForm("name", event.target.value)} required /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} required /></label>
            <label>Title<input value={form.title} onChange={(event) => updateForm("title", event.target.value)} /></label>
            <label>Organization / Ministry<select value={normalizedMinistry(form.ministry)} onChange={(event) => updateForm("ministry", event.target.value)}>{ministryOptions.map((ministry) => <option key={ministry} value={ministry}>{ministry}</option>)}</select></label>
            <label>Temporary password<input value={form.temporaryPassword} onChange={(event) => updateForm("temporaryPassword", event.target.value)} placeholder="Leave blank to generate" /></label>
            <label className="portal-check">
              <input type="checkbox" checked={form.showOnLeadership} onChange={(event) => updateForm("showOnLeadership", event.target.checked)} />
              Show on Leadership page
            </label>
            <div className="role-picker">
              {roles.map((role) => (
                <label key={role}>
                  <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleFormRole(role)} />
                  {role}
                </label>
              ))}
            </div>
            <button className="button button--gold" type="submit"><Save size={18} /> Create Staff</button>
          </form>
        </div>
      ) : null}
      <div className="staff-management-layout">
        <section className="portal-card staff-table-card">
          <div className="staff-toolbar">
            <div className="staff-tabs">{["All Staff", "Active", "Invited", "Suspended"].map((filter) => <button key={filter} type="button" className={staffFilter === filter ? "is-active" : ""} onClick={() => setStaffFilter(filter)}>{filter}</button>)}</div>
            <label><Filter size={16} /><input value={staffQuery} onChange={(event) => setStaffQuery(event.target.value)} placeholder="Search staff by name, email, or role..." /></label>
            <button type="button" onClick={() => { setStaffQuery(""); setStaffFilter("All Staff"); }}><RotateCcw size={16} /> Reset</button>
          </div>
          <div className="staff-table">
            <div className="staff-table__head">
              <span>Staff Member</span><span>Title</span><span>Email</span><span>Roles</span><span>Account Status</span><span>Invite Status</span><span>Actions</span>
            </div>
            {filteredUsers.map((user) => (
              <button type="button" key={user.id} className="staff-row" onClick={() => setSelectedId(user.id)}>
                <span className="staff-person"><em>{initialsFor(user.name)}</em><span><strong>{user.name}</strong><small>{primaryRole(user.roles)}</small></span></span>
                <span>{user.title || "Staff Member"}</span>
                <span>{user.email}</span>
                <span className="staff-role-cell">{roleList(user.roles).map((role) => <b key={role}>{role}</b>)}</span>
                <span><i className={user.isActive ? "is-good" : "is-warning"}>{user.isActive ? "Active" : "Suspended"}</i></span>
                <span><i className={user.mfaEnabled ? "is-good" : "is-warning"}>{user.mfaEnabled ? "Accepted" : "Pending"}</i></span>
                <span><MoreVertical size={17} /></span>
              </button>
            ))}
          </div>
        </section>
        <aside className="portal-side-rail">
          <PortalActionPanel title="Onboarding Workflow" body="Create a new staff account and assign initial access." primary="Start Onboarding" icon={UserPlus} onAction={() => setCreateOpen(true)} />
          <PortalActionPanel title="Role Matrix" body="Review available role names and permissions." primary="View Role Matrix" icon={ShieldCheck} onAction={() => setStaffFilter("All Staff")} />
          <PortalActionPanel title="Bulk Actions" body="Filter suspended or invited accounts for follow-up." primary="Review Invites" icon={Users} onAction={() => setStaffFilter("Invited")} />
          <section className="portal-card portal-action-panel">
            <h3><Upload size={19} /> Import / Export</h3>
            <p>Import new staff or export reports.</p>
            <div className="split-actions"><button type="button" onClick={() => setCreateOpen(true)}><Upload size={17} /> Add Staff</button><button type="button" onClick={() => downloadCsv("staff-export.csv", [["Name", "Email", "Title", "Roles", "Active"], ...users.map((user) => [user.name, user.email, user.title, user.roles?.join("; "), user.isActive ? "Active" : "Suspended"])])}><Download size={17} /> Export Staff</button></div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function PortalActionPanel({ title, body, primary, icon: Icon, onAction }) {
  return (
    <section className="portal-card portal-action-panel">
      <h3><Icon size={19} /> {title}</h3>
      <p>{body}</p>
      <button type="button" onClick={onAction}>{primary}</button>
    </section>
  );
}

function ProfileScreen({ user, onLogoutAll, refreshUser }) {
  const profilePhotoInputRef = useRef(null);
  const [profile, setProfile] = useState({
    name: user.name || "",
    phone: user.phone || "",
    title: user.title || user.roles[0] || "",
    ministry: normalizedMinistry(user.ministry),
    bio: user.bio || "",
    image: user.image || "",
    showOnLeadership: Boolean(user.showOnLeadership),
  });
  const [avatarEditor, setAvatarEditor] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: "", nextPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const profilePermissions = permissionsForRoles(user.roles);
  const updateProfile = (field, value) => setProfile((current) => ({ ...current, [field]: value }));
  const updatePassword = (field, value) => setPasswords((current) => ({ ...current, [field]: value }));
  const openAvatarFile = () => profilePhotoInputRef.current?.click();
  const loadAvatarFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarEditor({ src: String(reader.result || ""), zoom: 1, x: 50, y: 50 });
    reader.readAsDataURL(file);
    event.target.value = "";
  };
  const applyAvatar = async () => {
    if (!avatarEditor?.src) return;
    const image = new Image();
    image.onload = () => {
      const size = 420;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#0b0b0d";
      context.fillRect(0, 0, size, size);
      const scale = Math.max(size / image.width, size / image.height) * avatarEditor.zoom;
      const width = image.width * scale;
      const height = image.height * scale;
      const left = ((size - width) * avatarEditor.x) / 100;
      const top = ((size - height) * avatarEditor.y) / 100;
      context.drawImage(image, left, top, width, height);
      updateProfile("image", canvas.toDataURL("image/jpeg", 0.88));
      setAvatarEditor(null);
    };
    image.src = avatarEditor.src;
  };
  const saveProfile = async () => {
    setError("");
    setMessage("");
    try {
      await apiRequest("/api/auth/me", { method: "PATCH", body: profile });
      await refreshUser();
      setMessage("Profile saved.");
    } catch (saveError) {
      setError(saveError.message);
    }
  };
  const changePassword = async () => {
    setError("");
    setMessage("");
    try {
      await apiRequest("/api/auth/change-password", { method: "POST", body: passwords });
      setPasswords({ currentPassword: "", nextPassword: "" });
      setMessage("Password changed.");
    } catch (passwordError) {
      setError(passwordError.message);
    }
  };
  return (
    <section className="portal-screen profile-page">
      <div className="profile-hero portal-card">
        <div className="profile-hero__avatar-wrap">
          {profile.image ? <img className="profile-hero__avatar" src={profile.image} alt="" /> : <div className="profile-hero__avatar">{initialsFor(profile.name)}</div>}
          <button type="button" aria-label="Update profile photo" onClick={openAvatarFile}><Camera size={18} /></button>
          <input ref={profilePhotoInputRef} className="sr-only" type="file" accept="image/*" onChange={loadAvatarFile} />
        </div>
        <div className="profile-hero__identity">
          <h2>{profile.name}</h2>
          <span><Crown size={15} /> {primaryRole(user.roles)}</span>
          <ul>
            <li><Mail size={16} /> {user.email}</li>
            <li><Phone size={16} /> {profile.phone || "(214) 555-0198"}</li>
            <li><Landmark size={16} /> {profile.ministry || "All Walls Down"}</li>
            <li><MapPin size={16} /> Dallas, TX, USA</li>
            <li><Calendar size={16} /> Member since {new Date(user.createdAt).toLocaleDateString()}</li>
          </ul>
        </div>
        <div className="profile-hero__badges"><b>Active</b><b>Session Verified</b></div>
      </div>
      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="profile-settings-grid">
        <section className="portal-card portal-form profile-info-card">
          <h3><User size={19} /> Profile Information</h3>
          <p>Update your personal and ministry information.</p>
          <div className="profile-form-grid">
            <label>Display Name<input value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} /></label>
            <label>Full Name<input value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} /></label>
            <label>Email Address<input value={user.email} readOnly /></label>
            <label>Phone Number<input value={profile.phone} onChange={(event) => updateProfile("phone", event.target.value)} placeholder="Not set" /></label>
            <label>Title / Position<input value={profile.title} onChange={(event) => updateProfile("title", event.target.value)} /></label>
            <label>Organization / Ministry<select value={profile.ministry} onChange={(event) => updateProfile("ministry", event.target.value)}>{ministryOptions.map((ministry) => <option key={ministry} value={ministry}>{ministry}</option>)}</select></label>
            <label>Location<input value="Dallas, TX, USA" readOnly /></label>
            <label>Time Zone<input value="(UTC-06:00) Central Time" readOnly /></label>
            <label>Short Bio<textarea value={profile.bio} onChange={(event) => updateProfile("bio", event.target.value)} /></label>
            <div className="profile-photo-field">
              <span>Profile Photo</span>
              <button className="button button--outline" type="button" onClick={openAvatarFile}><Camera size={18} /> Choose Image</button>
            </div>
          </div>
          <div className="profile-lower-grid">
            <div className="profile-toggle-stack">
              <div className="profile-toggle-row"><span><MapPin size={20} /> <em>Leadership Page<small>Show on leadership page</small></em></span><input type="checkbox" checked={profile.showOnLeadership} onChange={(event) => updateProfile("showOnLeadership", event.target.checked)} /></div>
              <div className="profile-toggle-row"><span><User size={20} /> <em>Public Profile<small>Visible in public staff directory</small></em></span><input type="checkbox" checked readOnly /></div>
            </div>
            <div className="profile-notifications">
              <strong>Notification Preferences</strong>
              <small>Choose how you would like to be notified.</small>
              <div>
                <label><input type="checkbox" checked readOnly /> Email</label>
                <label><input type="checkbox" readOnly /> SMS</label>
                <label><input type="checkbox" checked readOnly /> In-App</label>
                <label><input type="checkbox" readOnly /> Push</label>
              </div>
            </div>
          </div>
          <button className="button button--gold profile-save-button" type="button" onClick={saveProfile}><Save size={18} /> Save Changes</button>
        </section>
        <aside className="profile-side-stack">
          <section className="portal-card">
            <h3><Shield size={19} /> Roles & Permissions</h3>
            <p>Manage role assignments and access levels.</p>
            <div className="profile-role-list">
              {defaultRoles.slice(0, 5).map((role) => <label key={role}><span>{role}</span><input type="checkbox" checked={user.roles.includes(role)} readOnly /></label>)}
            </div>
            <div className="profile-permission-note">
              <p>Roles determine what this staff member can access and manage.</p>
              <ul>
                {profilePermissions.map(({ label, checked }) => (
                  <li key={label}><label><input type="checkbox" checked={checked} readOnly /> {label}</label></li>
                ))}
              </ul>
            </div>
          </section>
          <section className="portal-card">
            <h3><Activity size={19} /> Account Actions</h3>
            <p>Perform administrative actions for this account.</p>
            <div className="account-action-grid">
              <input type="password" placeholder="Current password" value={passwords.currentPassword} onChange={(event) => updatePassword("currentPassword", event.target.value)} />
              <input type="password" placeholder="New password" value={passwords.nextPassword} onChange={(event) => updatePassword("nextPassword", event.target.value)} />
              <button type="button" onClick={changePassword}><Lock size={18} /> Change Password</button>
              <button type="button" onClick={() => window.location.assign("/portal/security")}><Shield size={18} /> Manage MFA</button>
              <button type="button" className="is-danger" onClick={onLogoutAll}><XCircle size={18} /> Log Out Devices</button>
            </div>
          </section>
        </aside>
      </div>
      {avatarEditor ? (
        <div className="portal-modal-backdrop" role="presentation" onMouseDown={() => setAvatarEditor(null)}>
          <section className="portal-card avatar-editor-modal" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <h3><Camera size={19} /> Position Profile Photo</h3>
              <button type="button" onClick={() => setAvatarEditor(null)} aria-label="Close profile photo editor"><XCircle size={18} /></button>
            </header>
            <div className="avatar-frame-preview">
              <img
                src={avatarEditor.src}
                alt=""
                style={{
                  transform: `scale(${avatarEditor.zoom})`,
                  objectPosition: `${avatarEditor.x}% ${avatarEditor.y}%`,
                }}
              />
            </div>
            <div className="avatar-editor-controls">
              <label>Zoom<input type="range" min="1" max="2.6" step="0.05" value={avatarEditor.zoom} onChange={(event) => setAvatarEditor((current) => ({ ...current, zoom: Number(event.target.value) }))} /></label>
              <label>Horizontal Position<input type="range" min="0" max="100" value={avatarEditor.x} onChange={(event) => setAvatarEditor((current) => ({ ...current, x: Number(event.target.value) }))} /></label>
              <label>Vertical Position<input type="range" min="0" max="100" value={avatarEditor.y} onChange={(event) => setAvatarEditor((current) => ({ ...current, y: Number(event.target.value) }))} /></label>
            </div>
            <footer>
              <button className="button button--outline" type="button" onClick={() => setAvatarEditor(null)}>Cancel</button>
              <button className="button button--gold" type="button" onClick={applyAvatar}><CheckCircle2 size={18} /> OK</button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function ContactCrm() {
  const statuses = inboxModuleConfig.contacts.fields ? ["New", "In Progress", "Follow-Up Needed", "Resolved", "Archived"] : [];
  const priorities = ["Low", "Normal", "High", "Urgent"];
  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [draft, setDraft] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", reason: "General Contact", message: "", priority: "Normal" });
  const [activityNote, setActivityNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCrm = useCallback(async () => {
    const [contactsResult, categoryResult] = await Promise.all([
      apiRequest("/api/contacts"),
      apiRequest("/api/contacts/categories"),
    ]);
    setContacts(contactsResult.items || []);
    setCategories(categoryResult.categories || []);
    setSelectedId((current) => current || contactsResult.items?.[0]?.id || "");
  }, []);

  useEffect(() => {
    loadCrm().catch((loadError) => setError(loadError.message));
  }, [loadCrm]);

  const selected = contacts.find((contact) => contact.id === selectedId);

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      status: selected.status || "New",
      priority: selected.priority || "Normal",
      assignedTo: selected.assignedTo || "",
      followUpDate: selected.followUpDate || "",
      reason: selected.reason || selected.category || "General Contact",
      phone: selected.phone || "",
      message: selected.message || "",
      notes: selected.notes || "",
      activity: selected.activity || [],
    });
  }, [selected]);

  const filteredContacts = contacts.filter((contact) => {
    const category = contact.reason || contact.category || "General Contact";
    const text = [contact.name, contact.email, contact.phone, category, contact.message, contact.status, contact.assignedTo].join(" ").toLowerCase();
    return text.includes(query.toLowerCase()) && (statusFilter === "All" || contact.status === statusFilter) && (categoryFilter === "All" || category === categoryFilter);
  });

  const crmStats = [
    ["Total Contacts", contacts.length, "All CRM records", Users],
    ["New", contacts.filter((contact) => contact.status === "New").length, "Needs review", Mail],
    ["Follow-Up", contacts.filter((contact) => contact.status === "Follow-Up Needed").length, "Scheduled next steps", Bell],
    ["Urgent", contacts.filter((contact) => contact.priority === "Urgent").length, "High-touch items", AlertTriangle],
    ["Resolved", contacts.filter((contact) => contact.status === "Resolved").length, "Completed records", CheckCircle2],
  ];

  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const updateNewContact = (field, value) => setNewContact((current) => ({ ...current, [field]: value }));

  const saveSelectedContact = async () => {
    if (!selected || !draft) return;
    setError("");
    setMessage("");
    try {
      const result = await apiRequest(`/api/contacts/${selected.id}`, { method: "PATCH", body: { ...draft, category: draft.reason } });
      setContacts((current) => current.map((contact) => (contact.id === selected.id ? result.item : contact)));
      setMessage("Contact CRM record saved.");
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const createContact = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const result = await apiRequest("/api/contacts", { method: "POST", body: newContact });
      setContacts((current) => [result.item, ...current]);
      setSelectedId(result.item.id);
      setNewContact({ name: "", email: "", phone: "", reason: categories[0] || "General Contact", message: "", priority: "Normal" });
      setNewContactOpen(false);
      setMessage("Contact created.");
    } catch (createError) {
      setError(createError.message);
    }
  };

  const removeSelectedContact = async () => {
    if (!selected || !window.confirm(`Remove ${selected.name || selected.email} from the CRM?`)) return;
    const result = await apiRequest(`/api/contacts/${selected.id}`, { method: "DELETE" });
    setContacts((current) => current.filter((contact) => contact.id !== selected.id));
    setSelectedId("");
    setViewerOpen(false);
    setMessage(result.message || "Contact removed.");
  };

  const addCategory = async () => {
    const category = newCategory.trim();
    if (!category) return;
    const nextCategories = [...new Set([...categories, category])];
    const result = await apiRequest("/api/contacts/categories", { method: "PATCH", body: { categories: nextCategories } });
    setCategories(result.categories || nextCategories);
    setNewCategory("");
  };

  const bulkUpdate = async (status) => {
    if (!selectedIds.length) return;
    const result = await apiRequest("/api/contacts", { method: "PATCH", body: { ids: selectedIds, status } });
    setContacts(result.items || []);
    setSelectedIds([]);
    setMessage(`Updated ${selectedIds.length} contacts.`);
  };

  const addActivity = async () => {
    if (!selected || !draft || !activityNote.trim()) return;
    const activity = [{ note: activityNote.trim(), actor: "Portal user", createdAt: new Date().toISOString() }, ...(draft.activity || [])];
    const result = await apiRequest(`/api/contacts/${selected.id}`, { method: "PATCH", body: { ...draft, activity } });
    setContacts((current) => current.map((contact) => (contact.id === selected.id ? result.item : contact)));
    setActivityNote("");
  };

  const exportContacts = () => downloadCsv("contacts-crm-export.csv", [
    ["Name", "Email", "Phone", "Reason", "Status", "Priority", "Assigned To", "Follow-Up", "Submitted"],
    ...filteredContacts.map((contact) => [contact.name, contact.email, contact.phone, contact.reason || contact.category, contact.status, contact.priority, contact.assignedTo, contact.followUpDate, contact.submittedAt]),
  ]);

  return (
    <section className="portal-screen contact-crm-screen">
      <div className="portal-screen__heading portal-screen__heading--split">
        <div>
          <h2><Mail size={28} /> Contact CRM</h2>
          <p>Manage contact submissions, follow-up workflow, assignments, categories, activity, and exports.</p>
        </div>
        <div className="crm-header-actions">
          <button className="button button--outline" type="button" onClick={() => setNewContactOpen((open) => !open)}><Plus size={18} /> New Contact</button>
          <button className="button button--gold" type="button" onClick={exportContacts}><Download size={18} /> Export CSV</button>
        </div>
      </div>
      <div className="portal-summary-grid contact-crm-kpis">
        {crmStats.map(([label, value, note, Icon]) => <article key={label}><Icon /><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
      </div>
      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {newContactOpen ? (
        <div className="portal-modal-backdrop" role="presentation" onMouseDown={() => setNewContactOpen(false)}>
          <form className="portal-card portal-form contact-create-modal" onSubmit={createContact} onMouseDown={(event) => event.stopPropagation()}>
            <header><h3><Plus size={19} /> New CRM Contact</h3><button type="button" onClick={() => setNewContactOpen(false)} aria-label="Close new contact"><XCircle size={18} /></button></header>
            <label>Name<input value={newContact.name} onChange={(event) => updateNewContact("name", event.target.value)} required /></label>
            <label>Email<input type="email" value={newContact.email} onChange={(event) => updateNewContact("email", event.target.value)} required /></label>
            <label>Phone<input value={newContact.phone} onChange={(event) => updateNewContact("phone", event.target.value)} /></label>
            <label>Category<select value={newContact.reason} onChange={(event) => updateNewContact("reason", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Priority<select value={newContact.priority} onChange={(event) => updateNewContact("priority", event.target.value)}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
            <label className="form-span">Message<textarea value={newContact.message} onChange={(event) => updateNewContact("message", event.target.value)} required /></label>
            <button className="button button--gold" type="submit"><Save size={18} /> Create Contact</button>
          </form>
        </div>
      ) : null}
      <div className="contact-crm-layout">
        <section className="portal-card contact-crm-list">
          <div className="contact-crm-toolbar">
            <label><Filter size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, phone, category, notes..." /></label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>All</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
            <button type="button" onClick={loadCrm}><RotateCcw size={16} /> Refresh</button>
          </div>
          <div className="contact-crm-bulk">
            <span>{selectedIds.length} selected</span>
            <button type="button" onClick={() => bulkUpdate("In Progress")}>Mark In Progress</button>
            <button type="button" onClick={() => bulkUpdate("Resolved")}>Resolve</button>
            <button type="button" onClick={() => bulkUpdate("Archived")}>Archive</button>
          </div>
          <div className="contact-crm-category">
            <label>CRM Categories<input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Add new contact category" /></label>
            <button className="button button--outline" type="button" onClick={addCategory}><Plus size={16} /> Add Category</button>
          </div>
          <div className="contact-crm-table">
            <div className="contact-crm-head"><span></span><span>Contact</span><span>Category</span><span>Status</span><span>Priority</span><span>Assigned</span><span>Follow-Up</span><span>Submitted</span></div>
            {filteredContacts.map((contact) => (
              <button type="button" key={contact.id} className={contact.id === selected?.id ? "contact-crm-row is-active" : "contact-crm-row"} onClick={() => setSelectedId(contact.id)} onDoubleClick={() => setViewerOpen(true)}>
                <span onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, contact.id] : current.filter((idValue) => idValue !== contact.id))} /></span>
                <span><strong>{contact.name || "Anonymous"}</strong><small>{contact.email || "No email"} · {contact.phone || "No phone"}</small></span>
                <span>{contact.reason || contact.category || "General Contact"}</span>
                <b>{contact.status || "New"}</b>
                <i>{contact.priority || "Normal"}</i>
                <span>{contact.assignedTo || "Unassigned"}</span>
                <time>{contact.followUpDate || "None"}</time>
                <time>{contact.submittedAt ? new Date(contact.submittedAt).toLocaleDateString() : ""}</time>
              </button>
            ))}
          </div>
        </section>
        <aside className="contact-crm-side">
          {selected && draft ? (
            <>
              <section className="portal-card contact-profile-card">
                <h3><User size={19} /> Contact Profile</h3>
                <div className="inbox-selected-person"><span>{initialsFor(selected.name || selected.email || "AWD")}</span><div><strong>{selected.name || "Anonymous"}</strong><small>{selected.email}</small></div></div>
                <div className="contact-profile-actions">
                  <button className="button button--outline" type="button" onClick={() => setViewerOpen(true)}><Eye size={17} /> View Contact</button>
                  <button className="button button--danger" type="button" onClick={removeSelectedContact}><XCircle size={17} /> Remove</button>
                </div>
                <div className="portal-form contact-profile-form">
                  <label>Status<select value={draft.status} onChange={(event) => updateDraft("status", event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                  <label>Priority<select value={draft.priority} onChange={(event) => updateDraft("priority", event.target.value)}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
                  <label>Assigned To<input value={draft.assignedTo} onChange={(event) => updateDraft("assignedTo", event.target.value)} /></label>
                  <label>Follow-Up<input type="date" value={draft.followUpDate} onChange={(event) => updateDraft("followUpDate", event.target.value)} /></label>
                  <label>Category<select value={draft.reason} onChange={(event) => updateDraft("reason", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                  <label>Phone<input value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} /></label>
                  <label className="form-span">Message<textarea value={draft.message} onChange={(event) => updateDraft("message", event.target.value)} /></label>
                  <label className="form-span">Internal Notes<textarea value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} /></label>
                </div>
                <button className="button button--gold" type="button" onClick={saveSelectedContact}><Save size={18} /> Save CRM Record</button>
              </section>
              <section className="portal-card contact-activity-card">
                <h3><History size={19} /> Activity Timeline</h3>
                <div className="contact-note-composer">
                  <textarea value={activityNote} onChange={(event) => setActivityNote(event.target.value)} placeholder="Log call, email, visit, or follow-up note..." />
                  <button className="button button--outline" type="button" onClick={addActivity}><Send size={16} /> Log Interaction</button>
                </div>
                <ul className="portal-activity-list">
                  {(draft.activity || []).map((activity, index) => <li key={`${activity.createdAt}-${index}`}><span>{activity.note}</span><small>{activity.actor} · {new Date(activity.createdAt).toLocaleString()}</small></li>)}
                  {!(draft.activity || []).length ? <li><span>No interaction history yet.</span><small>Add the first CRM note above.</small></li> : null}
                </ul>
              </section>
            </>
          ) : <section className="portal-card"><p>No contact selected.</p></section>}
        </aside>
      </div>
      {viewerOpen && selected ? (
        <div className="portal-modal-backdrop" role="presentation" onMouseDown={() => setViewerOpen(false)}>
          <section className="portal-card contact-viewer-modal" onMouseDown={(event) => event.stopPropagation()}>
            <header><h3><Eye size={19} /> Contact Viewer</h3><button type="button" onClick={() => setViewerOpen(false)} aria-label="Close contact viewer"><XCircle size={18} /></button></header>
            <div className="contact-viewer-identity"><span>{initialsFor(selected.name || selected.email || "AWD")}</span><div><h2>{selected.name || "Anonymous"}</h2><p>{selected.reason || selected.category || "General Contact"}</p></div></div>
            <dl>
              <div><dt>Email</dt><dd>{selected.email || "No email"}</dd></div>
              <div><dt>Phone</dt><dd>{selected.phone || "No phone"}</dd></div>
              <div><dt>Status</dt><dd>{selected.status || "New"}</dd></div>
              <div><dt>Priority</dt><dd>{selected.priority || "Normal"}</dd></div>
              <div><dt>Assigned To</dt><dd>{selected.assignedTo || "Unassigned"}</dd></div>
              <div><dt>Follow-Up</dt><dd>{selected.followUpDate || "None"}</dd></div>
            </dl>
            <article><h4>Message</h4><p>{selected.message || "No message."}</p></article>
            <article><h4>Internal Notes</h4><p>{selected.notes || "No notes yet."}</p></article>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function InboxModule({ moduleKey }) {
  const config = inboxModuleConfig[moduleKey];
  const Icon = config.icon;
  const [items, setItems] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    const result = await apiRequest(config.route);
    setItems(result.items || []);
    setStatuses(result.statuses || []);
    setSelectedId((current) => current || result.items?.[0]?.id || "");
  }, [config.route]);

  useEffect(() => {
    setSelectedId("");
    setDraft(null);
    loadItems().catch((loadError) => setError(loadError.message));
  }, [moduleKey, loadItems]);

  useEffect(() => {
    const selected = items.find((item) => item.id === selectedId);
    setDraft(selected ? {
      status: selected.status || statuses[0] || "",
      assignedTo: selected.assignedTo || "",
      priority: selected.priority || "Normal",
      followUpDate: selected.followUpDate || "",
      notes: selected.notes || selected.internalNotes || "",
      confidential: Boolean(selected.confidential),
      displayOnSite: Boolean(selected.displayOnSite),
      featured: Boolean(selected.featured),
    } : null);
  }, [items, selectedId, statuses]);

  const filteredItems = items.filter((item) => {
    const haystack = [
      firstValue(item, config.fields.name),
      firstValue(item, config.fields.email),
      firstValue(item, config.fields.subject),
      firstValue(item, config.fields.body),
      item.status,
      item.priority,
    ].join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  const selected = items.find((item) => item.id === selectedId) || filteredItems[0];
  const statusCounts = statuses.slice(0, 5).map((status) => [status, items.filter((item) => item.status === status).length]);

  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const saveRecord = async () => {
    if (!selected || !draft) return;
    setError("");
    setMessage("");
    try {
      const body = { ...draft, internalNotes: draft.notes };
      const result = await apiRequest(`${config.route}/${selected.id}`, { method: "PATCH", body });
      setItems((current) => current.map((item) => (item.id === selected.id ? result.item : item)));
      setMessage("Inbox record saved.");
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const exportRows = () => {
    downloadCsv(`${moduleKey}-export.csv`, [
      ["Name", "Email", "Subject", "Status", "Priority", "Submitted", "Assigned To", "Follow Up"],
      ...filteredItems.map((item) => [
        firstValue(item, config.fields.name),
        firstValue(item, config.fields.email),
        firstValue(item, config.fields.subject),
        item.status,
        item.priority,
        item.submittedAt,
        item.assignedTo,
        item.followUpDate,
      ]),
    ]);
  };

  return (
    <section className="portal-screen inbox-screen">
      <div className="portal-screen__heading portal-screen__heading--split">
        <div>
          <h2><Icon size={28} /> {config.title}</h2>
          <p>{config.summary}</p>
        </div>
        <button className="button button--gold" type="button" onClick={exportRows}><Download size={18} /> Export CSV</button>
      </div>
      <div className="portal-summary-grid inbox-kpis">
        <article><Icon /><span>Total</span><strong>{items.length}</strong><small>All records</small></article>
        {statusCounts.map(([status, count]) => <article key={status}><CheckCircle2 /><span>{status}</span><strong>{count}</strong><small>Current queue</small></article>)}
      </div>
      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="inbox-layout">
        <section className="portal-card inbox-list-card">
          <div className="staff-toolbar">
            <label><Filter size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={config.searchPlaceholder} /></label>
            <button type="button" onClick={loadItems}><RotateCcw size={16} /> Refresh</button>
          </div>
          <div className="inbox-list">
            {filteredItems.map((item) => (
              <button type="button" key={item.id} className={item.id === selected?.id ? "is-active" : ""} onClick={() => setSelectedId(item.id)}>
                <span><strong>{firstValue(item, config.fields.name, "Anonymous")}</strong><small>{firstValue(item, config.fields.email, "No email")}</small></span>
                <span>{firstValue(item, config.fields.subject, "General")}</span>
                <b>{item.status || "New"}</b>
                <time>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : ""}</time>
              </button>
            ))}
          </div>
        </section>
        <aside className="portal-card inbox-detail-card">
          {selected && draft ? (
            <>
              <h3><Icon size={19} /> Record Details</h3>
              <div className="inbox-selected-person">
                <span>{initialsFor(firstValue(selected, config.fields.name, "AWD"))}</span>
                <div><strong>{firstValue(selected, config.fields.name, "Anonymous")}</strong><small>{firstValue(selected, config.fields.email, "No email provided")}</small></div>
              </div>
              {moduleKey === "testimonials" ? (
                <article className="inbox-testimonial-story">
                  <h4>Testimonial</h4>
                  <blockquote>{testimonialText(selected)}</blockquote>
                  <dl>
                    <div><dt>Ministry</dt><dd>{selected.ministry || "All Walls Down"}</dd></div>
                    <div><dt>City</dt><dd>{selected.city || "Not provided"}</dd></div>
                    <div><dt>Display On Site</dt><dd>{selected.displayOnSite ? "Yes" : "No"}</dd></div>
                    <div><dt>Featured</dt><dd>{selected.featured ? "Yes" : "No"}</dd></div>
                  </dl>
                </article>
              ) : (
                <p>{firstValue(selected, config.fields.body, "No message provided.")}</p>
              )}
              <div className="portal-form inbox-detail-form">
                <label>Status<select value={draft.status} onChange={(event) => updateDraft("status", event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                <label>Priority<select value={draft.priority} onChange={(event) => updateDraft("priority", event.target.value)}><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option></select></label>
                <label>Assigned To<input value={draft.assignedTo} onChange={(event) => updateDraft("assignedTo", event.target.value)} placeholder="Assign staff member" /></label>
                <label>Follow-Up Date<input type="date" value={draft.followUpDate} onChange={(event) => updateDraft("followUpDate", event.target.value)} /></label>
                <label className="form-span">Internal Notes<textarea value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} /></label>
                {moduleKey === "prayer" ? <label className="portal-check form-span"><input type="checkbox" checked={draft.confidential} onChange={(event) => updateDraft("confidential", event.target.checked)} /> Confidential prayer request</label> : null}
                {moduleKey === "testimonials" ? (
                  <>
                    <label className="portal-check"><input type="checkbox" checked={draft.displayOnSite} onChange={(event) => updateDraft("displayOnSite", event.target.checked)} /> Display on site</label>
                    <label className="portal-check"><input type="checkbox" checked={draft.featured} onChange={(event) => updateDraft("featured", event.target.checked)} /> Featured story</label>
                  </>
                ) : null}
              </div>
              <button className="button button--gold" type="button" onClick={saveRecord}><Save size={18} /> Save Record</button>
            </>
          ) : <p>No records found.</p>}
        </aside>
      </div>
    </section>
  );
}

function PortalModulePlaceholder({ title, body, icon: Icon }) {
  return (
    <section className="portal-screen">
      <div className="portal-screen__heading">
        <Icon />
        <div>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
      </div>
      <section className="portal-card portal-empty-state">
        <h3>{title} module</h3>
        <p>This page is part of the approved portal navigation and will be built in its scheduled release without adding unrelated features.</p>
      </section>
    </section>
  );
}

export default function PortalApp() {
  const [auth, setAuth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let robots = document.head.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    const previous = robots.getAttribute("content") || "";
    robots.setAttribute("content", "noindex,nofollow");
    return () => {
      if (previous) robots.setAttribute("content", previous);
      else robots.remove();
    };
  }, []);

  const refreshUser = async () => {
    const result = await apiRequest("/api/auth/me");
    setAuth(result);
    return result;
  };

  useEffect(() => {
    refreshUser()
      .catch(() => setError("Authentication required. Please use Admin Login from the public site."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!auth?.user || auth.mfaEnrollmentRequired) return;
    apiRequest("/api/dashboard/summary")
      .then((result) => setSummary(result.summary))
      .catch(() => setSummary(null));
  }, [auth]);

  useEffect(() => {
    if (!auth?.user) return undefined;

    let lastActivityAt = Date.now();
    let lastTouchAt = 0;
    let idleTimer;

    const performIdleLogout = () => {
      apiRequest("/api/auth/logout", { method: "POST" }).catch(() => {});
      window.location.href = "/";
    };

    const scheduleIdleLogout = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(performIdleLogout, Math.max(1000, idleLogoutMs - (Date.now() - lastActivityAt)));
    };

    const touchSession = () => {
      if (Date.now() - lastTouchAt < 60_000) return;
      lastTouchAt = Date.now();
      apiRequest("/api/auth/session/touch", { method: "POST" }).catch(() => {});
    };

    const recordActivity = () => {
      lastActivityAt = Date.now();
      scheduleIdleLogout();
      touchSession();
    };

    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    scheduleIdleLogout();

    return () => {
      window.clearTimeout(idleTimer);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
    };
  }, [auth?.user]);

  const logout = async () => {
    await apiRequest("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/";
  };

  const logoutAll = async () => {
    await apiRequest("/api/auth/logout-all", { method: "POST" });
    window.location.href = "/";
  };

  if (loading) return <LoadingPanel />;
  if (error || !auth?.user) return <AccessDenied />;

  if (auth.mfaEnrollmentRequired) {
    return (
        <PortalShell user={auth.user} session={auth.session} onLogout={logout} mfaEnrollmentRequired>
          <SecurityScreen user={auth.user} refreshUser={refreshUser} />
        </PortalShell>
    );
  }

  return (
    <PortalShell user={auth.user} session={auth.session} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Navigate to="/portal/dashboard" replace />} />
        <Route path="/dashboard" element={summary ? <Dashboard summary={summary} /> : <LoadingPanel />} />
        <Route path="/staff" element={<StaffManagement />} />
        <Route path="/security" element={<SecurityScreen user={auth.user} refreshUser={refreshUser} />} />
        <Route path="/profile" element={<ProfileScreen user={auth.user} onLogoutAll={logoutAll} refreshUser={refreshUser} />} />
        <Route path="/contacts" element={<ContactCrm />} />
        <Route path="/content" element={<PortalModulePlaceholder title="Content Management" body="Manage All Walls Down website content, media, publishing, and page updates." icon={FileText} />} />
        <Route path="/donations" element={<PortalModulePlaceholder title="Donations" body="Review provider-hosted donation activity and donation follow-up workflows." icon={Heart} />} />
        <Route path="/prayer-requests" element={<InboxModule moduleKey="prayer" />} />
        <Route path="/testimonials" element={<InboxModule moduleKey="testimonials" />} />
        <Route path="/settings" element={<PortalModulePlaceholder title="Settings" body="Manage portal preferences, email delivery, integrations, and audit access." icon={Settings} />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route
          path="*"
          element={
            <section className="portal-screen">
              <h2>Portal area not found</h2>
              <button className="button button--gold" type="button" onClick={() => navigate("/portal/dashboard")}>
                Return to dashboard <ArrowRight size={18} />
              </button>
            </section>
          }
        />
      </Routes>
    </PortalShell>
  );
}
