# HSE Dashboard

Multi-tenant Health, Safety & Environment (HSE) dashboard built with Next.js 16 (App Router), TypeScript, Tailwind CSS, Drizzle ORM, and SQLite. It covers findings, incidents, work permits, PPE inventory, training courses, statistics, reports, team management with invitations, and articles.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, Turbopack)
- **Styling:** Tailwind CSS v4 + shadcn/ui-style components, dark mode included
- **Database:** SQLite via better-sqlite3 (or PostgreSQL via Drizzle, swap out `src/lib/db`)
- **Auth:** Auth.js v5 (credentials provider, bcrypt passwords)
- **Charts / tables:** Recharts, TanStack Table
- **Maps:** Leaflet + react-leaflet (work permit site layout)
- **Email:** Resend + React Email (invitation emails) + server-side notification/report templates
- **Presentations:** pptxgenjs (PPTX report exports)
- **PDF reports:** pdfkit
- **Testing:** Vitest + vite-tsconfig-paths
- **Uploads:** Local storage (`/api/upload`) by default; UploadThing ready (`/api/uploadthing`)

## Getting Started

Requires Node.js 20+.

```bash
npm install
```

Create `.env.local` with any of the following (all optional):

```env
# Used for Auth.js sessions. If omitted, a fixed dev fallback is used.
AUTH_SECRET=generate-one-with-`npx auth secret`

# Invitation emails (Resend). If omitted, invites are shown as links instead of emails.
RESEND_API_KEY=re_...
EMAIL_FROM=HSE Dashboard <onboarding@resend.dev>

# UploadThing (optional, only needed for /api/uploadthing)
UPLOADTHING_TOKEN=...

# Scheduled report delivery — required for `npm run reports:cron` and POSTing to /api/cron/reports.
# Provide any secret; the runner sends it as a Bearer token.
CRON_SECRET=change-me

# Optional: "Sign in with Google" (shown on /login only when both are set).
# Callback URL: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Optional: "Sign in with LinkedIn" (OIDC). Shown on /login only when both are set.
# Callback URL: http://localhost:3000/api/auth/callback/linkedin
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# Optional: structured JSON logs to logs/app.log (errors always go to the console too)
LOG_FILE=1

# Optional: number of database backups to keep (default 10)
BACKUP_KEEP=10
```

Seed the database and start the dev server:

```bash
npm run db:seed     # create schema + demo data (skip if a database already exists)
npm run dev         # http://localhost:3000
```

Reset the database at any time with `npm run db:reset`. The SQLite file lives at `.data/hse.db`.

> Note: uploads are stored under `public/uploads/`. In production (`next start`) they are served from `.next`'s build snapshot, so files added after building are served by `src/app/uploads/[...path]/route.ts` instead — no restart needed.

### Demo accounts

| Role   | Email          | Password  |
| ------ | -------------- | --------- |
| Admin  | admin@hse.demo | admin123  |
| Editor | editor@hse.demo| admin123  |
| Viewer | viewer@hse.demo| admin123  |

### Production build

```bash
npm run build
npm run start
```

## Features

- **Security industry workflow** — findings, incidents, work permits, stats, reports, TBT/induction/training records, manhours & manpower
- **Landing page & i18n** — marketing home page at `/`, plus English/Arabic (العربية) with full RTL support. Switch languages from the header (dashboard) or top-right (login / landing) using the globe menu; the choice is stored in the `locale` cookie. Server components read it via `getDictionary()`, client components via `useLocale()`.
- **Sign in with Google / LinkedIn** — OAuth providers light up automatically when the matching `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` or `LINKEDIN_CLIENT_ID`/`LINKEDIN_CLIENT_SECRET` are set. First-time OAuth users are auto-provisioned (viewer role) into the first tenant.
- **Findings & incidents** — severity, status, corrective actions, photo/evidence uploads, reports
- **PPE inventory** — categories, stock levels, low-stock alerts, issue/receipt/return transactions, item photos
- **Work permits** — types, statuses, approval workflow, interactive site-layout map with permit locations
- **Team management** — org chart, roles (admin/editor/publisher/viewer), invitations with job titles, accept-via-link flow
- **Projects** — per-tenant project grouping
- **Training & Courses (Udemy-style)** — course catalog with cover images, categories, levels, providers, duration, optional external course links, and per-user learning progress (enroll / track 0–100% / complete), with "My Learning" and draft/published/archived workflows for admins
- **Articles & news** — categorized posts with cover images
- **Dashboard & statistics** — Charts/Pro/Detail views, cumulative annual metrics
- **Reports** — per-report HTML download via `/api/reports/[id]/download`, PPTX export via `/api/reports/[id]/download/pptx`, PDF export via `/api/reports/[id]/download/pdf`, email delivery (Resend) via the report detail page (`reports:export` permission), and optional **monthly email scheduling** with a cron runner
- **TBT / Inductions / Man-hours** — standalone CRUD pages with summary cards, photos on TBT, induction statuses/expiry, and per-day man-hour entries
- **Audit log** — every create/update/delete/close/email action on findings, incidents, TBT, inductions, manhours and reports is recorded in the `audit_logs` table (actor, action, entity, details)
- **Security hardening** — login rate limiting (5 attempts / 15 min per IP+account), upload magic-byte validation with 415 on mismatch, and automatic EXIF/GPS/XMP metadata stripping from JPEG/PNG uploads
- **Notifications** — assignees receive an email when a finding is created or reassigned to them
- **Observability** — `GET /api/health` endpoint plus a JSON-lines logger
- **Database backups** — `npm run db:backup` snapshots the SQLite file into `backups/` with rotation
- **Dark mode** — toggle persisted by `next-themes`

