"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { positionAtEnd } from "@/lib/ordering";
import { boardColorSchema, boardIdSchema } from "@/lib/validation/boards";
import type { ColumnRow } from "@/types/database";

export type ColumnActionResult =
  | { ok: true; data: ColumnRow }
  | { ok: false; error: string };

export type DeleteColumnResult =
  | { ok: true }
  | { ok: false; error: string };

const createColumnSchema = z.object({
  boardId: boardIdSchema,
  title: z.string().trim().min(1, "Enter a column name.").max(40, "Column names can be up to 40 characters."),
  color: boardColorSchema,
});

const updateColumnSchema = z.object({
  boardId: boardIdSchema,
  columnId: boardIdSchema,
  title: z.string().trim().min(1, "Enter a column name.").max(40, "Column names can be up to 40 characters.").optional(),
  color: boardColorSchema.optional(),
}).refine((value) => value.title !== undefined || value.color !== undefined, "Choose a column name or color to update.");

const deleteColumnSchema = z.object({ boardId: boardIdSchema, columnId: boardIdSchema });

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function verifyBoardOwner(supabase: SupabaseServerClient, boardId: string, userId: string) {
  const { data, error } = await supabase
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", userId)
    .maybeSingle();
  return !error && Boolean(data);
}

function refreshColumnViews(boardId: string) {
  revalidatePath("/boards");
  revalidatePath(`/boards/${boardId}`);
}

export async function createColumn(input: unknown): Promise<ColumnActionResult> {
  const parsed = createColumnSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the column details." };

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to add a column." };

  try {
    const supabase = await createSupabaseServerClient();
    const canEdit = await verifyBoardOwner(supabase, parsed.data.boardId, userId);
    if (!canEdit) return { ok: false, error: "This board could not be found or you do not have access." };

    const { data: lastColumn, error: orderError } = await supabase
      .from("columns")
      .select("position")
      .eq("board_id", parsed.data.boardId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) return { ok: false, error: "The column order could not be loaded. Try again." };

    const { data, error } = await supabase
      .from("columns")
      .insert({
        board_id: parsed.data.boardId,
        title: parsed.data.title,
        color: parsed.data.color,
        position: positionAtEnd(lastColumn?.position ?? null),
      })
      .select("id, board_id, title, color, position, created_at, updated_at")
      .single();

    if (error || !data) return { ok: false, error: "The column could not be created. Try again." };
    refreshColumnViews(parsed.data.boardId);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "The column could not be created. Check your connection and try again." };
  }
}

export async function updateColumn(input: unknown): Promise<ColumnActionResult> {
  const parsed = updateColumnSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the column details." };

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to edit this column." };

  try {
    const supabase = await createSupabaseServerClient();
    const canEdit = await verifyBoardOwner(supabase, parsed.data.boardId, userId);
    if (!canEdit) return { ok: false, error: "This board could not be found or you do not have access." };

    const updates: { title?: string; color?: string } = {};
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.color !== undefined) updates.color = parsed.data.color;

    const { data, error } = await supabase
      .from("columns")
      .update(updates)
      .eq("id", parsed.data.columnId)
      .eq("board_id", parsed.data.boardId)
      .select("id, board_id, title, color, position, created_at, updated_at")
      .maybeSingle();

    if (error || !data) return { ok: false, error: "The column could not be updated. Check access and try again." };
    refreshColumnViews(parsed.data.boardId);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "The column could not be updated. Check your connection and try again." };
  }
}

export async function deleteColumn(input: unknown): Promise<DeleteColumnResult> {
  const parsed = deleteColumnSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The column details are invalid." };

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to delete this column." };

  try {
    const supabase = await createSupabaseServerClient();
    const canEdit = await verifyBoardOwner(supabase, parsed.data.boardId, userId);
    if (!canEdit) return { ok: false, error: "This board could not be found or you do not have access." };

    const { data, error } = await supabase
      .from("columns")
      .delete()
      .eq("id", parsed.data.columnId)
      .eq("board_id", parsed.data.boardId)
      .select("id")
      .maybeSingle();

    if (error || !data) return { ok: false, error: "The column could not be deleted. Check access and try again." };
    refreshColumnViews(parsed.data.boardId);
    return { ok: true };
  } catch {
    return { ok: false, error: "The column could not be deleted. Check your connection and try again." };
  }
}
