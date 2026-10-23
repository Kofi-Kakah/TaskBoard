"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { positionBetween } from "@/lib/ordering";

const id = z.string().uuid();
const neighbors = z.object({ previousId: id.nullable(), nextId: id.nullable() });
const moveTaskSchema = z.object({ boardId: id, taskId: id, columnId: id, ...neighbors.shape });
const moveColumnSchema = z.object({ boardId: id, columnId: id, ...neighbors.shape });
export type OrderResult = { ok: true } | { ok: false; error: string };

async function canEdit(boardId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("boards").select("id").eq("id", boardId).eq("owner_id", userId).maybeSingle();
  return data ? supabase : null;
}

function refresh(boardId: string) {
  revalidatePath("/boards");
  revalidatePath(`/boards/${boardId}`);
}

export async function moveTask(input: unknown): Promise<OrderResult> {
  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The task order is invalid." };
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to move tasks." };
  try {
    const supabase = await canEdit(parsed.data.boardId, userId);
    if (!supabase) return { ok: false, error: "This board could not be found or you do not have access." };
    const { data: task } = await supabase.from("tasks").select("id, column_id").eq("id", parsed.data.taskId).eq("board_id", parsed.data.boardId).maybeSingle();
    const { data: target } = await supabase.from("columns").select("id").eq("id", parsed.data.columnId).eq("board_id", parsed.data.boardId).maybeSingle();
    if (!task || !target) return { ok: false, error: "The task or destination column no longer exists." };
    const { data: rows, error } = await supabase.from("tasks").select("id, position").eq("column_id", parsed.data.columnId).order("position");
    if (error || !rows) return { ok: false, error: "The task order could not be loaded." };
    const ordered = rows.filter((row) => row.id !== task.id);
    const index = parsed.data.previousId === null ? 0 : ordered.findIndex((row) => row.id === parsed.data.previousId) + 1;
    const previous = index > 0 ? ordered[index - 1] : null;
    const next = ordered[index] ?? null;
    if ((previous?.id ?? null) !== parsed.data.previousId || (next?.id ?? null) !== parsed.data.nextId)
      return { ok: false, error: "The board changed while the task was moving. Try again." };
    const position = positionBetween(previous?.position ?? null, next?.position ?? null);
    const { error: updateError } = await supabase.from("tasks").update({ column_id: target.id, position }).eq("id", task.id).eq("board_id", parsed.data.boardId);
    if (updateError) return { ok: false, error: "The task could not be moved. Try again." };
    refresh(parsed.data.boardId);
    return { ok: true };
  } catch {
    return { ok: false, error: "The task could not be moved. Check your connection and try again." };
  }
}

export async function moveColumn(input: unknown): Promise<OrderResult> {
  const parsed = moveColumnSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The column order is invalid." };
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to reorder columns." };
  try {
    const supabase = await canEdit(parsed.data.boardId, userId);
    if (!supabase) return { ok: false, error: "This board could not be found or you do not have access." };
    const { data: rows, error } = await supabase.from("columns").select("id, position").eq("board_id", parsed.data.boardId).order("position");
    if (error || !rows) return { ok: false, error: "The column order could not be loaded." };
    const ordered = rows.filter((row) => row.id !== parsed.data.columnId);
    const index = parsed.data.previousId === null ? 0 : ordered.findIndex((row) => row.id === parsed.data.previousId) + 1;
    const previous = index > 0 ? ordered[index - 1] : null;
    const next = ordered[index] ?? null;
    if (!rows.some((row) => row.id === parsed.data.columnId) || (previous?.id ?? null) !== parsed.data.previousId || (next?.id ?? null) !== parsed.data.nextId)
      return { ok: false, error: "The board changed while columns were moving. Try again." };
    const { error: updateError } = await supabase.from("columns").update({ position: positionBetween(previous?.position ?? null, next?.position ?? null) }).eq("id", parsed.data.columnId).eq("board_id", parsed.data.boardId);
    if (updateError) return { ok: false, error: "The column could not be moved. Try again." };
    refresh(parsed.data.boardId);
    return { ok: true };
  } catch {
    return { ok: false, error: "The column could not be moved. Check your connection and try again." };
  }
}
