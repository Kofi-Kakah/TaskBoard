"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { labelDeleteSchema, labelInputSchema, labelUpdateSchema } from "@/lib/validation/labels";
import type { LabelRow } from "@/types/database";

export type LabelActionResult = { ok: true; data: LabelRow } | { ok: false; error: string };
export type LabelDeleteResult = { ok: true } | { ok: false; error: string };

async function ownsBoard(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, boardId: string, userId: string) {
  const { data, error } = await supabase.from("boards").select("id").eq("id", boardId).eq("owner_id", userId).maybeSingle();
  return !error && Boolean(data);
}

function refreshBoard(boardId: string) {
  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/boards");
}

export async function createLabel(input: unknown): Promise<LabelActionResult> {
  const parsed = labelInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the label details." };
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to manage board labels." };

  try {
    const supabase = await createSupabaseServerClient();
    if (!(await ownsBoard(supabase, parsed.data.boardId, userId))) return { ok: false, error: "This board could not be found or you do not have access." };
    const { data, error } = await supabase.from("labels").insert({ board_id: parsed.data.boardId, name: parsed.data.name, color: parsed.data.color }).select("id, board_id, name, color").single();
    if (error || !data) return { ok: false, error: error?.code === "23505" ? "A label with this name already exists on the board." : "The label could not be created. Try again." };
    refreshBoard(parsed.data.boardId);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "The label could not be created. Check your connection and try again." };
  }
}

export async function updateLabel(input: unknown): Promise<LabelActionResult> {
  const parsed = labelUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the label details." };
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to manage board labels." };

  try {
    const supabase = await createSupabaseServerClient();
    if (!(await ownsBoard(supabase, parsed.data.boardId, userId))) return { ok: false, error: "This board could not be found or you do not have access." };
    const { data, error } = await supabase.from("labels").update({ name: parsed.data.name, color: parsed.data.color }).eq("id", parsed.data.labelId).eq("board_id", parsed.data.boardId).select("id, board_id, name, color").maybeSingle();
    if (error || !data) return { ok: false, error: error?.code === "23505" ? "A label with this name already exists on the board." : "The label could not be updated. Try again." };
    refreshBoard(parsed.data.boardId);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "The label could not be updated. Check your connection and try again." };
  }
}

export async function deleteLabel(input: unknown): Promise<LabelDeleteResult> {
  const parsed = labelDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The label details are invalid." };
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in to manage board labels." };

  try {
    const supabase = await createSupabaseServerClient();
    if (!(await ownsBoard(supabase, parsed.data.boardId, userId))) return { ok: false, error: "This board could not be found or you do not have access." };
    const { data, error } = await supabase.from("labels").delete().eq("id", parsed.data.labelId).eq("board_id", parsed.data.boardId).select("id").maybeSingle();
    if (error || !data) return { ok: false, error: "The label could not be deleted. Try again." };
    refreshBoard(parsed.data.boardId);
    return { ok: true };
  } catch {
    return { ok: false, error: "The label could not be deleted. Check your connection and try again." };
  }
}
