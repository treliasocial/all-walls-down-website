import { useState } from "react";
import { ArrowRight, Lock, ShieldCheck, X } from "lucide-react";
import { apiRequest, goToPortal } from "../shared/api";

export default function AdminLoginModal({ open, onClose }) {
  const [form, setForm] = useState({ email: "", password: "", code: "" });
  const [challengeId, setChallengeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (challengeId) {
        await apiRequest("/api/auth/mfa/verify-login", {
          method: "POST",
          body: { challengeId, code: form.code },
        });
        goToPortal();
        return;
      }
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: form.email, password: form.password },
      });
      if (result.mfaRequired) {
        setChallengeId(result.challengeId);
        return;
      }
      goToPortal();
    } catch (loginError) {
      setError(loginError.payload?.setup?.missing?.length
        ? `Portal setup incomplete: ${loginError.payload.setup.missing.join(", ")}.`
        : loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="donation-modal admin-login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <ShieldCheck aria-hidden="true" />
            <span>Secure staff access</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close admin login">
            <X />
          </button>
        </header>
        <div className="donation-modal__intro">
          <h2 id="admin-login-title">Admin Login</h2>
          <p>Sign in with your staff account to access the management portal.</p>
        </div>
        <form className="portal-form admin-login-modal__form" onSubmit={submit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateForm}
              autoComplete="email"
              disabled={Boolean(challengeId)}
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateForm}
              autoComplete="current-password"
              disabled={Boolean(challengeId)}
              required
            />
          </label>
          {challengeId ? (
            <label>
              MFA Code
              <input
                name="code"
                value={form.code}
                onChange={updateForm}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </label>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button button--gold" type="submit" disabled={loading}>
            <Lock size={18} />
            {loading ? "Signing in..." : challengeId ? "Verify MFA" : "Sign In"}
          </button>
          <button className="admin-login-modal__forgot" type="button" disabled>
            Forgot password <ArrowRight size={14} />
          </button>
        </form>
      </section>
    </div>
  );
}
