# MFA

Release 1 supports authenticator-app TOTP enrollment.

## Flow

1. Staff signs in with email and password.
2. If MFA is not enrolled, the portal opens the Security screen.
3. Staff starts enrollment.
4. API generates a TOTP secret and `otpauth://` URI.
5. Portal displays a QR code URL for scanning.
6. Staff enters a 6-digit authenticator code.
7. API verifies TOTP and enables MFA.
8. Recovery codes are generated and shown once.

Compatible apps include Google Authenticator, Microsoft Authenticator, Authy, 1Password, and iCloud Keychain-compatible TOTP apps.

## Recovery Codes

Recovery codes are hashed server-side and can be regenerated after authentication.
