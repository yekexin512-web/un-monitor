# Daily Update

UN Monitor V2 updates job data by running:

```powershell
powershell -ExecutionPolicy Bypass -File outputs\unmonitor-v2\update_daily.ps1
```

This command:

1. Runs `work/export_live_jobs.py`.
2. Scrapes UN Careers / Inspira, UNICEF, UNHCR, and WFP.
3. Writes `outputs/unmonitor-v2/jobs-data.js`.
4. Updates the `Last updated` timestamp shown on the website.

To register a Windows scheduled task:

```powershell
powershell -ExecutionPolicy Bypass -File outputs\unmonitor-v2\register_daily_update.ps1
```

Default schedule:

- Task name: `UNMonitorV2DailyUpdate`
- Frequency: daily
- Time: 09:00
