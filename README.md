# All Walls Down Organization Website - Test Branch

This branch is for User Acceptance Testing (UAT) and client review. It should mirror the current candidate from `dev` when the team is ready for review, but it is not the production release branch.

## Branch Role

`Test` is the review lane.

Use this branch for:

- Client review
- Stakeholder feedback
- User acceptance testing
- Visual QA on real devices
- Donation flow verification
- Content approval before production

Do not add new development work directly on `Test` unless it is a documented test-only fix. Normal changes should be made in `dev`, then cloned back to `Test`.

## Current Branch Workflow

- `dev` - active development
- `Test` - UAT and client review
- `Production` - production release lane after signoff
- `main` - stable repository baseline and project overview

## UAT Start Checklist

Before beginning client review:

- Confirm `Test` was cloned from the intended `dev` commit
- Confirm the test deployment points to the `Test` branch
- Run `npm run build`
- Verify the donation form opens from each Donate button
- Verify direct route refresh works for every public page
- Check desktop, tablet, and mobile layouts
- Capture screenshots of any issues before requesting changes

## UAT Test Plan

### Home Page

Review:

- Header logo and "All Walls Down Organization" text
- Hero copy and button behavior
- Donation button behavior
- Brothers Keepers logo and ember effects
- Daughters of the King logo and subtle sparkle effects
- Mobile spacing around "Our Mission"
- No text or logo overlap at mobile, tablet, or desktop widths

### About Page

Review:

- Mission and vision copy
- Founder section
- Background mark visibility
- Mobile and tablet crop behavior
- Page metadata title and description in browser tab/search preview tools

### Ministries Page

Review:

- Brothers Keepers name, logo, copy, scripture, and ember effects
- Daughters of the King name, logo, copy, and crown-light effects
- Effects do not hide, wash out, or clip ministry logos
- Buttons open the donation modal
- Mobile scroll flow is readable and polished

### Leadership Page

Review:

- Core Leadership section
- Director names
- Daughters of the King director section
- Logo sizing and alignment on mobile and desktop

### Get Involved Page

Review:

- Prayer, partnership, service, and giving sections
- Donation CTA behavior
- Mobile button sizing and spacing

## Donation Form UAT

The embedded donation form should use:

```text
https://www.zeffy.com/en-US/donation-form/awdo-donate-to-change-lives
```

Test:

- Donate buttons open the modal
- The Zeffy form loads inside the iframe
- The fallback "Open secure donation page" link opens the same URL
- Closing the modal returns to the same page without layout issues

Do not submit a real donation during routine UAT unless the client approves a live transaction test.

## Validation Commands

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev -- --host 0.0.0.0 --port 3000 --strictPort
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## UAT Signoff

Use this checklist before promotion:

- Client has reviewed all public pages
- Client has approved ministry names, copy, and imagery
- Client has approved donation form behavior
- Client has approved mobile layout
- Known issues are either fixed or accepted
- `Test` branch commit hash is recorded

After signoff, clone the approved `Test` commit to `Production`. Do not promote partial or unapproved changes.

## Reporting Issues

For each issue, record:

- Page URL
- Device and browser
- Viewport size if known
- Screenshot or screen recording
- Expected behavior
- Actual behavior
- Whether it blocks production signoff
