# SaaS Platform

A production-ready, multi-tenant SaaS starter for teams that need workspaces, projects, a format-organized file manager, sharing links, roles & permissions, notifications, and plan-based billing — built to deploy on Netlify with Supabase as the backend.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Data & auth | Supabase (Postgres, Auth, Realtime, RLS) |
| Server-side glue | Netlify Functions |
| Object storage | Backblaze B2 (S3-compatible) |
| Cache | Redis via Upstash |
| Email | Resend |
| Product analytics | PostHog |
| Server state | TanStack Query |
| Forms & validation | React Hook Form + Zod |
| Animation | Framer Motion |
| Charts | Recharts |

## Features (Phase 1)

- **Authentication** — email/password, Google OAuth, email verification, forgot/reset password, session persistence, automatic profile creation & Google profile sync, protected/guest routes.
- **Overview dashboard** — recent activity, recent projects, workspace/project stats, storage usage, quick actions, notification preview.
- **Workspaces** — create, rename, archive/restore, delete, favorites, search/filter/sort, per-workspace stats.
- **Projects** — full CRUD, archive/restore, move between workspaces, stats, recent activity, recent uploads/links/members.
- **Data (file manager)** — drag-and-drop upload, auto-organization into format folders (Images, PDFs, Documents, Spreadsheets, Presentations, Archives, Design Files, Other — video/audio intentionally excluded), custom folders, rename/move/copy/delete/restore, search, sort, grid/list views, multi-select bulk actions, in-app preview for images/PDFs/text, trash with restore.
- **Sharing** — link creation wizard (file/folder/format-folder/whole project), custom or random slug, password protection, expiration, max downloads, require-login, view/download permission, link management (enable/disable/duplicate/regenerate/delete).
- **Members & permissions** — bulk email invites, owner/editor/viewer roles, pending invitations, permission requests with an owner approval flow, and a global **Access Denied** page with a request-access form.
- **Notifications** — realtime, in-app notification center covering every lifecycle event (project/workspace changes, links, permissions, membership, storage limits, plan changes).
- **Billing** — full plan/subscription architecture (Free/Pro/Business/Enterprise) enforced by Postgres triggers on workspace/project/storage limits, monthly/yearly toggle, and a **mock payment mode** so plans can be changed immediately without Razorpay keys. Swapping in real Razorpay checkout later requires no schema changes.
- **Analytics** — per-project views/uploads/downloads over time, country/device breakdowns, recent events — all sourced from the `analytics_events` and `activity_logs` tables.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in the values described below.

### 3. Provision the database

Create a Supabase project, then run the migrations in `supabase/migrations` **in order** (via the SQL editor, or the Supabase CLI):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

This creates every table, enum, index, RLS policy, trigger, and RPC function described below, and seeds the four default plans (Free/Pro/Business/Enterprise).

### 4. Configure Supabase Auth

- Enable the **Google** provider under Authentication → Providers, and add your OAuth client ID/secret.
- Set the **Site URL** and **Redirect URLs** (Authentication → URL Configuration) to your app origin, e.g. `http://localhost:5173` and `http://localhost:5173/auth/callback` for local dev, plus your production Netlify URL.

### 5. Run locally

```bash
npm run dev
```

The app runs at `http://localhost:5173`. Netlify Functions (used for B2 uploads, Resend emails, and the Redis cache) need the Netlify CLI to run locally:

```bash
npm install -g netlify-cli
netlify dev
```

### 6. Deploy to Netlify

- Push this repository to GitHub.
- Create a new Netlify site from the repo (`netlify.toml` is already configured with the build command, publish directory, and functions directory).
- Add all environment variables from `.env.example` in Netlify's Site settings → Environment variables (including the non-`VITE_`-prefixed server-side secrets used by the functions).

## Environment variables

See `.env.example` for the full list. In short:

- **Supabase** — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client), `SUPABASE_SERVICE_ROLE_KEY` (Netlify Functions only).
- **Backblaze B2** — `VITE_B2_BUCKET_NAME`, `VITE_B2_ENDPOINT`, `VITE_B2_REGION`, `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_ID`.
- **Redis (Upstash)** — `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- **Resend** — `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
- **PostHog** — `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`.
- **Billing** — `VITE_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (optional — leave blank to stay in mock billing mode).

## Project structure

```
saas-platform/
├── netlify/functions/       # Serverless functions: B2 presign/delete, Resend email, Redis cache proxy
├── public/                  # Static assets
├── src/
│   ├── components/          # UI library + feature components, organized by domain
│   ├── context/              # AuthContext, WorkspaceContext
│   ├── hooks/                 # TanStack Query hooks per domain + utility hooks
│   ├── lib/
│   │   ├── api/               # Supabase query layer, one file per domain
│   │   ├── integrations/      # Storage (B2), email (Resend), cache (Redis), analytics (PostHog)
│   │   └── supabase/          # Supabase client singleton
│   ├── pages/                 # Route-level components
│   ├── routes/                # ProtectedRoute / GuestRoute / VerifiedRoute guards
│   ├── styles/                 # Tailwind entrypoint & design tokens
│   ├── types/                  # Shared TypeScript types mirroring the DB schema
│   └── utils/                   # Formatting, validation (Zod schemas), slugs, file categorization
└── supabase/migrations/       # Numbered SQL migrations (schema, RLS, triggers, RPCs)
```

## Database schema

All tables live in `supabase/migrations`, applied in order:

1. `profiles`, extensions, enums, auto-profile-creation triggers (including Google metadata sync)
2. `plans`, `subscriptions` (billing)
3. `workspaces`, `workspace_members`
4. `projects`, `project_members`, `project_permissions`, `project_permission_requests`
5. `file_nodes` (folders/files with auto-created format folders), `project_links` (sharing)
6. `notifications`, `storage_usage`, `analytics_events`, `activity_logs`
7. Notification-producing triggers across every module
8. RPC functions & aggregate views (`workspace_stats`, `project_stats`, storage recalculation, public link resolution)
9. Public RPC for listing a share link's contents (used by the unauthenticated `/s/:slug` page)

Every table has row-level security enabled with policies scoped to workspace/project membership, plus foreign keys and indexes on the columns used for filtering and joins.

## Notes on the mock billing flow

The billing UI and API are fully wired against the `subscriptions`/`plans` tables. `billingApi.changePlan` immediately updates the user's subscription with `provider: 'mock'`. When you're ready to go live:

1. Add `VITE_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
2. Replace the body of `changePlan` in `src/lib/api/billing.ts` with a Razorpay checkout call, then update the subscription from a webhook-backed Netlify Function instead of directly from the client.

No schema or UI changes are required — plan limits (`max_workspaces`, `max_projects_per_workspace`, `max_storage_bytes`, `max_members_per_project`) are already enforced by Postgres triggers.

## License

MIT — see `LICENSE`.
