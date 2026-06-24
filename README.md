# All Walls Down Organization Website - Production Branch

This branch is the production release lane for the All Walls Down Organization website.

## Branch Role

`Production` should contain only client-approved release work.

Do not move changes into this branch until:

- The client has reviewed the matching `Test` build
- User Acceptance Testing is complete
- The approved commit hash is known
- Production deployment settings are confirmed

## Current Branch Workflow

- `dev` - active development
- `Test` - user acceptance testing and client review
- `Production` - approved production release lane
- `main` - stable repository baseline and general project documentation

## Production Promotion Rule

Only promote from `Test` to `Production` after explicit client signoff.

Recommended promotion command after signoff:

```bash
git checkout Production
git reset --hard Test
git push origin Production --force-with-lease
```

Use `--force-with-lease` only after confirming nobody else has updated `Production`.

## Production Preflight Checklist

Before deployment:

- Confirm the client-approved commit hash
- Confirm `Production` matches the approved `Test` commit
- Run `npm install`
- Run `npm run build`
- Verify `VITE_SITE_URL` is set to the live public domain
- Verify `sitemap.xml` and `robots.txt` generation
- Verify direct route refresh behavior
- Verify donation buttons and embedded form
- Verify mobile, tablet, and desktop layouts
- Verify no development-only test notes are visible on the public site

## Donation Form

The production donation form should use:

```text
https://www.zeffy.com/en-US/donation-form/awdo-donate-to-change-lives
```

Verify both:

- Embedded iframe source
- Fallback external donation link

## Deployment Notes

This is a Vite single-page application. The hosting provider must rewrite all route requests to `index.html`.

The repository includes `vercel.json` for SPA rewrites:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Rollback Guidance

If a production release has to be rolled back:

1. Identify the last known good production commit.
2. Reset `Production` to that commit.
3. Re-run the production build.
4. Redeploy.
5. Record the rollback reason and commit hash.

Example:

```bash
git checkout Production
git reset --hard <known-good-commit>
git push origin Production --force-with-lease
```

## Production Ownership

Production should stay quiet and controlled. No experimental animation work, copy changes, asset swaps, or donation URL changes should happen directly here unless they are urgent production fixes and are documented afterward.
