# Deployment

## Local

Start API:

```bash
npm run dev:api
```

Start frontend:

```bash
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

## Hostinger/Subdomain Notes

Future portal deployment can use a subdomain such as `portal.<domain>`.

Set:

- `AWD_PORTAL_URL`
- `AWD_PUBLIC_SITE_URL`
- `AWD_ALLOWED_ORIGINS`
- `VITE_PORTAL_URL`
- `VITE_AWD_API_URL`

Use HTTPS in production so Secure HttpOnly cookies can be enforced.

Do not promote to Production without explicit client approval.
