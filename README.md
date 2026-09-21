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

See:

```text
SUPABASE_SETUP.md
```
