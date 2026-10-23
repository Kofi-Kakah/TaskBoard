import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LabelRow } from "@/types/database";

export type LabelListResult = { ok: true; data: LabelRow[] } | { ok: false; error: string };

export async function getBoardLabels(boardId: string): Promise<LabelListResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("labels").select("id, board_id, name, color").eq("board_id", boardId).order("name", { ascending: true });
    if (error || !data) return { ok: false, error: "Board labels could not be loaded. Try again." };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Board labels could not be loaded. Check your connection and try again." };
  }
}
