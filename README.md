<div align="center">

# TaskBoard

### A collaborative Kanban board for organizing work, tracking tasks, and sharing public boards.

Built with **Next.js**, **TypeScript**, **Clerk**, and **Supabase**.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-RLS-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**[Features](#features) · [Quick Start](#quick-start) · [Routes](#application-routes) · [Architecture](#architecture) · [Security](#security)**

</div>

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Deploy to Vercel](#deploy-to-vercel)
- [Application Routes](#application-routes)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Security](#security)
- [Project Structure](#project-structure)
- [Available Commands](#available-commands)
- [Project Notes](#project-notes)

## Features

- **Boards:** create, rename, recolor, change visibility, and delete boards.
- **Columns:** create, rename, recolor, reorder, and delete columns.
- **Tasks:** quick-add, create, edit, delete, and move tasks between columns.
- **Task details:** priorities, descriptions, due dates, and board labels.
- **Drag and drop:** reorder tasks within and across columns, and reorder columns.
- **Search and filters:** find tasks by title or description and filter by priority, labels, and due date. The current view is reflected in the URL.
- **Public sharing:** public boards are viewable without signing in; only their owner can change them. Private boards are hidden from other users.
- **Responsive layout:** the board adapts to desktop, tablet, and mobile screens.

## Technology Stack

| Area | Technologies |
|---|---|
| Web framework | Next.js App Router 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI, shadcn/ui primitives |
| Authentication | Clerk |
| Database | Supabase Postgres with Row Level Security |
| Data access | Supabase JS, Supabase SSR, Next.js Server Components and Server Actions |
| Board interactions | dnd-kit and fractional indexing |
| Forms and validation | React Hook Form and Zod |
| Date handling | date-fns |
| Notifications | Sonner |

## Quick Start

### Requirements

- Node.js 20 or newer
- npm
- A Clerk application
- A Supabase project configured for Clerk third-party authentication

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and add the values from your Clerk and Supabase dashboards. See [Environment Variables](#environment-variables) for the variable list. Use the Supabase publishable key; this app does not need a service-role key.

### 3. Configure Clerk and Supabase

Enable Supabase as a third-party authentication provider in Supabase, and enable the Supabase integration in Clerk. Follow the dashboard walkthrough and verification instructions in the [Supabase test plan](docs/PHASE3-SUPABASE-TEST-PLAN.md).

### 4. Apply the database migration

If the schema has not already been installed in this Supabase project, open the SQL Editor and run [`supabase/migrations/20261023120000_taskboard_schema.sql`](supabase/migrations/20261023120000_taskboard_schema.sql). It creates the application tables, indexes, updated-at triggers, grants, and RLS policies. This is a one-time migration; do not run it again on a database where it has already been applied.

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in or create an account, then create a board.

## Environment Variables

The checked-in `.env.example` contains placeholder values only.

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings → API Keys |

Do not expose or configure a Supabase service-role key for this app. Database access uses the signed-in user's Clerk token and is governed by RLS.

## Deploy to Vercel

The `taskboard` Vercel project is configured with the Next.js preset, repository root (`.`), and automatic build settings. Add the four variables above in **Project Settings → Environment Variables** for both **Preview** and **Production** before deploying. Do not add a Supabase service-role key.

Use production Clerk keys for Production and configure the production Clerk instance with the Vercel production domain. The Supabase project's Clerk third-party auth integration must point to that same Clerk instance. For Preview deployments, use a Clerk instance whose allowed origins and Supabase integration are configured for the preview environment.

From this project directory, `vercel` creates a Preview deployment and `vercel --prod` creates a Production deployment. Verify the Preview URL first, including sign-in, board creation, and public/private board access. Environment variable changes take effect on new deployments, so redeploy after changing them.

See [Vercel's CLI deployment guide](https://vercel.com/docs/projects/deploy-from-cli) and [environment variable guide](https://vercel.com/docs/environment-variables) for the current workflow and settings.

## Application Routes

| Route | Purpose | Access |
|---|---|---|
| `/` | Redirects signed-out visitors to sign-in and signed-in visitors to their boards | Public entry point |
| `/sign-in` | Clerk sign-in | Public |
| `/sign-up` | Clerk registration | Public |
| `/boards` | Dashboard for the user's boards | Signed in |
| `/boards/[boardId]` | Kanban board | Owner, or anyone for a public board (read-only for non-owners) |
| `/explore` | Browse public boards | Public |
| `/design-preview` | Preview the design system | Development/design review |
| `/supabase-check` | Authenticated database and RLS diagnostics | Signed in |

## Architecture

- **Server Components** load board and task data.
- **Server Actions** validate and perform board, column, task, label, and ordering mutations.
- **Clerk** provides sign-in and user identity. Its session token is passed to Supabase through the native third-party auth integration.
- **Supabase Postgres** stores boards and their content. RLS determines which rows the current user can read or change.
- **Client components** handle interactive controls, dialogs, search and filtering, and drag-and-drop updates.

## Data Model

| Table | Contents |
|---|---|
| `boards` | Board owner, title, description, color, and visibility |
| `columns` | Board columns and their fractional ordering positions |
| `tasks` | Task details, priority, due date, column, and position |
| `labels` | Board-scoped label names and colors |
| `task_labels` | Many-to-many relationship between tasks and labels |

Clerk user IDs are stored as text. Position keys use fractional indexing and the database's `C` collation for consistent ordering.

## Security

- Row Level Security is enabled on all application tables.
- Owners can read and manage their own boards and board contents.
- Anyone, including signed-out visitors, can read public boards and their contents.
- Private boards are not visible to non-owners; the board route returns not found for them.
- Public boards are read-only for everyone except the owner.
- Server Actions validate inputs and enforce ownership before mutations.
- The app uses a Supabase publishable key and user-scoped Clerk tokens; no service-role key is used in client code.

After configuring Clerk and Supabase, use the [Supabase test plan](docs/PHASE3-SUPABASE-TEST-PLAN.md) to check an authenticated read/write and verify private/public access with two users and a signed-out visitor.

## Project Structure

```text
app/                         Next.js routes, layouts, loading and error states
actions/                     Validated Server Actions
components/board/            Board, column, task, and dialog UI
components/layout/           Application shell and shared layout
components/ui/               Styled UI primitives
lib/                         Supabase clients, data access, validation, and helpers
supabase/migrations/         Postgres schema and RLS migration
types/database.ts            Supabase database types
docs/                        Setup, test plan, and project progress notes
```

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking without emitting files |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |

## Project Notes

- Keep `.env.local` private. Only `.env.example` with placeholders belongs in source control.
- Apply each SQL migration once per database and keep the migration file in source control.
- See [`docs/PROGRESS.md`](docs/PROGRESS.md) for phase status and implementation notes.
- The design preview is available at `/design-preview` while the development server is running.