## Multi-tenancy

All business tables carry `tenant_id`. Tenancy is resolved per-request from the session's membership (`src/lib/tenant.ts`); every query filters by the current tenant. Users can belong to multiple tenants, and each membership carries a role.

## Scheduled reports & cron

The report detail page (`reports:export`) lets you schedule a report for **monthly email delivery**. The cron route `GET /api/cron/reports` enumerates due schedules (reports marked `monthly` with a recipient whose `last_sent_at` is before the current month), emails them via Resend, updates `last_sent_at`, and records audit entries.

Run it manually, or wire the same command into a monthly cron job:

```bash
npm run reports:cron        # requires CRON_SECRET (defaults to localhost:3000; use CRON_URL to override)
```

## Security hardening

- **Login rate limiting** — the credentials provider is limited to 5 attempts per 15 minutes per IP + account (`src/lib/rate-limit.ts`, in-memory sliding window; single-process deployments).
- **Upload validation** — `POST /api/upload` sniffs the file's magic bytes and rejects anything whose declared type/extension does not match (415). EXIF/GPS/XMP/IPTC metadata is stripped from JPEG and PNG files before storage (`src/lib/image-magic.ts`).

## Observability & backups

- `GET /api/health` returns `{ ok: true, db: "up" }` (503 if the database is unreachable) — useful for uptime checks.
- With `LOG_FILE=1`, the app appends structured JSON logs to `logs/app.log`; errors are always also written to stderr.
- `npm run db:backup` checkpoints the WAL and copies `.data/hse.db` to `backups/hse-<timestamp>.db`, pruning old backups (`BACKUP_KEEP`, default 10).

## Testing

```bash
npm run test   # Vitest: rate limiter, upload magic-byte detection + metadata stripping, utils, permissions
```

## File uploads

- Local (default): `POST /api/upload` stores image files under `public/uploads/<tenant-slug>/` and records them in the `media` table. Served back through `src/app/uploads/[...path]/route.ts`. Only JPG/PNG/WebP/GIF/AVIF/BMP, max 8 MB per file. Files are validated by magic bytes and stripped of EXIF/metadata.
- UploadThing (deploy-ready): configure `UPLOADTHING_TOKEN` and point the form's uploader at `/api/uploadthing` (`src/lib/uploadthing.ts` exposes the typed `UploadButton`).

## Invitation flow

Admins invite a user by email from `/team/invite`. An invite token is stored (with expiry + max uses); a member link is generated and — when `RESEND_API_KEY` is set — emailed through a React Email template. Opening `/accept/<token>` lets the invitee create their account and join the tenant directly. Invitations can be revoked from the team page.

## Project structure

```
src/
├── app/
│   ├── (dashboard)/       # dashboard pages: findings, incidents, permits, inventory, reports, team, articles, settings, stats, projects, courses, tbt, inductions, manhours
│   ├── (auth)/            # login page
│   ├── accept/[token]     # invitation acceptance
│   ├── api/               # route handlers: upload, uploadthing, auth, health, cron/reports, reports (html + pptx + pdf download)
│   └── uploads/[...path]  # serves locally-stored uploads
├── components/            # UI + feature components (charts, forms, org tree)
├── lib/                   # auth, db (schema/seed/migrate/backup), permissions, tenant, uploads, image-magic, rate-limit, audit, logger, email, utils
└── proxy.ts               # middleware (public routes + session gating)
```

## Scripts

| Script         | Description                                    |
| -------------- | ---------------------------------------------- |
| `npm run dev`  | Development server (Turbopack)                 |
| `npm run build`| Production build                               |
| `npm run start`| Production server                              |
| `npm run lint` | ESLint                                         |
| `npm run db:seed`  | Create schema and seed demo data            |
| `npm run db:reset` | Force-reset and reseed the database        |
| `npm run db:studio`| Open Drizzle Studio                        |
| `npm run db:backup`| Snapshot the SQLite database into `backups/` with rotation |
| `npm run reports:cron` | Send due scheduled report emails (requires `CRON_SECRET`) |
| `npm run test`    | Run the Vitest suite                        |