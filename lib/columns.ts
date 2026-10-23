import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ColumnRow } from "@/types/database";

export type ColumnSummary = ColumnRow & { taskCount: number };

export type ColumnListResult =
  | { ok: true; data: ColumnSummary[] }
  | { ok: false; error: string };

export async function getBoardColumns(boardId: string): Promise<ColumnListResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: columns, error: columnsError } = await supabase
      .from("columns")
      .select("id, board_id, title, color, position, created_at, updated_at")
      .eq("board_id", boardId)
      .order("position", { ascending: true });

    if (columnsError || !columns) return { ok: false, error: "Columns could not be loaded. Try again." };
    if (!columns.length) return { ok: true, data: [] };

    const columnIds = columns.map((column) => column.id);
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("column_id")
      .in("column_id", columnIds);

    if (tasksError || !tasks) return { ok: false, error: "Column task counts could not be loaded. Try again." };

    const taskCounts = new Map<string, number>();
    for (const task of tasks) taskCounts.set(task.column_id, (taskCounts.get(task.column_id) ?? 0) + 1);

    return {
      ok: true,
      data: columns.map((column) => ({ ...column, taskCount: taskCounts.get(column.id) ?? 0 })),
    };
  } catch {
    return { ok: false, error: "Columns could not be loaded. Check your connection and try again." };
  }
}
