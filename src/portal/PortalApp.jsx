import { useEffect, useState } from "react";
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
  RotateCcw,
  Save,
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
  "All Walls Down Ministry",
  "Prayer Ministry",
  "Communications",
  "Donation Stewardship",
  "Community Outreach",
  "Leadership Team",
  "Testimonial Ministry",
  "Content Ministry",
];
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
  ministry: "",
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

function PortalShell({ user, session, onLogout, mfaEnrollmentRequired = false, children }) {
  const location = useLocation();
  const isProfile = location.pathname === "/portal/profile";
  const portalLinks = [
    { to: "/portal/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/portal/staff", label: "Staff", icon: Users, gated: true },
    { to: "/portal/security", label: "MFA & Security", icon: ShieldCheck },
    { to: "/portal/profile", label: "Profile", icon: User, gated: true },
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
  const [error, setError] = useState("");

  const startEnrollment = async () => {
    setError("");
    setEnrollment(await apiRequest("/api/mfa/enroll/start", { method: "POST" }));
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
          <button className="button button--gold" type="button"><Lock size={18} /> Change Password</button>
        </section>
        <section className="portal-card">
          <h3><Lock size={19} /> Multi-Factor Authentication</h3>
          <div className="security-method"><Smartphone size={18} /><span>Authenticator App<small>{user.mfaEnabled ? "Enabled" : "Required"}</small></span><ArrowRight size={16} /></div>
          <div className="security-method"><Mail size={18} /><span>Email Verification<small>{user.email}</small></span><ArrowRight size={16} /></div>
          {!user.mfaEnabled ? <button className="button button--gold" type="button" onClick={startEnrollment}><KeyRound size={18} /> Start authenticator enrollment</button> : null}
        </section>
        <section className="portal-card">
          <h3><KeyRound size={19} /> Backup Codes</h3>
          <div className="backup-code-box">10 backup codes remaining</div>
          <button className="button button--gold" type="button">Regenerate Codes</button>
        </section>
        <section className="portal-card">
          <h3><Smartphone size={19} /> Trusted Devices</h3>
          <StatusRow label="MacBook Pro" value="Current Device" good />
          <StatusRow label="iPhone" value="Last used today" good />
          <a href="/portal/security">Manage Trusted Devices <ArrowRight size={14} /></a>
        </section>
        <section className="portal-card">
          <h3><History size={19} /> Audit Actions</h3>
          <StatusRow label="MFA status" value={user.mfaEnabled ? "Success" : "Required"} good={user.mfaEnabled} />
          <StatusRow label="Password reset flag" value={user.requirePasswordReset ? "Required" : "Clear"} good={!user.requirePasswordReset} />
          <a href="/portal/settings">View Full Audit Log <ArrowRight size={14} /></a>
        </section>
        <section className="portal-card">
          <h3><MonitorIcon /> Active Sessions</h3>
          <StatusRow label="Dallas, TX, USA" value="This Device" good />
          <button className="button button--outline" type="button">View All Sessions</button>
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
      {enrollment ? (
        <section className="portal-card portal-mfa-enroll">
          <h3>Scan QR Code</h3>
          <img src={enrollment.qrCodeUrl} alt="Authenticator QR code" />
          <p>Manual setup key: <code>{enrollment.secret}</code></p>
          <form className="portal-form" onSubmit={verifyEnrollment}>
            <label>
              6-digit code
              <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" required />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button button--gold" type="submit">
              <CheckCircle2 size={18} /> Verify and enable MFA
            </button>
          </form>
        </section>
      ) : null}
      {recoveryCodes.length ? (
        <section className="portal-card">
          <h3>Recovery codes</h3>
          <p>Save these now. They are shown only once.</p>
          <div className="portal-recovery-grid">
            {recoveryCodes.map((item) => <code key={item}>{item}</code>)}
          </div>
        </section>
      ) : null}
    </section>
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
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      roles: current.roles.includes(role) ? current.roles.filter((item) => item !== role) : [...current.roles, role],
    }));

  const updateSelected = (field, value) => setSelectedUser((current) => ({ ...current, [field]: value }));
  const toggleSelectedRole = (role) =>
    setSelectedUser((current) => ({
      ...current,
      roles: current.roles.includes(role) ? current.roles.filter((item) => item !== role) : [...current.roles, role],
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
            <span><Crown size={15} /> {selectedUser.roles?.[0] || "Staff"}</span>
            <ul>
              <li><Mail size={16} /> {selectedUser.email}</li>
              <li><Phone size={16} /> {selectedUser.phone || "(214) 555-0198"}</li>
              <li><Landmark size={16} /> {selectedUser.ministry || "All Walls Down Ministry"}</li>
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
              <label>Organization / Ministry<select value={selectedUser.ministry || "All Walls Down Ministry"} onChange={(event) => updateSelected("ministry", event.target.value)}>{ministryOptions.map((ministry) => <option key={ministry} value={ministry}>{ministry}</option>)}</select></label>
              <label>Location<input value="Dallas, TX, USA" readOnly /></label>
              <label>Profile Image Path<input value={selectedUser.image || ""} onChange={(event) => updateSelected("image", event.target.value)} /></label>
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
        <form className="portal-card portal-form staff-create-form" onSubmit={createStaff}>
          <h3>Create staff account</h3>
          <label>Name<input value={form.name} onChange={(event) => updateForm("name", event.target.value)} required /></label>
          <label>Email<input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} required /></label>
          <label>Title<input value={form.title} onChange={(event) => updateForm("title", event.target.value)} /></label>
          <label>Organization / Ministry<select value={form.ministry || "All Walls Down Ministry"} onChange={(event) => updateForm("ministry", event.target.value)}>{ministryOptions.map((ministry) => <option key={ministry} value={ministry}>{ministry}</option>)}</select></label>
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
          <button className="button button--gold" type="submit">Create staff</button>
        </form>
      ) : null}
      <div className="staff-management-layout">
        <section className="portal-card staff-table-card">
          <div className="staff-toolbar">
            <div className="staff-tabs"><button type="button" className="is-active">All Staff</button><button type="button">Active</button><button type="button">Invited</button><button type="button">Suspended</button></div>
            <label><Filter size={16} /><input placeholder="Search staff by name, email, or role..." /></label>
            <button type="button"><Filter size={16} /> Filters</button>
          </div>
          <div className="staff-table">
            <div className="staff-table__head">
              <span>Staff Member</span><span>Title</span><span>Email</span><span>Roles</span><span>Account Status</span><span>Invite Status</span><span>Actions</span>
            </div>
            {users.map((user) => (
              <button type="button" key={user.id} className="staff-row" onClick={() => setSelectedId(user.id)}>
                <span className="staff-person"><em>{initialsFor(user.name)}</em><span><strong>{user.name}</strong><small>{user.roles?.[0] || "Staff"}</small></span></span>
                <span>{user.title || "Staff Member"}</span>
                <span>{user.email}</span>
                <span><b>{user.roles?.[0] || "Read Only"}</b></span>
                <span><i className={user.isActive ? "is-good" : "is-warning"}>{user.isActive ? "Active" : "Suspended"}</i></span>
                <span><i className={user.mfaEnabled ? "is-good" : "is-warning"}>{user.mfaEnabled ? "Accepted" : "Pending"}</i></span>
                <span><MoreVertical size={17} /></span>
              </button>
            ))}
          </div>
        </section>
        <aside className="portal-side-rail">
          <PortalActionPanel title="Onboarding Workflow" body="Standardize new staff onboarding." primary="Start Onboarding" icon={UserPlus} />
          <PortalActionPanel title="Role Matrix" body="View and manage role permissions." primary="View Role Matrix" icon={ShieldCheck} />
          <PortalActionPanel title="Bulk Actions" body="Perform actions on multiple accounts." primary="Bulk Manage Staff" icon={Users} />
          <section className="portal-card portal-action-panel">
            <h3><Upload size={19} /> Import / Export</h3>
            <p>Import new staff or export reports.</p>
            <div className="split-actions"><button type="button"><Upload size={17} /> Import Staff</button><button type="button"><Download size={17} /> Export Staff</button></div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function PortalActionPanel({ title, body, primary, icon: Icon }) {
  return (
    <section className="portal-card portal-action-panel">
      <h3><Icon size={19} /> {title}</h3>
      <p>{body}</p>
      <button type="button">{primary}</button>
    </section>
  );
}

