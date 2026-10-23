"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { positionAtEnd } from "@/lib/ordering";
import { taskDeleteSchema, taskInputSchema, taskUpdateSchema } from "@/lib/validation/tasks";
import type { TaskRow } from "@/types/database";

export type TaskActionResult =
  | { ok: true; data: TaskRow }
  | { ok: false; error: string };

export type DeleteTaskResult =
  | { ok: true }
  | { ok: false; error: string };

function refreshTaskViews(boardId: string) {
  revalidatePath("/boards");
  revalidatePath(`/boards/${boardId}`);
}

async function canEditBoard(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, boardId: string, userId: string) {
  const { data, error } = await supabase
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", userId)
    .maybeSingle();
  return !error && Boolean(data);
}

export async function createTask(input: unknown): Promise<TaskActionResult> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the task details." };

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to create a task." };

  try {
    const supabase = await createSupabaseServerClient();
    if (!(await canEditBoard(supabase, parsed.data.boardId, userId))) {
      return { ok: false, error: "This board could not be found or you do not have access." };
    }

    const { data: column, error: columnError } = await supabase
      .from("columns")
      .select("id")
      .eq("id", parsed.data.columnId)
      .eq("board_id", parsed.data.boardId)
      .maybeSingle();
    if (columnError || !column) return { ok: false, error: "Choose a column on this board." };

    const { data: lastTask, error: orderError } = await supabase
      .from("tasks")
      .select("position")
      .eq("column_id", parsed.data.columnId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (orderError) return { ok: false, error: "The task order could not be loaded. Try again." };

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        board_id: parsed.data.boardId,
        column_id: parsed.data.columnId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        priority: parsed.data.priority,
        due_date: parsed.data.dueDate || null,
        position: positionAtEnd(lastTask?.position ?? null),
        created_by: userId,
      })
      .select("id, board_id, column_id, title, description, priority, due_date, position, created_by, created_at, updated_at")
      .single();

    if (error || !data || data.created_by !== userId) return { ok: false, error: "The task could not be created. Try again." };
    refreshTaskViews(parsed.data.boardId);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "The task could not be created. Check your connection and try again." };
  }
}

export async function updateTask(input: unknown): Promise<TaskActionResult> {
  const parsed = taskUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the task details." };

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to edit this task." };

  try {
    const supabase = await createSupabaseServerClient();
    if (!(await canEditBoard(supabase, parsed.data.boardId, userId))) {
      return { ok: false, error: "This board could not be found or you do not have access." };
    }

    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: parsed.data.title,
        description: parsed.data.description || null,
        priority: parsed.data.priority,
        due_date: parsed.data.dueDate || null,
      })
      .eq("id", parsed.data.taskId)
      .eq("board_id", parsed.data.boardId)
      .select("id, board_id, column_id, title, description, priority, due_date, position, created_by, created_at, updated_at")
      .maybeSingle();

    if (error || !data) return { ok: false, error: "The task could not be updated. Check access and try again." };
    refreshTaskViews(parsed.data.boardId);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "The task could not be updated. Check your connection and try again." };
  }
}

export async function deleteTask(input: unknown): Promise<DeleteTaskResult> {
  const parsed = taskDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The task details are invalid." };

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to delete this task." };

  try {
    const supabase = await createSupabaseServerClient();
    if (!(await canEditBoard(supabase, parsed.data.boardId, userId))) {
      return { ok: false, error: "This board could not be found or you do not have access." };
    }

    const { data, error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", parsed.data.taskId)
      .eq("board_id", parsed.data.boardId)
      .select("id")
      .maybeSingle();

    if (error || !data) return { ok: false, error: "The task could not be deleted. Check access and try again." };
    refreshTaskViews(parsed.data.boardId);
    return { ok: true };
  } catch {
    return { ok: false, error: "The task could not be deleted. Check your connection and try again." };
  }
}
