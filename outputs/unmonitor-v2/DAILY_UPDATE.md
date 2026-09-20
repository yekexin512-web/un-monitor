# Daily Update

UN Monitor V2 updates job data by running:

```powershell
powershell -ExecutionPolicy Bypass -File outputs\unmonitor-v2\update_daily.ps1
```

This command:

1. Runs `work/export_live_jobs.py`.
2. Scrapes UN Careers / Inspira, UNICEF, UNHCR, UNIDO, WFP, FAO, ITU, UNU, and UNESCO.
3. Writes `outputs/unmonitor-v2/jobs-data.js`.
4. Updates the `Last updated` timestamp shown on the website.

If a source fails, its previous records are retained and a warning is included in
`jobs-data.js`. Those retained records have not been refreshed in that run.

To register a Windows scheduled task:

```powershell
powershell -ExecutionPolicy Bypass -File outputs\unmonitor-v2\register_daily_update.ps1
```

Default schedule:

- Task name: `UNMonitorV2DailyUpdate`
- Frequency: daily
- Time: 09:00

UNESCO uses the official Internship job-family filter and follows result pages.
The shorter title filter `title=intern` can omit postings titled `INTERNSHIP`.
Closing dates come from the official listing, including expired entries that
UNESCO still lists; listing a job does not imply its deadline is still open.
