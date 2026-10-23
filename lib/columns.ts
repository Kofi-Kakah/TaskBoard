import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ColumnRow, TaskRow } from "@/types/database";

export type ColumnSummary = ColumnRow & { taskCount: number; tasks: TaskRow[] };

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
      .select("id, board_id, column_id, title, description, priority, due_date, position, created_by, created_at, updated_at")
      .in("column_id", columnIds)
      .order("position", { ascending: true });

    if (tasksError || !tasks) return { ok: false, error: "Column task counts could not be loaded. Try again." };

    const tasksByColumn = new Map<string, TaskRow[]>();
    for (const task of tasks) {
      const columnTasks = tasksByColumn.get(task.column_id) ?? [];
      columnTasks.push(task);
      tasksByColumn.set(task.column_id, columnTasks);
    }

    return {
      ok: true,
      data: columns.map((column) => {
        const columnTasks = tasksByColumn.get(column.id) ?? [];
        return { ...column, tasks: columnTasks, taskCount: columnTasks.length };
      }),
    };
  } catch {
    return { ok: false, error: "Columns could not be loaded. Check your connection and try again." };
  }
}
