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

The workflow runs every day at 08:00 UTC, refreshes `jobs-data.js`, and deploys `outputs/unmonitor-v2` to GitHub Pages.

## Optional Multi-User Dashboard

Supabase Auth and Row Level Security can store each user's application records in the cloud.

See:

```text
SUPABASE_SETUP.md
```
