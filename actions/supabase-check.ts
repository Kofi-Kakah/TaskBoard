"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SupabaseCheckState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

const checkInputSchema = z.object({
  title: z.string().trim().min(1).max(80),
});

const boardUpdateInputSchema = z.object({
  boardId: z.string().uuid(),
  title: z.string().trim().min(1).max(80),
});

export type BoardWriteCheckState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

export async function runSupabaseCheck(
  _previousState: SupabaseCheckState,
  formData: FormData,
): Promise<SupabaseCheckState> {
  const input = checkInputSchema.safeParse({
    title: formData.get("title"),
  });

  if (!input.success) {
    return { ok: false, error: "The connection check could not be started." };
  }

  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Sign in before running the connection check." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: inserted, error: insertError } = await supabase
      .from("boards")
      .insert({ title: input.data.title })
      .select("id, owner_id, title")
      .single();

    if (insertError || !inserted || inserted.owner_id !== userId) {
      return { ok: false, error: "Supabase rejected the authenticated write." };
    }

    const { data: readBack, error: readError } = await supabase
      .from("boards")
      .select("id, owner_id, title")
      .eq("id", inserted.id)
      .single();

    const { error: cleanupError } = await supabase
      .from("boards")
      .delete()
      .eq("id", inserted.id);

    if (readError || !readBack || readBack.owner_id !== userId) {
      return { ok: false, error: "The row was written but could not be read back." };
    }

    if (cleanupError) {
      return {
        ok: false,
        error: "The read/write check passed, but its temporary row could not be removed.",
      };
    }

    return { ok: true, message: "Authenticated insert, read, and cleanup all passed." };
  } catch {
    return { ok: false, error: "Supabase is not configured or could not be reached." };
  }
}

export async function checkBoardWritePolicy(
  _previousState: BoardWriteCheckState,
  formData: FormData,
): Promise<BoardWriteCheckState> {
  const input = boardUpdateInputSchema.safeParse({
    boardId: formData.get("boardId"),
    title: formData.get("title"),
  });

  if (!input.success) {
    return { ok: false, error: "The board write check has invalid input." };
  }

  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Sign in before checking a board policy." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("boards")
      .update({ title: input.data.title })
      .eq("id", input.data.boardId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, error: "Supabase could not complete the board write check." };
    }

    revalidatePath("/supabase-check");
    return data
      ? { ok: true, message: "Write allowed for this owner." }
      : { ok: false, error: "Write denied by RLS (expected for a non-owner)." };
  } catch {
    return { ok: false, error: "Supabase could not be reached for the board write check." };
  }
}
