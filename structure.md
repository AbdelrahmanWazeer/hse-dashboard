# HSE Dashboard — Project Structure

Multi-tenant Health, Safety & Environment (HSE) dashboard built with **Next.js 16 (App Router)**, React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, and SQLite (PostgreSQL-ready).

Generated artifact dirs (`node_modules/`, `.next/`, `.data/`, `backups/`, `logs/`, `*.log`, `*.zip`) are excluded below.

```
hse-dashboard/
├── src/
│   ├── app/                    # App Router — routes, pages, layouts, API routes, server actions
│   │   ├── layout.tsx          #   root layout: <html lang/dir>, fonts (Geist + Noto Sans Arabic), LocaleProvider, ThemeProvider, Toaster
│   │   ├── globals.css         #   Tailwind v4 entry + RTL/Arabic font rules
│   │   ├── page.tsx            #   landing page (marketing home; redirects signed-in users to /dashboard)
│   │   ├── favicon.ico
│   │   ├── actions/            #   app-wide server actions
│   │   │   └── locale.ts       #     setLocale — flips the `locale` cookie (en | ar)
│   │   ├── (auth)/             #   auth route group
│   │   │   └── login/          #     /login page, client login-form.tsx, oauth-buttons.tsx
│   │   ├── accept/             #   invitation acceptance
│   │   │   ├── actions.ts      #     acceptInvitation / createAccount server actions
│   │   │   └── [token]/        #     /accept/<token> page + client accept-form.tsx
│   │   ├── (dashboard)/        #   authenticated dashboard route group (session-gated; own layout)
│   │   │   ├── layout.tsx      #     DashboardShell: sidebar + header + language switcher
│   │   │   └── <module>/       #     each module: page.tsx + new/[id]/edit pages + actions.ts
│   │   │       ├── dashboard/  #       /dashboard home, metric cards, overview widgets
│   │   │       ├── findings/   #       findings CRUD ([id], [id]/edit, new) + actions.ts
│   │   │       ├── incidents/  #       incidents CRUD ([id], [id]/edit, new) + actions.ts
│   │   │       ├── permits/    #       permits list/new/[id]/edit + map page + actions.ts
│   │   │       ├── inventory/  #       PPE list/new/[id]/edit + transactions/new + actions.ts
│   │   │       ├── tbt/        #       toolbox talks CRUD + actions.ts
│   │   │       ├── inductions/ #       induction CRUD + actions.ts
│   │   │       ├── manhours/   #       manhours CRUD + actions.ts
│   │   │       ├── team/       #       team list + invite page + actions.ts
│   │   │       ├── projects/   #       projects list + new page + actions.ts
│   │   │       ├── courses/    #       training catalog: list (filters), [id], [id]/edit,
│   │   │       │               #       new, my-learning + actions.ts + course-label.ts
│   │   │       ├── stats/      #       statistics (charts/detail/Pro views)
│   │   │       ├── reports/    #       reports list + [id] detail page + actions.ts
│   │   │       ├── articles/   #       articles CRUD ([id], [id]/edit, new) + actions.ts
│   │   │       └── settings/   #       tenant/profile settings
│   │   ├── api/                #   route handlers (REST / misc)
│   │   │   ├── auth/[...nextauth]/route.ts   #  Auth.js v5 handler
│   │   │   ├── health/route.ts               #  GET /api/health ({ok, db})
│   │   │   ├── upload/route.ts               #  local upload w/ magic-byte + EXIF stripping
│   │   │   ├── uploadthing/{route.ts,core.ts}#  UploadThing (optional, deploy-ready)
│   │   │   ├── cron/reports/route.ts         #  scheduled monthly report emails (CRON_SECRET)
│   │   │   └── reports/[id]/download/        #  route.ts (HTML) + pdf/route.ts + pptx/route.ts
│   │   └── uploads/[...path]/route.ts        #   serves local uploads in production builds
│   ├── components/
│   │   ├── i18n/              #   locale-provider.tsx (useLocale → {locale, dir, t, tr}),
│   │   │                      #   language-switcher.tsx (globe menu)
│   │   ├── layout/            #   sidebar.tsx (permission-filtered nav), header.tsx (sign-out,
│   │   │                      #   settings link, theme toggle, locale switch), dashboard-shell.tsx
│   │   ├── ui/                #   shadcn/ui-style primitives: button, card, badge, badge-select,
│   │   │                      #   input, textarea, select, label, form, dialog, switch, tabs, table,
│   │   │                      #   progress, toast, misc (Avatar/Spinner/EmptyState), image-uploader,
│   │   │                      #   theme-toggle, theme-provider, print-button
│   │   ├── findings/          #   findings-table.tsx, finding-form.tsx
│   │   ├── incidents/         #   incidents-table.tsx, incident-form.tsx
│   │   ├── permits/           #   permits-table.tsx, permit-form.tsx, permit-map.tsx (Leaflet), permit-map-loader.tsx
│   │   ├── inventory/         #   ppe-item-form.tsx, ppe-transaction-form.tsx
│   │   ├── team/              #   invite-form.tsx, org-tree.tsx, copy-button.tsx
│   │   ├── articles/          #   article-form.tsx
│   │   ├── courses/           #   course-form.tsx, course-actions.tsx, course-delete-button.tsx
│   │   ├── records/           #   tbt-form.tsx, induction-form.tsx, manhour-form.tsx, project-form.tsx
│   │   ├── charts.tsx         #   Recharts wrappers (line/bar/pie)
│   │   ├── page-header.tsx    #   auto-translating page header (dictionary-driven)
│   │   └── landing.tsx        #   marketing landing sections
│   ├── lib/                   #   non-UI logic
│   │   ├── db/                #   schema.ts (Drizzle, all tables), index.ts (db client),
│   │   │                      #   seed.ts, migrate.ts, backup.ts
│   │   ├── i18n/              #   index.ts (getLocale/getDictionary/getT, React-cached),
│   │   │                      #   messages.ts (en/ar dictionaries + types)
│   │   ├── auth.ts            #   Auth.js config: credentials + Google/LinkedIn, jwt/session loadUserContext
│   │   ├── permissions.ts     #   role→permission map + hasPermission
│   │   ├── tenant.ts          #   current-tenant resolution per request
│   │   ├── guards.ts          #   server helpers (requireUser, requirePermission, assertTenant…)
│   │   ├── queries.ts         #   dashboard/stats aggregate queries (monthly series, KPIs)
│   │   ├── constants.ts       #   domain metadata: ROLES, JOB_TITLES, incident/severity/status/
│   │   │                      #   permit/project meta (with EN/AR labels), PPE categories, article
│   │   │                      #   categories, COURSE_CATEGORIES/COURSE_LEVELS (with labelAr)
│   │   ├── audit.ts           #   audit_logs writer
│   │   ├── email.ts           #   Resend + React Email templates (invite, notifications, reports)
│   │   ├── report-html.ts     #   HTML report template builder
│   │   ├── rate-limit.ts      #   in-memory sliding-window limiter (login)
│   │   ├── logger.ts          #   JSON-lines logger (LOG_FILE=1)
│   │   ├── image-magic.ts     #   magic-byte sniffing + EXIF/GPS stripping
│   │   ├── uploads.ts         #   local upload storage helpers
│   │   ├── uploadthing.ts     #   typed UploadThing client
│   │   └── utils.ts           #   cn(), date/number/currency formatters (locale-aware), time helpers
│   │   └── *.test.ts          #   Vitest suites (utils, rate-limit, image-magic)
│   ├── proxy.ts               #   middleware: public-route allowlist + session gating
│   └── types/next-auth.d.ts   #   session/user type augmentation (id, role, permissions, tenant…)
├── drizzle/                   #   SQL migrations (0000, 0001, 0002) + meta snapshots
├── scripts/
│   └── run-cron.mjs           #   reports:cron runner (POSTs to /api/cron/reports)
├── public/
│   ├── uploads/.gitkeep       #   locally stored uploads
│   └── *.svg                  #   stock assets
├── .data/                     #   SQLite runtime (hse.db, WAL/SHM) — not committed
├── backups/                   #   db:backup snapshots — not committed
├── eslint.config.mjs          #   ESLint flat config (Next.js)
├── next.config.ts             #   Next.js config
├── next-env.d.ts
├── postcss.config.mjs         #   Tailwind v4 postcss
├── tsconfig.json
├── vitest.config.ts           #   tsconfig-path-alias aware
├── drizzle.config.ts          #   Drizzle Kit config
├── package.json               #   scripts + deps
├── AGENTS.md / CLAUDE.md      #   agent guidance (Next.js 16 rules)
├── README.md                  #   setup, features, scripts
└── structure.md               #   this file
```

