# Management Portal

## Purpose

The All Walls Down management portal is a separate secure staff/admin experience for ministry operations. The public website remains visitor-facing, while `/portal` is the protected staff route for authenticated users.

## Release 1 Scope

- Public footer Admin Login modal.
- Protected `/portal`, `/portal/dashboard`, `/portal/security`, and `/portal/profile` routes.
- Server-backed authentication, session cookies, MFA enrollment, recovery codes, RBAC foundation, dashboard summary, audit logs, and security events.
- Server-backed public contact, prayer, and testimonial intake endpoints.
- No payment card processing; donations remain provider-hosted through Zeffy.

## Roadmap

Release 2 - Staff Management: staff list, invite, edit/deactivate, force password reset, MFA reset, role assignment, leadership display toggle, offboarding, session revocation, staff audit history.

Release 3 - Inbox Modules: contact submissions, prayer requests, testimonial review, assignment, status, notes, priorities, follow-up dates, confidential prayer permissions, CSV export.

Release 4 - Content Management: page manager, section editor, draft/publish, preview, version history, leadership roster, ministry content, SEO metadata, sitemap rebuild.

Release 5 - Donation and Admin Settings: Zeffy settings, donor import/reporting if exports are available, donation follow-up, email templates, notification routing, secured mail settings.

Release 6 - Hardening and Launch Readiness: audit log UI, security dashboard, backup/export tools, Hostinger deployment checklist, final QA, production readiness review.

## Local URLs

- Public site: `http://localhost:5173/`
- Portal: `http://localhost:5173/portal`
- API: `http://localhost:8787/`

## Environment

Required for first admin bootstrap:

- `AWD_SESSION_SECRET`
- `AWD_ADMIN_EMAIL`
- `AWD_ADMIN_NAME`
- `AWD_ADMIN_BOOTSTRAP_PASSWORD`

Optional:

- `AWD_ALLOWED_ORIGINS`
- `AWD_PORTAL_URL`
- `AWD_PUBLIC_SITE_URL`
- `VITE_PORTAL_URL`
- `VITE_AWD_API_URL`
