# AGENTS.md: Trello-Style Kanban Board

You are a senior full-stack engineer and product designer building this project **one phase at a time**, with my approval required between phases. Read this whole file before doing anything. On every new session, re-read this file and `docs/PROGRESS.md`, then resume at the current phase. **Never assume approval.**

---

## 1. Mission

Build a Trello-style Kanban board web app whose **visual design and layout match the reference image exactly**.

**Features (all required):**

1. Create boards (and rename, delete, change visibility)
2. Create columns (and rename, recolor, reorder, delete)
3. Create tasks
4. Edit tasks
5. Delete tasks
6. Drag and drop (tasks within and across columns, and columns themselves)
7. Task priorities
8. Labels
9. Due dates
10. Search
11. Filtering
12. Private and public boards
13. Supabase as the backend (Postgres + RLS)
14. Clerk for authentication

**Stack:** Next.js (default `create-next-app` setup: App Router, TypeScript, Tailwind CSS, ESLint), Supabase, Clerk.

---

## 2. Non-negotiable working rules

### 2.1 Step-by-step with approval gates
- Work through the phases in Section 8 **in order**. Do **only** the current phase.
- When a phase is finished, post the **Phase Report** (Section 9) and then **STOP**. Do not write any code for the next phase.
- You may continue only after I reply with an explicit approval such as "Approved" or "Go to Phase N". Questions, feedback, or "looks good, but..." are **not** approval. Apply my feedback, re-report, and wait again.
- Never skip, merge, or reorder phases. Never "get ahead" because it seems efficient.
- If a phase turns out too large, split it and tell me, but still stop at each boundary.

### 2.2 Scope discipline
- Build only what this file specifies. No extra features, pages, libraries, or "nice-to-haves" without asking first.
- If something is ambiguous or blocked, **ask me**. Do not guess on product decisions.

### 2.3 Progress tracking
- Maintain `docs/PROGRESS.md`: a checklist of all phases with status (Not started / In progress / Awaiting approval / Approved), date, and notes on decisions or deviations. Update it at the end of every phase.

### 2.4 Git and commands
- Do **not** run `git commit`, `git push`, or any destructive command (`rm -rf`, `DROP`, `TRUNCATE`, database resets) unless I explicitly ask.
- You may run install, lint, typecheck, build, and dev-server commands.
- When a database migration must be applied, write the SQL file and tell me exactly how to run it. Do not run it against my database unless I ask.

### 2.5 Secrets and security
- **Never read, print, log, or commit** `.env*` files or key values. Ask me for the *names* and *where to find* each key. I will fill in the values.
- Create and maintain `.env.example` with placeholder values only.
- The Supabase **service-role key must never** be used in client code, committed, or prefixed with `NEXT_PUBLIC_`. Prefer not to use it at all: the user-scoped client plus RLS handles everything here.
- Row Level Security must be enabled on every table. Do not disable RLS "to make it work."

### 2.6 Verify against current docs
APIs for Next.js, Clerk, Supabase, shadcn/ui, and dnd-kit change often. Before using any of them, check the **official current documentation** for the installed version instead of relying on memory. If you cannot access the docs, say so and ask me.

---

## 3. Tech decisions

Confirm these in Phase 0. If I object to one, use my choice.

| Area | Decision |
|---|---|
| Framework | Next.js App Router + TypeScript (strict). Inspect the repo first and follow its existing structure (`src/` or not, `@/*` alias). |
| Styling | Tailwind CSS (already installed) with design tokens defined in `globals.css` (Section 4.3) |
| UI primitives | shadcn/ui (Radix) for Dialog, Popover, DropdownMenu, Calendar, Input, Button, Badge, Tooltip, Sheet, Skeleton, plus `sonner` for toasts. Restyle every component to match the design tokens. Do not leave default shadcn styling visible. |
| Icons | `lucide-react` (thin line icons, matching the reference) |
| Font | Inter via `next/font/google` (closest match to the reference) |
| Drag and drop | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| Ordering | Fractional indexing (`fractional-indexing`) with a `text` position column |
| Dates | `date-fns` |
| Forms and validation | `react-hook-form` + `zod` (shared schemas used by client and server) |
| Auth | Clerk (`@clerk/nextjs`) |
| Backend | Supabase Postgres with RLS, using Clerk as a **third-party auth provider** (the current native integration, **not** the deprecated JWT-template method) |
| Data access | Server Components fetch data; **Server Actions** perform mutations; the client keeps optimistic state for drag and drop |
| Theme | Light only (the reference is light). Do not build dark mode. |

