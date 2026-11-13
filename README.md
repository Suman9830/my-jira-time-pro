# Jira My Time Pro

Fast issues + timesheet UI on top of Jira Cloud. Sign in with your own Atlassian account (OAuth 2.0 3LO); you only see what your Jira permissions allow.

Stack: Next.js 14 (App Router) · Neon Postgres · Vercel.

## Setup

1. **Atlassian app**: https://developer.atlassian.com/console/myapps/ → Create → OAuth 2.0 integration.
   - Permissions → Jira API → add scopes `read:jira-user`, `read:jira-work`, `write:jira-work`.
   - Authorization → callback URL: `{APP_URL}/api/auth/callback` (add both `http://localhost:3000/...` and your production URL).
   - Distribution → set to *Sharing* if colleagues will use it.
2. **Database**: create a free Neon project, copy its connection string.
3. **Env**: fill `.env.local` (template: `.env.example`). Generate the encryption key with
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
4. **Tables**: `npm run db:setup`
5. **Run**: `npm install` then `npm run dev` → http://localhost:3000

## Deploy (Vercel + your Hostinger subdomain)

- Import the repo in Vercel, add every variable from `.env.example` (set `APP_URL` to the final https URL).
- Vercel → Settings → Domains → add `time.yourdomain.com`; in Hostinger DNS add the CNAME Vercel shows.
- Add `https://time.yourdomain.com/api/auth/callback` to the Atlassian app.

## Features

- Issues: search (text or key), project, sprint, date filter (updated/created/due), assigned-to-me toggle, load more.
- Create/edit issues and subtasks: title, description, original estimate, start date*, due date, priority, labels.
- Log time from an issue row or the timesheet; delete your own worklogs.
- Timesheet: month calendar with daily totals and a day detail panel.
- Team timesheet: enable "Show team timesheets" in Settings (stored per user in the DB).

\* Jira has no standard start-date field. Set `JIRA_START_DATE_FIELD` (e.g. `customfield_10015`; find it at `{site}/rest/api/3/field`) to enable it.

## Security notes

- All secrets come from env vars; nothing is hard-coded.
- Atlassian tokens are stored AES-256-GCM encrypted; the browser only holds a random httpOnly session id.
- Team view is enforced server-side by the preference flag; Jira still limits data to what the user can access.
