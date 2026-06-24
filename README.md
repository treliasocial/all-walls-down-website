# All Walls Down Organization Website

This is the active development branch for the All Walls Down Organization website. It contains the latest in-progress source for the public website, ministry pages, donation modal, responsive layout, animation effects, and SEO metadata.

## Branch Role

`dev` is the working branch for implementation.

Use this branch for:

- Feature development
- Copy and content updates
- Responsive UI fixes
- Asset cleanup and optimization
- Donation form updates
- SEO and metadata changes
- Pre-test validation before cloning to `Test`

Do not treat `dev` as client-approved or production-ready until the work has been reviewed in `Test`.

## Current Branch Workflow

- `dev` - active development
- `Test` - user acceptance testing and client review
- `Production` - production release lane, held until client signoff
- `main` - stable repository baseline and project overview

## Tech Stack

- React 18
- Vite 6
- React Router
- Lucide React icons
- CSS animations and responsive layout
- Zeffy embedded donation form

## Local Setup

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev -- --host 0.0.0.0 --port 3000 --strictPort
```

Open:

```text
http://localhost:3000/
```

## Validation Commands

Run a production build:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Generate sitemap and robots output when a production URL is configured:

```bash
VITE_SITE_URL=https://example.org npm run build
```

If `VITE_SITE_URL` is not set, sitemap generation is skipped by design.

## Developer Notes

Key files:

- `src/App.jsx` - routes, content, metadata, donation modal, ministry data, and animation markup
- `src/styles.css` - full responsive styling, animation effects, mobile/tablet/desktop layout
- `public/assets/` - ministry logos, hero imagery, and cleaned transparent artwork
- `scripts/generate-sitemap.mjs` - sitemap and robots generator
- `vercel.json` - SPA rewrite for direct route navigation

Routes:

- `/` - Home
- `/About_us` - About, mission, vision, founders
- `/Ministries` - Brothers Keepers and Daughters of the King
- `/Leadership` - AWD leadership
- `/Get_Involved` - prayer, partnership, service, and giving

## Donation Form

The donation modal uses this Zeffy form:

```text
https://www.zeffy.com/en-US/donation-form/awdo-donate-to-change-lives
```

The URL is centralized as `donationUrl` in `src/App.jsx`. Update that constant only, so the iframe and fallback link stay in sync.

## UI QA Checklist

Before cloning `dev` to `Test`, verify:

- Home page loads without framework errors
- Mobile navigation opens and closes
- Donation modal opens and embeds the Zeffy form
- All public routes render directly on refresh
- Home ministry logos are centered and readable
- Brothers Keepers ember effects are visible but not distracting
- Daughters of the King effects do not wash out or clip the logo
- About hero mark is not cropped on mobile or tablet
- Desktop and mobile layouts have no overlapping text
- `npm run build` passes

## Promotion Process

When development is ready for review:

```bash
git checkout dev
git status
git push origin dev
git checkout Test
git reset --hard dev
git push origin Test
```

Only promote to `Production` after explicit client approval.
