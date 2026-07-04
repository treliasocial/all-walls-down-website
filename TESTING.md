# Testing

## Release 1 Checklist

- Public routes render: `/`, `/About_us`, `/Ministries`, `/Leadership`, `/Get_Involved`.
- Admin Login link opens the modal.
- Invalid login returns a clean error.
- `/portal` rejects unauthenticated users.
- Protected API routes reject unauthenticated requests.
- Bootstrap admin works only with required environment variables.
- MFA enrollment generates an `otpauth://` URI and QR code.
- TOTP verification enables MFA.
- Recovery codes are shown once.
- Logout revokes the session.
- Logout all devices revokes active sessions.
- Audit/security events are written.
- `npm run lint` passes.
- `npm run build` passes.

## No Secrets

Before committing, inspect diffs and ensure no real secrets, SMTP passwords, session tokens, MFA secrets, or recovery codes are committed.
