# UN Monitor V2 Blueprint

## Product Goal

Build a deployable multi-user web app for UN internship discovery and application tracking.

The product has three top-level sections:

1. `Opportunities`
2. `Dashboard`
3. `Resume Studio`

For the MVP, Resume Studio stays lightweight. Motivation-letter rewriting and AI generation are parked until the job discovery and application dashboard feel useful.

## Site Structure

## Requirement 1: Daily Update

The job database must update once per day.

MVP behavior:

- Run `work/export_live_jobs.py` daily.
- Generate `outputs/unmonitor-v2/jobs-data.js`.
- The website loads `jobs-data.js` before `app.js`.
- The top bar shows the latest `generatedAt` timestamp as `Last updated`.
- If one source fails, the exporter should still write jobs from other successful sources and preserve source warnings.

Current update sources:

- UN Careers / Inspira
- UNICEF
- UNHCR
- WFP

Current local update command:

```powershell
powershell -ExecutionPolicy Bypass -File outputs\unmonitor-v2\update_daily.ps1
```

Daily scheduling target:

- Windows Task Scheduler
- Suggested time: 09:00 Europe/London
- Task name: `UNMonitorV2DailyUpdate`
- Action: run `outputs/unmonitor-v2/update_daily.ps1`

### Opportunities

Purpose: find roles and start application records.

Core features:

- job list
- today's new jobs
- expiring soon
- category filters
- source, continent, deadline, posted date, and status filters
- job detail panel
- mark as applied
- open official JD / application link

### Dashboard

Purpose: show daily priorities and application progress.

Core widgets:

- new jobs today
- jobs expiring within 7 days
- applications submitted today
- applications submitted in the last 7 days
- applications submitted in the last 30 days
- application volume bar chart
- applications by category
- application Kanban board

Recommended pipeline statuses:

- `found`
- `applied`
- `assessment`
- `interview`
- `rejected`

### Resume Studio

Purpose: hold profile data and future tailoring workflows.

MVP scope:

- user profile
- skill keywords
- experience evidence bank
- application draft notes
- parked AI generation entry point

Later scope:

- JD requirement extraction
- CV bullet rewriting
- motivation letter drafting
- Inspira answer drafting
- DOCX / PDF export

## Job Categories

Each job should have one primary category and optional secondary tags.

Initial categories:

- Economics & Development
- Data & Analytics
- Tech & Digital
- Communications & Advocacy
- Programme & Project
- Humanitarian & Protection
- Partnerships
- Legal & Human Rights
- Climate & Environment
- Admin, Finance & HR

## Multi-User Data Model

Shared across users:

- `jobs`
- `job_sources`
- `job_categories`

Private per user:

- `user_profiles`
- `applications`
- `application_events`
- `generated_documents`
- `draft_notes`
- `saved_searches`
- `notifications`

Important separation:

- A job is global.
- An application belongs to one user.
- A user's status, notes, fit score, and generated documents are private.
- Multiple users can apply to the same global job while keeping separate boards.

## AI Cost Strategy

Resume Studio is the main future cost center.

Principles:

- A skill can reduce prompt work, but it does not remove model inference cost.
- Use rule-based parsing and templates where possible.
- Cache generated outputs per user and application.
- Add monthly generation limits.
- Allow bring-your-own API key later.
- Use one internal `LLMProvider` interface so providers can be switched.

Possible provider options:

- Gemini API free tier for early testing
- Groq free plan for open-model inference
- Hugging Face Inference Providers
- OpenRouter free and paid models
- Ollama local models for zero API cost with weaker deployment ergonomics

## MVP Implementation

The first prototype is a static clickable app:

- no backend
- sample job data
- daily generated live job data
- localStorage persistence
- three top-level sections
- job filtering
- source and continent filtering
- status updates
- dashboard metrics
- application bar chart
- category chart
- Kanban board
- lightweight Resume Studio

Next implementation step:

- replace localStorage with FastAPI + PostgreSQL
- add user authentication
- add shared job table and private application table
- add real scrapers/importers
