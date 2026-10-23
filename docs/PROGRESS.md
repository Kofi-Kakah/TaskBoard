# Project Progress

Phase statuses: Not started / In progress / Awaiting approval / Approved.

| Phase | Status | Date | Notes |
|---|---|---|---|
| 0. Discovery and plan | Approved | 2026-10-22 | Repo and official docs reviewed. User confirmed no reference image will be supplied; use TaskBoard branding and follow the written design specs in AGENTS.md. Current dnd-kit docs recommend @dnd-kit/react, while Section 3 specifies the legacy package family; revisit before Phase 9. |
| 1. Foundation and design system | Approved | 2026-10-22 | Added design tokens, Inter, shadcn/Radix primitives, shared utilities, .env.example, and /design-preview. Updated Tailwind 4 PostCSS plugin and added Suspense boundaries needed by existing Clerk routes under Next.js 16 cache components. npm reported 9 high-severity audit findings during dependency installation; not assessed in this phase. |
| 2. Authentication (Clerk) | Approved | 2026-10-23 | User directed continuation after confirming a signed-in session and that `/boards` loads. Signed-out redirect/public-route and explicit sign-out checks remain unverified. |
| 3. Supabase backend and security | In progress | 2026-10-23 | Added Clerk third-party-auth Supabase setup guide, RLS migration, typed server client, and authenticated diagnostic route/actions. Static lint, typecheck, and build pass. Awaiting user-side Clerk/Supabase dashboard setup, SQL migration, and two-user RLS execution. Migration owner default uses `auth.jwt()` without a scalar subquery because Postgres disallows subqueries in DEFAULT expressions; policy JWT calls use the required `(select ...)` wrapper. Supabase CLI is not installed and `npx` could not download it in this environment. |
| 4. App shell and static kanban | Not started | - | |
| 5. Boards | Not started | - | |
| 6. Columns | Not started | - | |
| 7. Tasks, priorities, and due dates | Not started | - | |
| 8. Labels | Not started | - | |
| 9. Drag and drop | Not started | - | |
| 10. Search and filtering | Not started | - | |
| 11. Public/private boards and sharing | Not started | - | |
| 12. Polish, QA, and handoff | Not started | - | |
