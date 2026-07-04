import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  History,
  KeyRound,
  Lock,
  LogOut,
  RotateCcw,
  Save,
  Shield,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { apiRequest } from "../shared/api";

const idleLogoutMs = 60 * 60 * 1000;
const activityEvents = ["click", "keydown", "pointerdown", "scroll", "touchstart"];
const defaultRoles = ["Administrator", "User Admin", "Content Manager", "Prayer Team", "Communications", "Donation Manager", "Read Only", "Auditor"];
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

function PortalShell({ user, session, onLogout, mfaEnrollmentRequired = false, children }) {
  return (
    <section className="management-portal">
      <aside className="management-portal__sidebar">
        <img src="/assets/awd-logo.webp" alt="" width="1190" height="1322" />
        <strong>AWD Portal</strong>
        <nav>
          <NavLink to="/portal/dashboard"><BarChart3 size={18} /> Dashboard</NavLink>
          {!mfaEnrollmentRequired ? <NavLink to="/portal/staff"><Users size={18} /> Staff</NavLink> : null}
          <NavLink to="/portal/security"><ShieldCheck size={18} /> MFA & Security</NavLink>
          {!mfaEnrollmentRequired ? <NavLink to="/portal/profile"><User size={18} /> Profile</NavLink> : null}
        </nav>
        <button type="button" onClick={onLogout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <main className="management-portal__main">
        <header className="management-portal__topbar">
          <div>
            <span>Secure Management Portal</span>
            <h1>Welcome, {user.name}</h1>
          </div>
          <p>{user.roles.join(", ")} / Session {session.mfaVerified ? "verified" : "pending MFA"}</p>
        </header>
        {children}
      </main>
    </section>
  );
}

function Dashboard({ summary }) {
  const cards = [
    ["New contacts", summary.newContacts],
    ["Pending prayer requests", summary.pendingPrayerRequests],
    ["Pending testimonials", summary.pendingTestimonials],
    ["Security alerts", summary.securityAlerts],
    ["Staff requiring MFA", summary.staffRequiringMfa],
    ["Donation/provider status", summary.donationProviderStatus],
  ];
  return (
    <section className="portal-screen">
      <div className="portal-screen__heading">
        <Activity />
        <div>
          <h2>Dashboard</h2>
          <p>Release 1 summary data is served by protected API endpoints.</p>
        </div>
      </div>
      <div className="portal-summary-grid">
        {cards.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <section className="portal-card">
        <h3>Recent activity</h3>
        {summary.recentActivity?.length ? (
          <ul className="portal-activity-list">
            {summary.recentActivity.map((item) => (
              <li key={item.id}>
                <span>{item.action}</span>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No activity recorded yet.</p>
        )}
      </section>
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
          <p>Authenticator app enrollment is required for staff accounts.</p>
        </div>
      </div>
      <section className="portal-card portal-security-card">
        <StatusRow label="MFA status" value={user.mfaEnabled ? "Enrolled" : "Required"} good={user.mfaEnabled} />
        <StatusRow label="Password reset flag" value={user.requirePasswordReset ? "Required" : "Not required"} good={!user.requirePasswordReset} />
        {!user.mfaEnabled ? (
          <button className="button button--gold" type="button" onClick={startEnrollment}>
            <KeyRound size={18} /> Start authenticator enrollment
          </button>
        ) : null}
      </section>
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
      const result = await apiRequest(`/api/users/${selectedUser.id}/${action}`, { method: "POST" });
      if (result.user) setSelectedUser(result.user);
      setMessage(result.message || successMessage);
      await loadUsers();
      await loadUser(selectedUser.id);
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  if (selectedUser) {
    return (
      <section className="portal-screen">
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
        <div className="staff-detail-grid">
          <section className="portal-card portal-form">
            <h3>Profile details</h3>
            <div className="staff-profile-editor">
              <div className="staff-profile-photo" aria-label={`${selectedUser.name} profile photo`}>
                {selectedUser.image ? <img src={selectedUser.image} alt="" /> : <span>{initialsFor(selectedUser.name)}</span>}
              </div>
              <div>
                <label>Name<input value={selectedUser.name || ""} onChange={(event) => updateSelected("name", event.target.value)} /></label>
                <label>Title<input value={selectedUser.title || ""} onChange={(event) => updateSelected("title", event.target.value)} /></label>
              </div>
            </div>
            <label>Ministry<input value={selectedUser.ministry || ""} onChange={(event) => updateSelected("ministry", event.target.value)} /></label>
            <label>Phone<input value={selectedUser.phone || ""} onChange={(event) => updateSelected("phone", event.target.value)} /></label>
            <label>Bio<textarea value={selectedUser.bio || ""} onChange={(event) => updateSelected("bio", event.target.value)} /></label>
            <label className="portal-check">
              <input type="checkbox" checked={Boolean(selectedUser.showOnLeadership)} onChange={(event) => updateSelected("showOnLeadership", event.target.checked)} />
              Show on Leadership page
            </label>
            <label className="portal-check">
              <input type="checkbox" checked={selectedUser.isActive !== false} onChange={(event) => updateSelected("isActive", event.target.checked)} />
              Active account
            </label>
          </section>
          <section className="portal-card">
            <h3>Roles</h3>
            <div className="role-picker">
              {roles.map((role) => (
                <label key={role}>
                  <input type="checkbox" checked={(selectedUser.roles || []).includes(role)} onChange={() => toggleSelectedRole(role)} />
                  {role}
                </label>
              ))}
            </div>
            <div className="staff-security-actions">
              <button className="button button--outline" type="button" onClick={() => staffAction("invite", "Invitation staged.")}>
                <UserPlus size={18} /> Stage invite
              </button>
              <button className="button button--outline" type="button" onClick={() => staffAction("force-password-reset", "Password reset required.")}>
                <KeyRound size={18} /> Force password reset
              </button>
              <button className="button button--outline" type="button" onClick={() => staffAction("reset-mfa", "MFA reset and sessions revoked.")}>
                <RotateCcw size={18} /> Reset MFA
              </button>
              <button className="button button--outline" type="button" onClick={() => staffAction("revoke-sessions", "Sessions revoked.")}>
                <Lock size={18} /> Revoke sessions
              </button>
              <button className="button button--outline" type="button" onClick={() => staffAction("deactivate", "Account deactivated.")}>
                <EyeOff size={18} /> Deactivate
              </button>
              <button className="button button--danger" type="button" onClick={() => staffAction("offboard", "Staff offboarded.")}>
                <XCircle size={18} /> Offboard
              </button>
            </div>
          </section>
          <section className="portal-card">
            <h3><History size={18} /> Staff audit history</h3>
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
          <Users />
          <h2>Staff Management</h2>
          <p>Manage access, MFA, roles, leadership visibility, and offboarding.</p>
        </div>
        <button className="button button--gold" type="button" onClick={() => setCreateOpen((open) => !open)}>
          <UserPlus size={18} /> Add staff
        </button>
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
          <label>Ministry<input value={form.ministry} onChange={(event) => updateForm("ministry", event.target.value)} /></label>
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
      <div className="staff-list">
        {users.map((user) => (
          <button type="button" key={user.id} className="staff-row" onClick={() => setSelectedId(user.id)}>
            <span>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
            <span>{user.roles.join(", ")}</span>
            <span>{user.mfaEnabled ? "MFA enrolled" : "MFA required"}</span>
            <span>{user.showOnLeadership ? <Eye size={16} /> : <EyeOff size={16} />}</span>
            <span className={user.isActive ? "is-good" : "is-warning"}>{user.isActive ? "Active" : "Inactive"}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProfileScreen({ user, onLogoutAll }) {
  return (
    <section className="portal-screen">
      <div className="portal-screen__heading">
        <User />
        <div>
          <h2>Profile & Session Security</h2>
          <p>Release 1 profile view confirms account, role, and session controls.</p>
        </div>
      </div>
      <section className="portal-card">
        <StatusRow label="Name" value={user.name} good />
        <StatusRow label="Email" value={user.email} good />
        <StatusRow label="Roles" value={user.roles.join(", ")} good />
        <button className="button button--outline" type="button" onClick={onLogoutAll}>
          <Lock size={18} /> Logout all devices
        </button>
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
