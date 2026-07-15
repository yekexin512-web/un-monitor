$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root

python work\export_live_jobs.py

$Changed = git status --porcelain -- outputs/unmonitor-v2/jobs-data.js
if ($Changed) {
  git add outputs/unmonitor-v2/jobs-data.js
  git commit -m "Update job data $(Get-Date -Format 'yyyy-MM-dd')"
  git push origin main
  Write-Host "UN Monitor data committed and pushed."
} else {
  Write-Host "UN Monitor data unchanged; nothing to push."
}

Write-Host "UN Monitor data updated. Refresh index.html to see the latest jobs."