---

## 4. Design system: match the reference image exactly

### 4.1 The reference
- Reference image path: **`docs/design/reference-kanban.png`**. If this file does not exist, **stop and ask me for it**.
- It is a "Swift" CRM *Deals* kanban screen. We are **re-skinning its layout and design language for a task board**. Everything about spacing, radii, colors, typography, borders, shadows, density, and component anatomy must match. Only the *content* changes (deals become tasks, and so on).
- Ignore the macOS browser chrome (traffic lights, URL bar). It is part of the mockup, not the app.
- Open and study the image before each UI phase. After building, compare your result to it side by side at a **1440px-wide viewport** and list any differences in the Phase Report. **Where the image and the numbers below disagree, the image wins.** The token values are estimates from a screenshot: sample colors from the image and refine them in Phase 1.

### 4.2 Layout anatomy (desktop, 1440px viewport)

```
┌──────┬────────────┬──────────────────────────────────────────────────────┐
│ Rail │  Sidebar   │  Main panel (white, rounded, bordered)               │
│ 64px │  ~264px    │  ┌ Header: icon + title ....... [search][share] ──┐  │
│      │            │  ├ Toolbar: [Search input] ......... [Settings][Add New ▾]
│      │            │  ├ Sub-toolbar: [active filter chips] ... [Filter]│  │
│      │            │  └ Board: horizontally scrolling kanban columns ──┘  │
└──────┴────────────┴──────────────────────────────────────────────────────┘
```

