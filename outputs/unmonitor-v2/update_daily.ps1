$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root

python work\export_live_jobs.py

Write-Host "UN Monitor data updated. Refresh index.html to see the latest jobs."
