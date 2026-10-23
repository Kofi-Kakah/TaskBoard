"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { boardIdSchema, boardInputSchema, type BoardInput } from "@/lib/validation/boards";
import type { BoardRow } from "@/types/database";

export type BoardActionResult =
  | { ok: true; data: BoardRow }
  | { ok: false; error: string };

export type DeleteBoardResult =
  | { ok: true }
  | { ok: false; error: string };

const boardUpdateSchema = boardInputSchema.extend({ id: boardIdSchema });
const deleteBoardSchema = z.object({ id: boardIdSchema });

function revalidateBoardPaths(boardId?: string) {
  revalidatePath("/");
  revalidatePath("/boards");
  if (boardId) revalidatePath(`/boards/${boardId}`);
}

export async function createBoard(input: unknown): Promise<BoardActionResult> {
  const parsed = boardInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the board details." };

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to create a board." };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("boards")
      .insert(toBoardInsert(parsed.data))
      .select("id, owner_id, title, description, color, visibility, created_at, updated_at")
      .single();

    if (error || !data || data.owner_id !== userId) return { ok: false, error: "The board could not be created. Try again." };
    revalidateBoardPaths(data.id);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "The board could not be created. Check your connection and try again." };
  }
}

export async function updateBoard(input: unknown): Promise<BoardActionResult> {
  const parsed = boardUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the board details." };

  const { id, ...boardInput } = parsed.data;
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to edit this board." };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("boards")
      .update(toBoardUpdate(boardInput))
      .eq("id", id)
      .eq("owner_id", userId)
      .select("id, owner_id, title, description, color, visibility, created_at, updated_at")
      .maybeSingle();

    if (error || !data || data.owner_id !== userId) return { ok: false, error: "The board could not be updated. Check access and try again." };
    revalidateBoardPaths(id);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "The board could not be updated. Check your connection and try again." };
  }
}

export async function deleteBoard(input: unknown): Promise<DeleteBoardResult> {
  const parsed = deleteBoardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The board id is invalid." };

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to delete this board." };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("boards")
      .delete()
      .eq("id", parsed.data.id)
      .eq("owner_id", userId)
      .select("id")
      .maybeSingle();

    if (error || !data) return { ok: false, error: "The board could not be deleted. Check access and try again." };
    revalidateBoardPaths(parsed.data.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "The board could not be deleted. Check your connection and try again." };
  }
}

function toBoardInsert(input: BoardInput) {
  return {
    title: input.title,
    description: input.description || null,
    color: input.color,
    visibility: input.visibility,
  };
}

function toBoardUpdate(input: BoardInput) {
  return toBoardInsert(input);
}