## Routes

**Public** (`src/proxy.ts` allowlist): `/`, `/login`, `/accept/*`, plus `/api/*`.

**Pages**

| Route | File |
| --- | --- |
| `/` | `src/app/page.tsx` → `components/landing.tsx` |
| `/login` | `(auth)/login/page.tsx` |
| `/accept/[token]` | `accept/[token]/page.tsx` |
| `/dashboard` | `(dashboard)/dashboard/page.tsx` |
| `/findings` `/findings/new` `/findings/[id]` `/findings/[id]/edit` | `(dashboard)/findings/**` |
| `/incidents` `/incidents/new` `/incidents/[id]` `/incidents/[id]/edit` | `(dashboard)/incidents/**` |
| `/permits` `/permits/new` `/permits/[id]/edit` `/permits/map` | `(dashboard)/permits/**` |
| `/inventory` `/inventory/new` `/inventory/[id]/edit` `/inventory/transactions/new` | `(dashboard)/inventory/**` |
| `/tbt` `/tbt/new` `/tbt/[id]/edit` | `(dashboard)/tbt/**` |
| `/inductions` `/inductions/new` `/inductions/[id]/edit` | `(dashboard)/inductions/**` |
| `/manhours` `/manhours/new` `/manhours/[id]/edit` | `(dashboard)/manhours/**` |
| `/team` `/team/invite` | `(dashboard)/team/**` |
| `/projects` `/projects/new` | `(dashboard)/projects/**` |
| `/courses` `/courses/new` `/courses/[id]` `/courses/[id]/edit` `/courses/my` | `(dashboard)/courses/**` |
| `/stats` | `(dashboard)/stats/page.tsx` |
| `/reports` `/reports/[id]` | `(dashboard)/reports/**` |
| `/articles` `/articles/new` `/articles/[id]` `/articles/[id]/edit` | `(dashboard)/articles/**` |
| `/settings` | `(dashboard)/settings/page.tsx` |

