"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { positionAtEnd } from "@/lib/ordering";
import { taskDeleteSchema, taskInputSchema, taskUpdateSchema } from "@/lib/validation/tasks";
import type { LabelRow, TaskWithLabels } from "@/types/database";

export type TaskActionResult =
  | { ok: true; data: TaskWithLabels }
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

type TaskLabelSync = { ok: true; labels: LabelRow[]; previousIds: string[] } | { ok: false };

async function syncTaskLabels(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  boardId: string,
  taskId: string,
  requestedIds: string[],
): Promise<TaskLabelSync> {
  const desiredIds = [...new Set(requestedIds)];
  const { data: labels, error: labelsError } = desiredIds.length
    ? await supabase.from("labels").select("id, board_id, name, color").eq("board_id", boardId).in("id", desiredIds)
    : { data: [], error: null };
  if (labelsError || !labels || labels.length !== desiredIds.length) return { ok: false };

  const { data: existing, error: existingError } = await supabase.from("task_labels").select("label_id").eq("task_id", taskId);
  if (existingError || !existing) return { ok: false };
  const previousIds = existing.map((row) => row.label_id);
  const addIds = desiredIds.filter((id) => !previousIds.includes(id));
  const removeIds = previousIds.filter((id) => !desiredIds.includes(id));

  if (addIds.length) {
    const { error } = await supabase.from("task_labels").insert(addIds.map((labelId) => ({ task_id: taskId, label_id: labelId })));
    if (error) return { ok: false };
  }
  if (removeIds.length) {
    const { error } = await supabase.from("task_labels").delete().eq("task_id", taskId).in("label_id", removeIds);
    if (error) {
      if (addIds.length) await supabase.from("task_labels").delete().eq("task_id", taskId).in("label_id", addIds);
      return { ok: false };
    }
  }
  return { ok: true, labels, previousIds };
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
    const labelSync = await syncTaskLabels(supabase, parsed.data.boardId, data.id, parsed.data.labelIds);
    if (!labelSync.ok) {
      await supabase.from("tasks").delete().eq("id", data.id).eq("board_id", parsed.data.boardId);
      return { ok: false, error: "One or more labels are invalid, so the task was not created." };
    }
    refreshTaskViews(parsed.data.boardId);
    return { ok: true, data: { ...data, labels: labelSync.labels } };
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

    const { data: task, error: taskError } = await supabase.from("tasks").select("id").eq("id", parsed.data.taskId).eq("board_id", parsed.data.boardId).maybeSingle();
    if (taskError || !task) return { ok: false, error: "The task could not be found on this board." };
    const labelSync = await syncTaskLabels(supabase, parsed.data.boardId, parsed.data.taskId, parsed.data.labelIds);
    if (!labelSync.ok) return { ok: false, error: "One or more labels are invalid. Refresh and try again." };

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

    if (error || !data) {
      await syncTaskLabels(supabase, parsed.data.boardId, parsed.data.taskId, labelSync.previousIds);
      return { ok: false, error: "The task could not be updated. Check access and try again." };
    }
    refreshTaskViews(parsed.data.boardId);
    return { ok: true, data: { ...data, labels: labelSync.labels } };
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
