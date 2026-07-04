# Security

Release 1 replaces prototype browser-side staff storage with server-backed users, sessions, MFA state, audit logs, and security events.

## Authentication

- Passwords are hashed server-side with Node `crypto.scryptSync`.
- Sessions use opaque random tokens stored as SHA-256 hashes server-side.
- Browser receives an HttpOnly session cookie.
- Logout revokes the current session.
- Logout all devices revokes all sessions for the current user.

## MFA

- Staff accounts require MFA by default.
- TOTP secrets are generated and stored server-side only.
- Recovery codes are shown once and stored hashed.

## RBAC

Permissions are enforced server-side on protected API routes. UI hiding is not treated as authorization.

## Hardening

- CORS allowlist comes from `AWD_ALLOWED_ORIGINS` or localhost defaults.
- Login/MFA endpoints are rate limited.
- Request body size is capped.
- Security headers include CSP, nosniff, referrer policy, permissions policy, and frame controls.
- Portal routes add `noindex,nofollow`.
- Production errors should not expose stack traces.

## Secrets

Do not commit real secrets, SMTP credentials, TOTP secrets, recovery codes, session tokens, or password hashes.
