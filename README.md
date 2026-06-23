# AWD — All Walls Down

Official website for All Walls Down and its associated ministries:
Brothers Keepers, Brothers Keepers Core Leadership, and Daughters of the Kingdom.

## Development

```bash
npm install
npm run dev
```

## Branch workflow

- `dev` — active development
- `testing` — created when a release is ready for testing
- `production` — final review before merging to `main`
- `main` — approved release history

## Giving

Donation buttons open the official AWD Zeffy donation form in an embedded modal,
with a direct-link fallback.

## Public routes

- `/` — Home
- `/About_us` — About AWD, mission, vision, and founders
- `/Ministries` — Brothers Keepers, Core Leadership, and Daughters of the Kingdom
- `/Leadership` — AWD ministry leadership
- `/Get_Involved` — Prayer, partnership, service, and giving

The project includes SPA rewrites for direct URL navigation on Vercel and
Netlify-compatible hosts.

## Production SEO configuration

Copy `.env.example` to `.env` and set `VITE_SITE_URL` to the final public
domain before the production build. This sets absolute canonical URLs and
generates `sitemap.xml` plus the sitemap declaration in `robots.txt`.