**API routes**: `/api/auth/*` (next-auth), `/api/health`, `/api/upload`, `/api/uploadthing`, `/api/cron/reports`, `/api/reports/[id]/download` (HTML/PDF/PPTX), `/uploads/*` (file serving).

## Data model (`src/lib/db/schema.ts`)

- **Tenancy**: `users`, `tenants`, `memberships` (role per user+tenant), `invitations` (token/expiry).
- **Organization**: `projects` (per tenant), `team_members` (self-referencing org tree via `managerId`).
- **HSE**: `findings`, `incidents`, `manhours`, `manpower`, `tbt_records`, `inductions`, `trainings`, `work_permits`, `site_layouts`.
- **Inventory**: `ppe_items`, `ppe_transactions` (receive/issue/return/damage/adjust).
- **Learning**: `courses` (Udemy-style catalog: category/level/provider/duration/cover/external link/tags/status), `course_progress` (per-user enroll/in-progress/completed with 0–100 progress).
- **Content & audit**: `reports` (with monthly schedule), `articles`, `media`, `audit_logs`.

Every business table carries `tenant_id`; all queries filter by the session's tenant (`src/lib/tenant.ts`).

## Conventions

- **Server actions** live per-module in `(dashboard)/<module>/actions.ts`; they re-check permissions with `assertPermission`/`guards.ts` and write `audit_logs` on create/update/delete/close/email.
- **i18n**: shell/nav/headers use the central dictionaries in `src/lib/i18n/messages.ts`; page content uses inline pairs — server `const t = await getT()` (`@/lib/i18n`) and client `const { tr, locale } = useLocale()` (`@/components/i18n/locale-provider`). Dates use `formatDate(ts, locale)` (`@/lib/utils`). Domain labels carry `labelAr` in `@/lib/constants`.
- **Auth**: Auth.js v5 with JWT sessions; user context (role, permissions, tenant) is loaded into the JWT on sign-in and hydrated in the `jwt` callback.
- **Permissions**: role-based map in `src/lib/permissions.ts`; the sidebar hides items without permission.