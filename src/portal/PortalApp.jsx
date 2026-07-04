import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  KeyRound,
  Lock,
  LogOut,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { apiRequest } from "../shared/api";

const idleLogoutMs = 60 * 60 * 1000;
const activityEvents = ["click", "keydown", "pointerdown", "scroll", "touchstart"];

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

function PortalShell({ user, session, onLogout, children }) {
  return (
    <section className="management-portal">
      <aside className="management-portal__sidebar">
        <img src="/assets/awd-logo.webp" alt="" width="1190" height="1322" />
        <strong>AWD Portal</strong>
        <nav>
          <NavLink to="/portal/dashboard"><BarChart3 size={18} /> Dashboard</NavLink>
          <NavLink to="/portal/security"><ShieldCheck size={18} /> MFA & Security</NavLink>
          <NavLink to="/portal/profile"><User size={18} /> Profile</NavLink>
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
      <PortalShell user={auth.user} session={auth.session} onLogout={logout}>
        <SecurityScreen user={auth.user} refreshUser={refreshUser} />
      </PortalShell>
    );
  }

  return (
    <PortalShell user={auth.user} session={auth.session} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Navigate to="/portal/dashboard" replace />} />
        <Route path="/dashboard" element={summary ? <Dashboard summary={summary} /> : <LoadingPanel />} />
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