function ProfileScreen({ user, onLogoutAll }) {
  const profilePermissions = permissionsForRoles(user.roles);
  return (
    <section className="portal-screen profile-page">
      <div className="profile-hero portal-card">
        <div className="profile-hero__avatar-wrap">
          {user.image ? <img className="profile-hero__avatar" src={user.image} alt="" /> : <div className="profile-hero__avatar">{initialsFor(user.name)}</div>}
          <button type="button" aria-label="Update profile photo"><Camera size={18} /></button>
        </div>
        <div className="profile-hero__identity">
          <h2>{user.name}</h2>
          <span><Crown size={15} /> {user.roles[0]}</span>
          <ul>
            <li><Mail size={16} /> {user.email}</li>
            <li><Phone size={16} /> {user.phone || "(214) 555-0198"}</li>
            <li><Landmark size={16} /> {user.ministry || "All Walls Down Ministry"}</li>
            <li><MapPin size={16} /> Dallas, TX, USA</li>
            <li><Calendar size={16} /> Member since {new Date(user.createdAt).toLocaleDateString()}</li>
          </ul>
        </div>
        <div className="profile-hero__badges"><b>Active</b><b>Session Verified</b></div>
      </div>
      <div className="profile-settings-grid">
        <section className="portal-card portal-form profile-info-card">
          <h3><User size={19} /> Profile Information</h3>
          <p>Update your personal and ministry information.</p>
          <div className="profile-form-grid">
            <label>Display Name<input value={user.name} readOnly /></label>
            <label>Full Name<input value={user.name} readOnly /></label>
            <label>Email Address<input value={user.email} readOnly /></label>
            <label>Phone Number<input value={user.phone || ""} readOnly placeholder="Not set" /></label>
            <label>Title / Position<input value={user.title || user.roles[0]} readOnly /></label>
            <label>Organization / Ministry<select value={user.ministry || "All Walls Down Ministry"} disabled>{ministryOptions.map((ministry) => <option key={ministry} value={ministry}>{ministry}</option>)}</select></label>
            <label>Location<input value="Dallas, TX, USA" readOnly /></label>
            <label>Time Zone<input value="(UTC-06:00) Central Time" readOnly /></label>
            <label>Short Bio<textarea value={user.bio || "Passionate about serving All Walls Down and supporting ministry operations."} readOnly /></label>
            <label>Faith Testimonial<textarea value="God has called me to serve, lead, and equip others to walk in their purpose." readOnly /></label>
          </div>
          <div className="profile-lower-grid">
            <div className="profile-toggle-stack">
              <div className="profile-toggle-row"><span><MapPin size={20} /> <em>Leadership Page<small>Show on leadership page</small></em></span><input type="checkbox" checked={user.showOnLeadership} readOnly /></div>
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
          <button className="button button--gold profile-save-button" type="button"><Save size={18} /> Save Changes</button>
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
              <button type="button"><UserPlus size={18} /> Stage Invite</button>
              <button type="button"><Lock size={18} /> Force Password Reset</button>
              <button type="button"><Shield size={18} /> Reset MFA</button>
              <button type="button" className="is-danger" onClick={onLogoutAll}><XCircle size={18} /> Log Out Devices</button>
            </div>
          </section>
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
        <Route path="/profile" element={<ProfileScreen user={auth.user} onLogoutAll={logoutAll} />} />
        <Route path="/content" element={<PortalModulePlaceholder title="Content Management" body="Manage All Walls Down website content, media, publishing, and page updates." icon={FileText} />} />
        <Route path="/donations" element={<PortalModulePlaceholder title="Donations" body="Review provider-hosted donation activity and donation follow-up workflows." icon={Heart} />} />
        <Route path="/prayer-requests" element={<PortalModulePlaceholder title="Prayer Requests" body="Manage submitted prayer requests, confidentiality, follow-up, and team response." icon={Shield} />} />
        <Route path="/testimonials" element={<PortalModulePlaceholder title="Testimonials" body="Review, approve, and publish community stories of transformation." icon={MessageSquareQuote} />} />
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
