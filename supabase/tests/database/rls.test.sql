begin;

select plan(36);

create temporary table rls_test_ids (
  private_board_id uuid not null,
  public_board_id uuid not null,
  private_column_id uuid not null,
  public_column_id uuid not null,
  private_task_id uuid not null,
  public_task_id uuid not null,
  insert_board_id uuid not null,
  insert_column_id uuid not null,
  insert_task_id uuid not null,
  insert_label_id uuid not null,
  private_label_id uuid not null,
  public_label_id uuid not null,
  public_label_candidate_id uuid not null
) on commit drop;

insert into pg_temp.rls_test_ids values (
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
  gen_random_uuid()
);

grant select on pg_temp.rls_test_ids to anon, authenticated;

insert into public.boards (id, owner_id, title, color, visibility)
select private_board_id, 'rls-owner-a', 'RLS private fixture', 'blue', 'private'
from pg_temp.rls_test_ids;

insert into public.boards (id, owner_id, title, color, visibility)
select public_board_id, 'rls-owner-a', 'RLS public fixture', 'green', 'public'
from pg_temp.rls_test_ids;

insert into public.columns (id, board_id, title, color, position)
select private_column_id, private_board_id, 'Private fixture column', 'blue', 'a0'
from pg_temp.rls_test_ids;

insert into public.columns (id, board_id, title, color, position)
select public_column_id, public_board_id, 'Public fixture column', 'green', 'a0'
from pg_temp.rls_test_ids;

insert into public.tasks (id, board_id, column_id, title, position)
select private_task_id, private_board_id, private_column_id, 'Private fixture task', 'a0'
from pg_temp.rls_test_ids;

insert into public.tasks (id, board_id, column_id, title, position)
select public_task_id, public_board_id, public_column_id, 'Public fixture task', 'a0'
from pg_temp.rls_test_ids;

insert into public.labels (id, board_id, name, color)
select private_label_id, private_board_id, 'Private fixture label', 'blue'
from pg_temp.rls_test_ids;

insert into public.labels (id, board_id, name, color)
select public_label_id, public_board_id, 'Public fixture label', 'green'
from pg_temp.rls_test_ids;

insert into public.labels (id, board_id, name, color)
select public_label_candidate_id, public_board_id, 'Public candidate label', 'purple'
from pg_temp.rls_test_ids;

insert into public.task_labels (task_id, label_id)
select private_task_id, private_label_id from pg_temp.rls_test_ids;

insert into public.task_labels (task_id, label_id)
select public_task_id, public_label_id from pg_temp.rls_test_ids;

select ok(
  (select relrowsecurity from pg_class where oid = 'public.boards'::regclass),
  'RLS is enabled on boards'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.columns'::regclass),
  'RLS is enabled on columns'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.tasks'::regclass),
  'RLS is enabled on tasks'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.labels'::regclass),
  'RLS is enabled on labels'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.task_labels'::regclass),
  'RLS is enabled on task_labels'
);

select ok(
  (
    select bool_and(
      has_table_privilege('anon', format('public.%I', table_name), 'SELECT')
      and not has_table_privilege('anon', format('public.%I', table_name), 'INSERT')
      and not has_table_privilege('anon', format('public.%I', table_name), 'UPDATE')
      and not has_table_privilege('anon', format('public.%I', table_name), 'DELETE')
    )
    from unnest(array['boards', 'columns', 'tasks', 'labels', 'task_labels']) as table_name
  ),
  'anon has read grants only on all application tables'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*) from public.boards), 1::bigint, 'anon sees only the public board');
select is((select count(*) from public.columns), 1::bigint, 'anon sees only the public board column');
select is((select count(*) from public.tasks), 1::bigint, 'anon sees only the public board task');
select is((select count(*) from public.labels), 2::bigint, 'anon sees labels from the public board only');
select is((select count(*) from public.task_labels), 1::bigint, 'anon sees only the public task label');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"rls-owner-a"}', true);

select is((select count(*) from public.boards), 2::bigint, 'owner A sees both of their boards');
select is((select count(*) from public.columns), 2::bigint, 'owner A sees both board columns');
select is((select count(*) from public.tasks), 2::bigint, 'owner A sees both board tasks');
select is((select count(*) from public.labels), 3::bigint, 'owner A sees labels from both boards');
select is((select count(*) from public.task_labels), 2::bigint, 'owner A sees both task label links');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"rls-user-b"}', true);

