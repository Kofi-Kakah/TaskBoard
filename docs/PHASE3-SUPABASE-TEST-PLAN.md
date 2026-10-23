# Phase 3: Supabase setup and RLS checks

## Configure Clerk and Supabase

1. In Clerk Dashboard, open **Integrations → Supabase**, activate the Supabase integration, and note the Clerk domain shown there.
2. In Supabase Dashboard, open **Authentication → Sign In / Providers → Add provider → Clerk** (some dashboard versions group this under Third-Party Auth). Enter the Clerk domain and save.
3. In Supabase **Project Settings → Data API**, copy the project URL. In **Project Settings → API Keys**, copy the publishable key. Put them in the existing local `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never use a secret/service-role key in this app.

## Apply the schema

Open the Supabase **SQL Editor**, paste the complete contents of `supabase/migrations/20261023120000_taskboard_schema.sql`, and run it once. The migration enables RLS on all five tables, applies least-privilege table grants, and creates owner/public policies.

## Authenticated insert and read check

1. Run `npm run dev` and sign in as User A.
2. Open `http://localhost:3000/supabase-check`.
3. Confirm the read check succeeds. Select **Run authenticated write check**; it inserts a temporary private board, reads it back under the same Clerk token, and removes that row through the owner delete policy.

## Two-user RLS test

For an isolated fixture, use the Supabase SQL Editor after the migration. Replace `REPLACE_WITH_USER_A_CLERK_ID` with User A's Clerk ID (the `user_...` value in Clerk Dashboard → Users), then run:

```sql
do $$
declare
  owner_id text := 'REPLACE_WITH_USER_A_CLERK_ID';
  private_board_id uuid := gen_random_uuid();
  public_board_id uuid := gen_random_uuid();
  private_column_id uuid := gen_random_uuid();
  public_column_id uuid := gen_random_uuid();
  private_task_id uuid := gen_random_uuid();
  public_task_id uuid := gen_random_uuid();
  private_label_id uuid := gen_random_uuid();
  public_label_id uuid := gen_random_uuid();
begin
  insert into public.boards (id, owner_id, title, color, visibility) values
    (private_board_id, owner_id, 'Phase 3 private RLS fixture', 'blue', 'private'),
    (public_board_id, owner_id, 'Phase 3 public RLS fixture', 'green', 'public');

  insert into public.columns (id, board_id, title, color, position) values
    (private_column_id, private_board_id, 'Private fixture column', 'blue', 'a0'),
    (public_column_id, public_board_id, 'Public fixture column', 'green', 'a0');

  insert into public.tasks (id, board_id, column_id, title, position) values
    (private_task_id, private_board_id, private_column_id, 'Private fixture task', 'a0'),
    (public_task_id, public_board_id, public_column_id, 'Public fixture task', 'a0');

  insert into public.labels (id, board_id, name, color) values
    (private_label_id, private_board_id, 'Private fixture label', 'blue'),
    (public_label_id, public_board_id, 'Public fixture label', 'green');

  insert into public.task_labels (task_id, label_id) values
    (private_task_id, private_label_id),
    (public_task_id, public_label_id);
end $$;
```

1. As User A, reload `/supabase-check`. Both fixture boards and their child rows should be visible. The page displays board IDs. The owner-only update check should say the write was allowed.
2. Sign out and sign in as User B. The private fixture board and its rows must be absent. The public fixture board and its column, task, label, and task-label rows must remain visible.
3. On User B's page, run **Check owner-only update** on the public fixture. It must report that RLS denied the write. Copy the private fixture's board ID from User A's page and try it in **Check a board by ID** as User B; this must also be denied.
4. Sign out and confirm `/supabase-check` redirects to sign-in.

## Phase 11 public board verification

### Execution note — 2026-10-23

- Anonymous `GET /explore` returned HTTP 200 and rendered the empty state (`No public boards yet`). No public board fixture was available, so public-board visibility, read-only controls, and the signed-out board prompt could not be exercised.
- No browser session was exposed to this workspace, so the User A/User B and interactive signed-out checks were not run.
- Requests to dynamic board routes returned HTTP 200 at the initial response because the app uses Next.js partial prerendering; this smoke request does not establish the final streamed 404 outcome. Verify the private-board result in a browser as listed below.

Use the public and private fixture boards above. The board IDs are visible on User A's `/supabase-check` page.

1. While signed in as User B, open the public fixture at `/boards/<public-board-id>`. The board, columns, tasks, and labels should load. The header should show **View only**; board settings, task/column menus, add controls, and drag handles should be absent.
2. As User B, open `/boards/<private-board-id>`. The route should return a 404 without identifying the board.
3. Open `/explore` as User B and confirm the public fixture appears without owner information.
4. Sign out. Open the public board link and `/explore`; both should load read-only. Open the private board link; it should return a 404. The public board page should prompt the visitor to sign in to create a board.
5. The existing User B owner-only update check on the public fixture must still report that RLS denied the write. This policy check is independent of the hidden UI controls.

The fixture rows are intentionally retained so both accounts can inspect them. The board management phase will add normal UI for removing them.
