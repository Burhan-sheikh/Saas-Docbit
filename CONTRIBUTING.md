# Contributing

1. Fork and clone the repository.
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your own Supabase/B2/Redis/Resend/PostHog credentials.
4. Run migrations against your own Supabase project (`supabase db push`).
5. `npm run dev` to start the app, `npm run lint` and `npm run typecheck` before opening a PR.

## Code style

- Components live under `src/components/<domain>`, one component per file.
- Data access goes through `src/lib/api/<domain>.ts` — never call Supabase directly from a component.
- Server state is read via the hooks in `src/hooks/use<Domain>.ts` (TanStack Query); local UI state uses `useState`/context.
- All forms use React Hook Form + the shared Zod schemas in `src/utils/validation.ts`.
