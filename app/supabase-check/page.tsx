import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseCheckForm } from "./supabase-check-form";
import { RlsBoardWriteCheckForm } from "./rls-board-write-check-form";

export default async function SupabaseCheckPage() {
  await auth.protect();

  const supabase = await createSupabaseServerClient();
  const { data: boards, error } = await supabase
    .from("boards")
    .select("id, title, visibility")
    .order("created_at", { ascending: false })
    .limit(20);

  const boardIds = (boards ?? []).map((board) => board.id);
  const [columnsResult, tasksResult, labelsResult] = boardIds.length
    ? await Promise.all([
        supabase.from("columns").select("id").in("board_id", boardIds),
        supabase.from("tasks").select("id").in("board_id", boardIds),
        supabase.from("labels").select("id").in("board_id", boardIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  const taskIds = (tasksResult.data ?? []).map((task) => task.id);
  const taskLabelsResult = taskIds.length
    ? await supabase.from("task_labels").select("task_id").in("task_id", taskIds)
    : { data: [], error: null };
  const childReadFailed =
    columnsResult.error || tasksResult.error || labelsResult.error || taskLabelsResult.error;

  return (
    <main className="protected-placeholder">
      <h1>Supabase connection check</h1>
      <p>This temporary page checks your Clerk token, Supabase access, and row policies.</p>

      <section aria-labelledby="read-check-title">
        <h2 id="read-check-title">Read check</h2>
        {error || childReadFailed ? (
          <p role="status">Could not read boards. Confirm the migration and Clerk integration are configured.</p>
        ) : (
          <>
            <p role="status">
              Board and child-table reads succeeded under RLS: {boards.length} board(s),{" "}
              {columnsResult.data?.length ?? 0} column(s), {tasksResult.data?.length ?? 0} task(s),{" "}
              {labelsResult.data?.length ?? 0} label(s), and {taskLabelsResult.data?.length ?? 0} task label(s).
            </p>
            <ul>
              {boards.map((board) => (
                <li key={board.id}>
                  <strong>{board.title}</strong> ({board.visibility}) — {board.id}
                  <RlsBoardWriteCheckForm boardId={board.id} title={board.title} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="write-check-title">
        <h2 id="write-check-title">Write check</h2>
        <SupabaseCheckForm />
        <h3>Check a board by ID</h3>
        <p>Use this to confirm that a second user cannot update another owner’s private or public board.</p>
        <RlsBoardWriteCheckForm editable />
      </section>
    </main>
  );
}
