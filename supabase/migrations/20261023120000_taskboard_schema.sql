create table public.boards (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null default (auth.jwt() ->> 'sub'),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  description text,
  color text not null default 'blue',
  visibility text not null default 'private'
    check (visibility in ('private', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 40),
  color text not null default 'gray',
  position text collate "C" not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, board_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  column_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  due_date date,
  position text collate "C" not null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (column_id, board_id)
    references public.columns (id, board_id) on delete cascade
);

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 24),
  color text not null,
  unique (board_id, name)
);

create table public.task_labels (
  task_id uuid not null references public.tasks (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  primary key (task_id, label_id)
);

create index boards_owner_id_idx on public.boards (owner_id);
create index columns_board_id_position_idx on public.columns (board_id, position);
create index tasks_column_id_position_idx on public.tasks (column_id, position);
create index tasks_column_board_id_idx on public.tasks (column_id, board_id);
create index tasks_board_id_position_idx on public.tasks (board_id, position);
create index labels_board_id_idx on public.labels (board_id);
create index task_labels_label_id_idx on public.task_labels (label_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger boards_set_updated_at
before update on public.boards
for each row execute function public.set_updated_at();

create trigger columns_set_updated_at
before update on public.columns
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.tasks enable row level security;
alter table public.labels enable row level security;
alter table public.task_labels enable row level security;

revoke all on table public.boards, public.columns, public.tasks,
  public.labels, public.task_labels from public, anon, authenticated;

grant select on table public.boards, public.columns, public.tasks,
  public.labels, public.task_labels to anon, authenticated;
grant insert, update, delete on table public.boards, public.columns,
  public.tasks, public.labels, public.task_labels to authenticated;

create policy boards_select_visible
on public.boards for select to anon, authenticated
using (
  visibility = 'public'
  or owner_id = (select auth.jwt() ->> 'sub')
);

create policy boards_insert_owner
on public.boards for insert to authenticated
with check (owner_id = (select auth.jwt() ->> 'sub'));

create policy boards_update_owner
on public.boards for update to authenticated
using (owner_id = (select auth.jwt() ->> 'sub'))
with check (owner_id = (select auth.jwt() ->> 'sub'));

create policy boards_delete_owner
on public.boards for delete to authenticated
using (owner_id = (select auth.jwt() ->> 'sub'));

create policy columns_select_visible
on public.columns for select to anon, authenticated
using (
  exists (
    select 1 from public.boards b
    where b.id = columns.board_id
  )
);

create policy columns_insert_owner
on public.columns for insert to authenticated
with check (
  exists (
    select 1 from public.boards b
    where b.id = columns.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);

create policy columns_update_owner
on public.columns for update to authenticated
using (
  exists (
    select 1 from public.boards b
    where b.id = columns.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
)
with check (
  exists (
    select 1 from public.boards b
    where b.id = columns.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);

create policy columns_delete_owner
on public.columns for delete to authenticated
using (
  exists (
    select 1 from public.boards b
    where b.id = columns.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);

create policy tasks_select_visible
on public.tasks for select to anon, authenticated
using (
  exists (
    select 1 from public.boards b
    where b.id = tasks.board_id
  )
);

create policy tasks_insert_owner
on public.tasks for insert to authenticated
with check (
  exists (
    select 1 from public.boards b
    where b.id = tasks.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);

create policy tasks_update_owner
on public.tasks for update to authenticated
using (
  exists (
    select 1 from public.boards b
    where b.id = tasks.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
)
with check (
  exists (
    select 1 from public.boards b
    where b.id = tasks.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);

create policy tasks_delete_owner
on public.tasks for delete to authenticated
using (
  exists (
    select 1 from public.boards b
    where b.id = tasks.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);

create policy labels_select_visible
on public.labels for select to anon, authenticated
using (
  exists (
    select 1 from public.boards b
    where b.id = labels.board_id
  )
);

create policy labels_insert_owner
on public.labels for insert to authenticated
with check (
  exists (
    select 1 from public.boards b
    where b.id = labels.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);

create policy labels_update_owner
on public.labels for update to authenticated
using (
  exists (
    select 1 from public.boards b
    where b.id = labels.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
)
with check (
  exists (
    select 1 from public.boards b
    where b.id = labels.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);

create policy labels_delete_owner
on public.labels for delete to authenticated
using (
  exists (
    select 1 from public.boards b
    where b.id = labels.board_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);

create policy task_labels_select_visible
on public.task_labels for select to anon, authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.boards b on b.id = t.board_id
    join public.labels l on l.board_id = t.board_id and l.id = task_labels.label_id
    where t.id = task_labels.task_id
  )
);

create policy task_labels_insert_owner
on public.task_labels for insert to authenticated
with check (
  exists (
    select 1
    from public.tasks t
    join public.boards b on b.id = t.board_id
    join public.labels l on l.board_id = t.board_id and l.id = task_labels.label_id
    where t.id = task_labels.task_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);

create policy task_labels_update_owner
on public.task_labels for update to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.boards b on b.id = t.board_id
    join public.labels l on l.board_id = t.board_id and l.id = task_labels.label_id
    where t.id = task_labels.task_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    join public.boards b on b.id = t.board_id
    join public.labels l on l.board_id = t.board_id and l.id = task_labels.label_id
    where t.id = task_labels.task_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);

create policy task_labels_delete_owner
on public.task_labels for delete to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.boards b on b.id = t.board_id
    join public.labels l on l.board_id = t.board_id and l.id = task_labels.label_id
    where t.id = task_labels.task_id
      and b.owner_id = (select auth.jwt() ->> 'sub')
  )
);
