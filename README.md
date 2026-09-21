# UN Monitor V2

Static internship monitor for UN Careers/Inspira and selected UN agency internship feeds.

Website entry:

```text
outputs/unmonitor-v2/index.html
```

## Local Update

```powershell
python work\export_live_jobs.py
```

The command writes fresh data to:

```text
outputs/unmonitor-v2/jobs-data.js
```

Then open:

```text
outputs/unmonitor-v2/index.html
```

## GitHub Pages Deployment

This repo includes `.github/workflows/deploy-pages.yml`.

After pushing to GitHub:

1. Open the GitHub repo.
2. Go to `Settings` -> `Pages`.
3. Set `Build and deployment` source to `GitHub Actions`.
4. Go to `Actions`.
5. Run `Deploy UN Monitor V2` manually once, or wait for the daily schedule.

The workflow runs every day at 01:00 UTC (09:00 Beijing time), refreshes
`jobs-data.js`, and stages the website in `_site` before deploying it.

The published layout preserves `outputs/unmonitor-v2/`:

- `https://yekexin512-web.github.io/un-monitor/` redirects to the app.
- `https://yekexin512-web.github.io/un-monitor/outputs/unmonitor-v2/` serves the app.

The redirect preserves query parameters and URL fragments for Supabase login
callbacks. Uploading only the contents of `outputs/unmonitor-v2` as the Pages
artifact would remove this subdirectory and break existing links and callbacks.

## Optional Multi-User Dashboard

Supabase Auth and Row Level Security can store each user's application records in the cloud.

Signing in reads cloud records before enabling edits; it never bulk-uploads the
current page over saved records. Archived job IDs remain in the dashboard even
when their descriptions have left the feed. Account-specific browser backups
retain known job details and are hidden when signed out. Legacy unscoped data is
kept untouched for recovery, not automatically imported into a signed-in account.

`Reload records` retries a failed cloud read. The account panel reports the actual
loaded count or the error, rather than treating successful login as successful
data synchronization. No database migration is required for these changes.

Regression tests (synthetic accounts only, no production data):

```text
node --test tests/test_application_sync.cjs
node tests/test_application_sync_browser.cjs
```

The browser test needs Playwright and an installed Edge browser (or set
`BROWSER_CHANNEL` to another supported installed channel).

See:

```text
SUPABASE_SETUP.md
```