select is((select count(*) from public.boards), 1::bigint, 'user B sees the public board but not the private board');
select is((select count(*) from public.columns), 1::bigint, 'user B sees only the public board column');
select is((select count(*) from public.tasks), 1::bigint, 'user B sees only the public board task');
select is((select count(*) from public.labels), 2::bigint, 'user B sees only public board labels');
select is((select count(*) from public.task_labels), 1::bigint, 'user B sees only the public task label');

select throws_ok(
  $$insert into public.boards (id, owner_id, title, color, visibility)
    select insert_board_id, 'rls-owner-a', 'Spoofed board', 'blue', 'private'
    from pg_temp.rls_test_ids$$,
  '42501',
  'User B cannot insert a board owned by User A'
);
select throws_ok(
  $$insert into public.columns (id, board_id, title, color, position)
    select insert_column_id, public_board_id, 'Unauthorized column', 'gray', 'z0'
    from pg_temp.rls_test_ids$$,
  '42501',
  'User B cannot insert a column into User A public board'
);
select throws_ok(
  $$insert into public.tasks (id, board_id, column_id, title, position)
    select insert_task_id, public_board_id, public_column_id, 'Unauthorized task', 'z0'
    from pg_temp.rls_test_ids$$,
  '42501',
  'User B cannot insert a task into User A public board'
);
select throws_ok(
  $$insert into public.labels (id, board_id, name, color)
    select insert_label_id, public_board_id, 'Unauthorized label', 'red'
    from pg_temp.rls_test_ids$$,
  '42501',
  'User B cannot insert a label into User A public board'
);
select throws_ok(
  $$insert into public.task_labels (task_id, label_id)
    select public_task_id, public_label_candidate_id
    from pg_temp.rls_test_ids$$,
  '42501',
  'User B cannot assign labels on User A public board'
);

with changed as (
  update public.boards set title = title
  where id in (
    (select private_board_id from pg_temp.rls_test_ids),
    (select public_board_id from pg_temp.rls_test_ids)
  ) returning 1
)
select is((select count(*) from changed), 0::bigint, 'User B cannot update either User A board');

with changed as (
  update public.columns set title = title
  where board_id in (
    (select private_board_id from pg_temp.rls_test_ids),
    (select public_board_id from pg_temp.rls_test_ids)
  ) returning 1
)
select is((select count(*) from changed), 0::bigint, 'User B cannot update User A columns');

with changed as (
  update public.tasks set title = title
  where board_id in (
    (select private_board_id from pg_temp.rls_test_ids),
    (select public_board_id from pg_temp.rls_test_ids)
  ) returning 1
)
select is((select count(*) from changed), 0::bigint, 'User B cannot update User A tasks');

with changed as (
  update public.labels set name = name
  where board_id in (
    (select private_board_id from pg_temp.rls_test_ids),
    (select public_board_id from pg_temp.rls_test_ids)
  ) returning 1
)
select is((select count(*) from changed), 0::bigint, 'User B cannot update User A labels');

with changed as (
  update public.task_labels set label_id = label_id
  where task_id in (
    (select private_task_id from pg_temp.rls_test_ids),
    (select public_task_id from pg_temp.rls_test_ids)
  ) returning 1
)
select is((select count(*) from changed), 0::bigint, 'User B cannot update User A task label links');

with removed as (
  delete from public.boards
  where id in (
    (select private_board_id from pg_temp.rls_test_ids),
    (select public_board_id from pg_temp.rls_test_ids)
  ) returning 1
)
select is((select count(*) from removed), 0::bigint, 'User B cannot delete either User A board');

with removed as (
  delete from public.columns
  where board_id in (
    (select private_board_id from pg_temp.rls_test_ids),
    (select public_board_id from pg_temp.rls_test_ids)
  ) returning 1
)
select is((select count(*) from removed), 0::bigint, 'User B cannot delete User A columns');

with removed as (
  delete from public.tasks
  where board_id in (
    (select private_board_id from pg_temp.rls_test_ids),
    (select public_board_id from pg_temp.rls_test_ids)
  ) returning 1
)
select is((select count(*) from removed), 0::bigint, 'User B cannot delete User A tasks');

with removed as (
  delete from public.labels
  where board_id in (
    (select private_board_id from pg_temp.rls_test_ids),
    (select public_board_id from pg_temp.rls_test_ids)
  ) returning 1
)
select is((select count(*) from removed), 0::bigint, 'User B cannot delete User A labels');

with removed as (
  delete from public.task_labels
  where task_id in (
    (select private_task_id from pg_temp.rls_test_ids),
    (select public_task_id from pg_temp.rls_test_ids)
  ) returning 1
)
select is((select count(*) from removed), 0::bigint, 'User B cannot delete User A task label links');

reset role;
select * from finish();
rollback;
