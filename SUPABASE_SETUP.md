# Supabase Setup

This site can run in two modes:

- Local browser mode: application records stay in `localStorage`.
- Supabase mode: each signed-in user gets their own cloud dashboard.

## 1. Create a Supabase Project

Create a project at Supabase, then open:

```text
Project Settings -> API
```

Copy:

- Project URL
- anon public key

## 2. Create the Table

Open:

```text
SQL Editor
```

Run the SQL in:

```text
supabase-schema.sql
```

The table is protected with Row Level Security, so users can only read and write their own application records.

## 3. Configure the Website

Edit:

```text
outputs/unmonitor-v2/supabase-config.js
```

Fill in:

```js
window.UN_MONITOR_SUPABASE = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_ANON_PUBLIC_KEY",
};
```

## 4. Configure Auth Redirects

In Supabase, open:

```text
Authentication -> URL Configuration
```

Use the deployed GitHub Pages app URL, including the final slash:

```text
Site URL:
https://yekexin512-web.github.io/un-monitor/outputs/unmonitor-v2/
```

Add the same URL to allowed redirect URLs:

```text
https://yekexin512-web.github.io/un-monitor/outputs/unmonitor-v2/
```

If the URL is missing `/outputs/unmonitor-v2/` or the final slash, the email link can land on a GitHub Pages `404 Not Found` page.

## Data Model

Daily public job data still comes from `jobs-data.js`.

Personal user records are stored in `user_applications`:

- `user_id`
- `job_id`
- `status`
- `applied_at`
- `status_updated_at`
- `first_tracked_at`

The frontend merges both sources:

```text
public job feed + current user's application records = personal dashboard
```
