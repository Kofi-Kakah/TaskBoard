# TaskBoard

TaskBoard is a Trello-style Kanban app built with Next.js, Clerk, and Supabase. It supports private boards, read-only public boards, task labels and due dates, and drag-and-drop ordering.

## Requirements

- Node.js 20 or newer
- npm
- A Clerk application
- A Supabase project with the Clerk third-party auth integration enabled

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env.local` and fill in the four values in your Clerk and Supabase dashboards. Do not use a Supabase secret or service-role key.

3. Apply the database schema by pasting `supabase/migrations/20261023120000_taskboard_schema.sql` into the Supabase SQL Editor and running it once. The migration creates the tables, indexes, updated-at triggers, grants, and RLS policies.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000), sign in, and create a board.

For the Clerk and Supabase dashboard steps, authenticated write check, and two-user RLS verification, see [docs/PHASE3-SUPABASE-TEST-PLAN.md](docs/PHASE3-SUPABASE-TEST-PLAN.md).

## Environment variables

`.env.example` contains placeholder values only:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings → API Keys |

Only the Supabase publishable key belongs in this app. Row Level Security protects database access; never add a service-role key to the client or environment template.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run build` | Create the production build |
| `npm start` | Serve the production build |

## Routes

- `/` — redirects signed-out visitors to `/sign-in` and signed-in visitors to `/boards`
- `/boards` — signed-in user's boards
- `/boards/[boardId]` — board view; public boards are read-only to non-owners, while private boards return 404 to non-owners
- `/explore` — public boards
- `/sign-in` and `/sign-up` — Clerk authentication
- `/design-preview` — design-system preview
- `/supabase-check` — authenticated database and RLS diagnostics

## Project structure

- `app/` — App Router pages, route loading and error states, global styles
- `actions/` — validated Server Actions for boards, columns, tasks, labels, and ordering
- `components/layout/` — application shell and shared route error UI
- `components/board/` — board, column, task, and dialog UI
- `components/ui/` — styled Radix and shadcn primitives
- `lib/` — Supabase access, data loading, date and ordering helpers, validation schemas
- `supabase/migrations/` — schema and RLS migration
- `types/database.ts` — Supabase row types
- `docs/PROGRESS.md` — phase status and implementation notes

## Data and security

The app uses Clerk IDs as text user IDs and passes the signed-in Clerk token to Supabase's native third-party auth integration. Every application table has RLS enabled. Public boards can be read by signed-in and anonymous visitors; only the owner can write. The server actions validate their inputs, check ownership, and return user-safe errors.

Run the two-user and signed-out verification steps in the test plan after configuring the dashboards. Do not apply the migration repeatedly to a database where it has already been installed; it is a one-time schema migration.

## Design

The interface follows the light design tokens and layout requirements in `AGENTS.md`. The reference image was not provided, so visual review uses those written specifications. The board adapts to desktop, tablet, and mobile widths.
