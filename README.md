# All Walls Down Organization Website

This repository contains the public website for All Walls Down Organization and its ministry work.

## Project Purpose

The site presents:

- All Walls Down Organization mission and vision
- Brothers Keepers ministry
- Daughters of the King ministry
- Leadership information
- Ways to pray, partner, serve, and give
- Embedded Zeffy donation flow

## Branch Workflow

This repository uses separate branch lanes:

- `dev` - active development
- `Test` - user acceptance testing and client review
- `Production` - production release lane after client signoff
- `main` - stable repository baseline and general project documentation

Changes should move through `dev`, then `Test`, then `Production` after approval.

## Tech Stack

- React
- Vite
- React Router
- CSS responsive layout and animation
- Zeffy donation form embed

## Local Setup

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Build for deployment:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

## Public Routes

- `/` - Home
- `/About_us` - About, mission, vision, and founders
- `/Ministries` - Ministry overview
- `/Leadership` - Leadership
- `/Get_Involved` - Prayer, partnership, service, and giving

The app is a single-page application. Hosting should route direct page requests back to `index.html`.

## Donation Form

Donation buttons should use the approved All Walls Down Organization Zeffy form:

```text
https://www.zeffy.com/en-US/donation-form/awdo-donate-to-change-lives
```

## SEO Configuration

Set `VITE_SITE_URL` before production builds when absolute canonical URLs, `sitemap.xml`, and `robots.txt` are required.

Example:

```bash
VITE_SITE_URL=https://example.org npm run build
```

If `VITE_SITE_URL` is not set, sitemap generation is skipped.

## Release Guidance

Do not move work into `Production` until the client approves the matching `Test` branch build.

Before production:

- Confirm the approved commit hash
- Run `npm run build`
- Verify route refresh behavior
- Verify the donation form URL
- Verify mobile and desktop layouts
- Confirm SEO domain configuration