1. **App shell:** light-gray canvas background. The rail and sidebar sit directly on the canvas. The main panel is a white, rounded (~16px), 1px-bordered panel with a small gap from the canvas edges.
2. **Rail (~64px):** vertical strip of rounded-square tiles (~40px). The active tile has a soft highlighted background. A "+" button sits below a gap. In the reference these are app icons; in our app they are **board tiles** (colored rounded squares with the board's initial or icon, the 5 most recently opened boards) and "+" creates a new board. The Clerk `UserButton` sits at the bottom.
3. **Sidebar (~264px):**
   - Header: app logo tile + app name + subtitle, with a collapse button (`«`) on the right.
   - **Board switcher card** (replaces the "Mesh / Product Team" card): bordered, rounded, white. It shows the current board's tile, name, and a Private/Public label, with a chevron that opens a board-switcher popover. Under it is a row of three small stat chips with icons: **columns count, tasks count, overdue count** (replacing the 24 / 83 / 12 stats).
   - Nav list: icon + label rows. The **active item is a white bordered rounded card with a blue icon**, plus a thin blue indicator on the far left edge, exactly as "Deals" appears. Items: **All Boards**, **Explore** (public boards).
   - Collapsible section **"Boards"** (chevron toggle, `...` and `+` actions on the right), listing the user's boards with small colored icons, in the same style as "Favorites" and "Projects."
4. **Header (~64px tall, inside the main panel):** left: board icon + board title (semibold) + a small Private/Public badge. Right: square, bordered, rounded icon buttons (**Search** focuses the toolbar search, **Share**). No notification bell.
5. **Toolbar row:** left: search input with a leading magnifier icon ("Search tasks", ~220px wide, bordered, rounded). Right: outlined **Settings** button (board settings) and the primary blue **Add New** split button with a dropdown chevron (menu: New task, New column).
6. **Sub-toolbar row:** left: active filter chips (removable) and a "Clear all" link. Right: outlined **Filter** button with a funnel icon (opens the filter popover).
7. **Board area:** columns in a horizontally scrolling row (16px gap), preceded and followed by comfortable padding. A trailing dashed **"+ Add column"** ghost column has the same width as a real column. At a 1440px viewport, **four columns must be visible** next to the sidebars, as in the reference (columns are ~260px wide).

### 4.3 Design tokens (starting values, refine from the image)

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#F4F5F7` | App shell background, behind the panels |
| `--surface` | `#FFFFFF` | Main panel, cards, inputs, popovers |
| `--column-bg` | `#F6F7F9` | Column container background |
| `--border` | `#EAECF0` | Default 1px borders and dividers |
| `--border-strong` | `#D0D5DD` | Input and button borders, hover |
| `--text` | `#101828` | Primary text |
| `--text-muted` | `#667085` | Secondary text, meta, placeholders |
| `--text-subtle` | `#98A2B3` | Icons, disabled |
| `--primary` | `#1570EF` | Primary button, active nav icon, focus ring |
| `--primary-hover` | `#175CD3` | Primary hover |
| `--primary-soft` | `#EFF8FF` | Soft-blue tinted backgrounds |
| Column colors | gray `#667085`, blue `#2E90FA`, orange `#F97316`, green `#12B76A`, red `#F04438`, purple `#7A5AF8`, pink `#EE46BC`, teal `#15B79E` | Column pill backgrounds (white text), board tiles, label colors |
| Priority | Low `#2E90FA`, Medium `#F5B400`, High `#F04438` | Priority icon tile |
| Overdue / due-soon | `#F04438` / `#F79009` | Due date text |

- **Radii:** buttons and inputs 8px; label and column pills 6px; cards 12px; columns and panels 16px.
- **Shadows:** card at rest `0 1px 2px rgba(16,24,40,.05)`; card hover `0 4px 12px rgba(16,24,40,.08)`; dragging `0 12px 24px rgba(16,24,40,.16)`.
- **Type scale:** 12px meta, 13px secondary, 14px body and card title (weight 500), 16px page title (weight 600). Weights used: 400, 500, 600 only.
- **Density:** the reference is airy but compact. Card padding 14px, gap between cards 12px, column padding 12px, column gap 16px, toolbar buttons ~36px tall.
- **Icons:** 16px, 1.5px stroke, in `--text-subtle` or `--text-muted`.

### 4.4 Component specs

**Column**
- Container: `--column-bg`, 16px radius, 12px padding, fixed width, full height with internal vertical scroll for cards.
- Header (left to right): **drag grip** (6-dot handle, visible, muted) → **colored name pill** (solid column color, white text, 6px radius, 12-13px, weight 500) → **task count** in muted text → spacer → **`...` menu button** → **`+` add-task button**.
- `...` menu: Rename, Change color, Delete column.
- Under the header, cards stack with a 12px gap. Tapping `+` opens an inline composer (see Section 5.3).

**Task card** (mirror the reference card anatomy exactly)
1. **Row 1:** a 20px leading icon tile tinted with the task's first label color (neutral gray if none) + **task title** (14px, weight 500, single line, truncates) + `...` menu on the right (Edit, Delete).
2. **Row 2:** description, one line, 13px, `--text-muted`, truncated. Omit the row if empty.
3. **Row 3:** meta line with a calendar icon + due date formatted `Feb 25, 2025` (13px muted; red if overdue, amber if due within 48 hours). Omit the row if there is no due date.
4. **Divider:** 1px `--border`.
5. **Footer:** a 28px rounded **priority tile** (bordered, white, with a 3-bar chart icon colored by priority; this is the small bar-chart tile from the reference) + **label pills** (bordered, 6px radius, 12px text, e.g. "Landing Page"). Show at most 2 pills, then a `+N` pill.
- Card: white, 1px `--border`, 12px radius, 14px padding.
- Hover: stronger shadow. Dragging: lifted shadow, slight scale (1.02), original slot shows a faded placeholder. Drop target column gets a subtle `--primary-soft` tint.

**Buttons:** outlined (white, 1px `--border-strong`, 8px radius, icon + label, 36px tall), primary (blue, white text, with a chevron split for Add New). **Inputs:** white, 1px border, 8px radius, blue 2px focus ring.

**Filter popover, task dialog, board settings, board switcher:** use the same surface, border, radius, and type styles. Dialogs are centered with a light overlay.

### 4.5 What the reference has that we deliberately do NOT build
The reference contains controls that have no matching feature in this project. **Do not build them** (no disabled placeholders either): *Ask AI*, *Imports / Export*, the *List / Timeline* view switcher, *Sort*, *Group*, the notification bell, the Dashboard / Notes / Inbox / Reports / Workflows nav items, and the Favorites section. In Phase 0, ask me whether I want any of these added. The default is **no**.

### 4.6 Responsive behavior and states
- **≥1280px:** full layout above.
- **768 to 1279px:** sidebar collapses to the rail only (the `«` button toggles it as an overlay).
- **<768px:** rail and sidebar become a slide-over Sheet from a menu button. Columns are ~85vw wide with horizontal snap scrolling. Toolbar buttons collapse to icon-only.
- Every data view needs **loading** (skeletons that match card and column shapes), **empty** (friendly, with a call to action), and **error** (message with retry) states.

---

## 5. Feature specifications

### 5.1 Boards
- Fields: title (required, max 80), description (optional), color (from the palette, used for the rail and sidebar tile), visibility (`private` default, or `public`).
- Create (dialog), rename, change color, change visibility, and delete (confirmation dialog stating how many columns and tasks will be lost). Only the owner can modify or delete.
- `/boards` is the grid of **my boards**. `/explore` is the grid of **public boards**. `/boards/[boardId]` is the board.
- New boards start with **no columns** and show an empty state with a "Create your first column" action.

### 5.2 Columns
- Fields: title (required, max 40), color (default gray).
- Add (via Add New menu, the trailing ghost column, or the header `+`), rename (inline or dialog), recolor, delete (confirmation showing the task count; deletes its tasks), reorder by dragging the grip.

### 5.3 Tasks
- Fields: title (required, max 120), description (optional, max 2000, plain text), priority (`low` | `medium` | `high`, default `medium`), labels (0 to many from the board's labels), due date (optional, date only).
- **Quick add:** a column `+` opens an inline composer at the top of that column (title input; Enter adds, Esc cancels, and the input stays open for rapid entry).
- **Edit:** clicking a card opens a centered dialog with all fields. Changes save with an explicit Save button; unsaved changes warn on close.
- **Delete:** from the card menu or the dialog, with a confirmation or an undo toast.
- All mutations are optimistic with rollback and an error toast on failure.

### 5.4 Labels
- Labels belong to a board: name (required, max 24) + color from the palette. Unique name per board.
- Manage them (create, rename, recolor, delete) in Board Settings and inline from the task dialog's label picker. Deleting a label removes it from all tasks.

### 5.5 Due dates
- Date picker (Calendar in a Popover) with a "Clear" action. Display as `Feb 25, 2025`.
- States: overdue (red), due within 48 hours (amber), otherwise muted.
- **Parse `yyyy-MM-dd` as a local date**, never with `new Date("2025-02-25")` (that shifts a day in some time zones).

### 5.6 Drag and drop
- Move tasks within a column, across columns (including into empty columns), and reorder columns by the grip.
- Smooth `DragOverlay`, pointer and touch sensors with a small activation distance (so clicks still open cards), and **keyboard sensor** support with announcements.
- Positions use fractional indexing. On drop, update the UI instantly, persist via Server Action, and **roll back with a toast if it fails**.
- Disabled for non-owners, and while search or filters are active (show a small hint explaining why).

### 5.7 Search
- Text input in the toolbar (debounced ~200ms), case-insensitive match on task **title and description**.
- Non-matching tasks are hidden; columns remain visible with their counts reflecting visible tasks. Show "No tasks match your search" when nothing matches. `Ctrl/Cmd + K` focuses the input.

### 5.8 Filtering
- Filter popover with: **Priority** (multi-select), **Labels** (multi-select), **Due date** (Overdue, Today, This week, No due date).
- Categories combine with **AND**; values inside a category with **OR**.
- Active filters appear as removable chips in the sub-toolbar with "Clear all". The Filter button shows a count badge.
- Search and filters live in **URL search params** (`?q=&priority=high,low&labels=id1,id2&due=overdue`) so views are shareable and survive refresh.

### 5.9 Private and public boards
- **Private:** only the owner can see or open it. Others get a 404 (do not reveal that it exists).
- **Public:** anyone with the link, signed in or not, can **view** it read-only (no drag, edit, create, or delete controls). Only the owner can edit.
- Header **Share** button (owner only): visibility toggle + "Copy link" (shown when public). Public boards appear on `/explore`.
- Non-owners see a "View only" badge instead of Settings and Add New. Signed-out visitors see a "Sign in to create your own board" prompt.
- Do not display owner names or avatars on public boards unless I approve it.

---

## 6. Data model and security

### 6.1 Auth integration
- Use the **current Clerk-Supabase native third-party auth integration**: connect Clerk in the Supabase dashboard (Authentication, Third-Party Auth) and enable the Supabase integration in the Clerk dashboard. Follow the **latest official guides** and walk me through the dashboard steps (I do them, you write the code).
- Server client: `createClient(url, publicKey, { accessToken: async () => (await auth()).getToken() })`. Browser client (only if needed): the same with `useSession().session?.getToken()`.
- Anonymous visitors use the same client without a token (they are the `anon` role) and can only read public boards.
- **Clerk user IDs are strings like `user_2abc...`, not UUIDs. Every user-id column is `text`.** Identify the user in SQL with `(select auth.jwt()->>'sub')`.

### 6.2 Tables (write as SQL migrations in `supabase/migrations/`)

| Table | Columns |
|---|---|
| `boards` | `id uuid pk default gen_random_uuid()`, `owner_id text not null default (select auth.jwt()->>'sub')`, `title text not null`, `description text`, `color text not null default 'blue'`, `visibility text not null default 'private' check (visibility in ('private','public'))`, `created_at`, `updated_at` |
| `columns` | `id uuid pk`, `board_id uuid not null references boards on delete cascade`, `title text not null`, `color text not null default 'gray'`, `position text not null collate "C"`, `created_at`, `updated_at` |
| `tasks` | `id uuid pk`, `board_id uuid not null references boards on delete cascade`, `column_id uuid not null references columns on delete cascade`, `title text not null`, `description text`, `priority text not null default 'medium' check (priority in ('low','medium','high'))`, `due_date date`, `position text not null collate "C"`, `created_by text`, `created_at`, `updated_at` |
| `labels` | `id uuid pk`, `board_id uuid not null references boards on delete cascade`, `name text not null`, `color text not null`, `unique (board_id, name)` |
| `task_labels` | `task_id uuid references tasks on delete cascade`, `label_id uuid references labels on delete cascade`, `primary key (task_id, label_id)` |

- Add indexes on every foreign key, and on `(column_id, position)` and `(board_id, position)`.
- Add an `updated_at` trigger.
- `position` **must** use `collate "C"`, otherwise Postgres sorts fractional-index keys incorrectly.
- Add check constraints for the max lengths in Section 5.

### 6.3 Row Level Security (enabled on all tables, no exceptions)
- **boards:** `SELECT` if `visibility = 'public'` **or** `owner_id = (select auth.jwt()->>'sub')` (roles `anon`, `authenticated`). `INSERT`, `UPDATE`, `DELETE` only where `owner_id` matches the JWT subject (`authenticated`).
- **columns, tasks, labels, task_labels:** `SELECT` if the parent board is visible to the caller (`EXISTS` on `boards`). `INSERT`, `UPDATE`, `DELETE` only if the caller owns the parent board (`EXISTS` on `boards` with `owner_id` match).
- Wrap `auth.jwt()` calls in `(select ...)` for performance.
- **Test RLS in Phase 3 with two different users:** user B must not read user A's private board, must read A's public board, and must not write to either.

---

## 7. Architecture and code conventions

- **Structure (adapt to the repo's existing layout):** `app/(auth)/sign-in/[[...sign-in]]`, `app/(auth)/sign-up/[[...sign-up]]`, `app/(app)/boards`, `app/(app)/boards/[boardId]`, `app/(app)/explore`, `components/ui` (shadcn), `components/layout` (rail, sidebar, header, toolbar), `components/board` (column, task-card, dialogs, filters), `lib/supabase`, `lib/validation` (zod), `lib/ordering`, `actions/` (Server Actions), `types/`.
- **Server vs client:** default to Server Components. Add `"use client"` only for interactive pieces (drag and drop, popovers, forms).
- **Server Actions:** validate every input with zod, check the user is signed in, return a typed result `{ ok: true, data } | { ok: false, error }`, never throw raw database errors to the client, and call `revalidatePath` where needed.
- **Types:** TypeScript strict, **no `any`**. Generate or maintain Supabase database types.
- **Route protection** (Clerk middleware file: `middleware.ts` or `proxy.ts` depending on the Next.js version; follow the current Clerk quickstart): `/boards` and mutations require sign-in. `/`, `/sign-in`, `/sign-up`, `/explore`, and `/boards/[boardId]` must be reachable when signed out, with the board page returning 404 for private boards.
- **Next.js 15+:** `params` and `searchParams` are Promises (`await` them), and `auth()` is async.
- **Accessibility:** semantic HTML, labeled controls, visible focus rings, `aria-live` for toasts and drag announcements, all actions reachable by keyboard, and no color-only meaning (priority and due state also use icon or text).
- **Performance:** avoid waterfalls in data fetching; load a board's columns, tasks, and labels in one round trip where possible. Memoize draggable items. Avoid unnecessary re-renders during drag.
- Keep components small, named clearly, and free of dead code. Comments only where the *why* is not obvious.

---

## 8. Phases

Every phase ends with the Phase Report (Section 9) and a **STOP**.

### Phase 0: Discovery and plan (no feature code)
- Inspect the repo: Next.js version, structure, package manager, installed packages, scripts. Open `docs/design/reference-kanban.png` and describe back what you see.
- Verify current docs for Clerk + Next.js, Clerk + Supabase, shadcn/ui, and dnd-kit.
- Create `docs/PROGRESS.md`.
- **Ask me:** (1) app name and logo preference (default: a placeholder name in one constant); (2) confirmation of the Section 3 decisions; (3) whether I want any of the Section 4.5 omitted items; (4) whether my Clerk and Supabase projects exist and where to find keys; (5) anything unclear in this file.
- **Done when:** I approve your written plan.

### Phase 1: Foundation and design system
- Install and configure the dependencies from Section 3. Initialize shadcn/ui and restyle the primitives you will need.
- Set up the Inter font, the design tokens in `globals.css`, the folder structure, `.env.example`, and shared utilities (`cn`, date helpers, ordering helpers).
- Build a temporary `/design-preview` page showing buttons, inputs, badges, pills, a sample column, and a sample card, so I can check the design language against the reference.
- **Done when:** lint, typecheck, and build pass, and the preview visibly matches the reference style. Remove or keep `/design-preview` as I decide.

### Phase 2: Authentication (Clerk)
- Wire up the provider, middleware or proxy, and sign-in and sign-up pages styled to the design tokens. Add `UserButton`. Apply the route protection rules in Section 7.
- Ask me for the Clerk keys (names only) and walk me through the dashboard setup.
- **Done when:** I can sign up, sign in, sign out; protected routes redirect; public routes load signed out.

### Phase 3: Supabase backend and security
- Walk me through connecting Clerk to Supabase. Write the migrations and RLS from Section 6, the typed server client, and an authenticated test read and write.
- Give me the SQL to run and the RLS test plan (two-user test from Section 6.3).
- **Done when:** the schema is applied, a signed-in user can insert and read their own row, and the RLS tests pass.

### Phase 4: App shell and static kanban (mock data)
- Build the rail, sidebar, header, toolbar, sub-toolbar, columns, and task cards with **hard-coded mock data**, matching the reference closely at 1440px, plus the responsive behavior from Section 4.6.
- **Done when:** a side-by-side comparison with the reference shows a faithful match. This is the key visual approval gate; expect feedback.

### Phase 5: Boards
- Wire real data: create, list, rename, recolor, change visibility, and delete boards. Populate the rail, the sidebar "Boards" section, the board switcher, `/boards`, and the empty states.
- **Done when:** all board operations work and persist, and only the owner can modify.

### Phase 6: Columns
- Create, rename, recolor, and delete columns, with confirmations and loading and error states. Position them with fractional indexing. (Reordering by drag comes in Phase 9.)
- **Done when:** column operations persist after refresh.

### Phase 7: Tasks, priorities, and due dates
- Quick add, the task dialog (create and edit), delete with undo or confirm, priority selection and the priority tile, the due date picker, and due-date states. Use optimistic updates with rollback.
- **Done when:** tasks fully work, and cards match the reference anatomy.

### Phase 8: Labels
- Board-level label management, the label picker in the task dialog, and label pills on cards (with the `+N` overflow).
- **Done when:** labels can be created, assigned, edited, and deleted, and cards render them correctly.

### Phase 9: Drag and drop
- Task reordering within and across columns, and column reordering by grip. Overlay, sensors (pointer, touch, keyboard), optimistic updates, rollback on failure, and disabled states.
- **Done when:** all drag interactions are smooth, persist after refresh, and work by keyboard.

### Phase 10: Search and filtering
- Search, the filter popover, filter chips, URL param syncing, empty "no matches" states, and the `Ctrl/Cmd + K` shortcut.
- **Done when:** search and filters work alone and combined, survive refresh, and are shareable by URL.

### Phase 11: Public/private boards and sharing
- Visibility toggle, the Share popover with Copy link, `/explore`, read-only mode for non-owners and signed-out visitors, and 404 for private boards. Re-run the two-user RLS tests including the signed-out case.
- **Done when:** the Section 5.9 behavior is verified with an owner, another user, and a signed-out visitor.

### Phase 12: Polish, QA, and handoff
- Loading, empty, and error states everywhere; responsive pass at 1440, 1024, 768, and 390px; accessibility pass (keyboard, focus, labels, contrast); performance pass; a final design comparison against the reference with any remaining differences listed.
- Security review: RLS on every table, no secrets in the client bundle, input validation on every action.
- Write `README.md` (setup, env vars, scripts, how to run the migrations, project structure).
- **Done when:** lint, typecheck, and build pass; the Section 11 checklist is complete; I approve.

---

## 9. Phase Report (post this at the end of every phase, then STOP)

```
## Phase N complete: <name>

**What I built:** (short bullets)
**Files added or changed:** (list)
**How to verify:** (exact steps and URLs for me to try)
**Checks run:** lint / typecheck / build: pass or fail (with output if failing)
**Design comparison:** (UI phases) differences from the reference, if any
**Decisions and deviations:** (anything I should know about)
**Needs from you:** (keys, dashboard steps, SQL to run, questions)

Reply "Approved" to proceed to Phase N+1, or tell me what to change.
```

---

## 10. Known gotchas (read before coding)

1. Clerk user IDs are **text**, not UUIDs. Using `uuid` columns for them will break RLS and inserts.
2. Fractional-index `position` columns need `collate "C"` or ordering is wrong.
3. dnd-kit hydration warnings: give `DndContext` a stable `id`. Keep sortable item IDs equal to database IDs.
4. Next.js 15+: `await params`, `await searchParams`, `await auth()`.
5. Parse date-only strings as **local dates**.
6. RLS policies that call `auth.jwt()` should use `(select auth.jwt()->>'sub')`.
7. Never expose the service-role key. Never read or print `.env*` files.
8. After a failed optimistic mutation, restore the exact previous state, not a refetch that could flicker.
9. Disable drag handlers on read-only boards entirely, not just visually.
10. Cards must remain clickable despite drag sensors: use an activation distance (~5px).

---

## 11. Final checklist (Phase 12)

- [ ] All 14 features in Section 1 work end to end
- [ ] Layout and styling match the reference at 1440px (four columns visible, same density, radii, colors, type)
- [ ] Private boards return 404 to others; public boards are strictly read-only to non-owners
- [ ] RLS enabled and tested on every table
- [ ] No secrets in the repo or client bundle; `.env.example` is current
- [ ] Optimistic updates roll back correctly on failure
- [ ] Keyboard-only use works for creating, editing, and moving tasks
- [ ] Loading, empty, and error states exist on every data view
- [ ] Lint, typecheck, and production build pass with no warnings
- [ ] `README.md` and `docs/PROGRESS.md` are complete and accurate