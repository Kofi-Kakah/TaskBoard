import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDueDateStatus } from "@/lib/dates";
import type { BoardRow } from "@/types/database";

export type BoardSummary = BoardRow & {
  columnCount: number;
  taskCount: number;
  overdueCount: number;
};
export type BoardDisplaySummary = Omit<BoardSummary, "owner_id">;

export type BoardListResult =
  | { ok: true; data: BoardSummary[] }
  | { ok: false; error: string };

export type BoardResult =
  | { ok: true; data: BoardSummary }
  | { ok: false; error: string };

export type PublicBoardSummary = Omit<BoardSummary, "owner_id">;
export type PublicBoardListResult =
  | { ok: true; data: PublicBoardSummary[] }
  | { ok: false; error: string };
export type VisibleBoardResult =
  | { ok: true; data: { board: BoardDisplaySummary; canEdit: boolean } }
  | { ok: false; error: string };

function countByBoardId(rows: Array<{ board_id: string }>) {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.board_id, (counts.get(row.board_id) ?? 0) + 1);
  return counts;
}

export async function getOwnedBoards(userId: string): Promise<BoardListResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: boards, error: boardsError } = await supabase
      .from("boards")
      .select("id, owner_id, title, description, color, visibility, created_at, updated_at")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    if (boardsError || !boards) return { ok: false, error: "Your boards could not be loaded. Try again." };
    if (boards.length === 0) return { ok: true, data: [] };

    const boardIds = boards.map((board) => board.id);
    const [columnsResult, tasksResult] = await Promise.all([
      supabase.from("columns").select("board_id").in("board_id", boardIds),
      supabase.from("tasks").select("board_id, due_date").in("board_id", boardIds),
    ]);

    if (columnsResult.error || !columnsResult.data || tasksResult.error || !tasksResult.data) {
      return { ok: false, error: "Board details could not be loaded. Try again." };
    }

    const columnCounts = countByBoardId(columnsResult.data);
    const taskCounts = countByBoardId(tasksResult.data);
    const overdueCounts = new Map<string, number>();
    for (const task of tasksResult.data) {
      if (task.due_date && getDueDateStatus(task.due_date) === "overdue") {
        overdueCounts.set(task.board_id, (overdueCounts.get(task.board_id) ?? 0) + 1);
      }
    }
    return {
      ok: true,
      data: boards.map((board) => ({
        ...board,
        columnCount: columnCounts.get(board.id) ?? 0,
        taskCount: taskCounts.get(board.id) ?? 0,
        overdueCount: overdueCounts.get(board.id) ?? 0,
      })),
    };
  } catch {
    return { ok: false, error: "Your boards could not be loaded. Check your connection and try again." };
  }
}

export async function getOwnedBoard(userId: string, boardId: string): Promise<BoardResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: board, error: boardError } = await supabase
      .from("boards")
      .select("id, owner_id, title, description, color, visibility, created_at, updated_at")
      .eq("id", boardId)
      .eq("owner_id", userId)
      .maybeSingle();

    if (boardError) return { ok: false, error: "This board could not be loaded. Try again." };
    if (!board) return { ok: false, error: "not-found" };

    const [columnsResult, tasksResult] = await Promise.all([
      supabase.from("columns").select("board_id").eq("board_id", boardId),
      supabase.from("tasks").select("board_id, due_date").eq("board_id", boardId),
    ]);

    if (columnsResult.error || !columnsResult.data || tasksResult.error || !tasksResult.data) {
      return { ok: false, error: "Board details could not be loaded. Try again." };
    }

    return {
      ok: true,
      data: {
        ...board,
        columnCount: columnsResult.data.length,
        taskCount: tasksResult.data.length,
        overdueCount: tasksResult.data.filter((task) => task.due_date && getDueDateStatus(task.due_date) === "overdue").length,
      },
    };
  } catch {
    return { ok: false, error: "This board could not be loaded. Check your connection and try again." };
  }
}

export async function getVisibleBoard(userId: string | null, boardId: string): Promise<VisibleBoardResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: board, error } = await supabase
      .from("boards")
      .select("id, owner_id, title, description, color, visibility, created_at, updated_at")
      .eq("id", boardId)
      .maybeSingle();

    // RLS hides private boards from non-owners, so absence is deliberately indistinguishable from a missing id.
    if (error) return { ok: false, error: "This board could not be loaded. Try again." };
    if (!board || (board.visibility !== "public" && board.owner_id !== userId)) return { ok: false, error: "not-found" };

    const [columnsResult, tasksResult] = await Promise.all([
      supabase.from("columns").select("id").eq("board_id", boardId),
      supabase.from("tasks").select("board_id, due_date").eq("board_id", boardId),
    ]);
    if (columnsResult.error || !columnsResult.data || tasksResult.error || !tasksResult.data) {
      return { ok: false, error: "Board details could not be loaded. Try again." };
    }
    const canEdit = userId !== null && board.owner_id === userId;
    const displayBoard = {
      id: board.id,
      title: board.title,
      description: board.description,
      color: board.color,
      visibility: board.visibility,
      created_at: board.created_at,
      updated_at: board.updated_at,
    };
    return {
      ok: true,
      data: { board: { ...displayBoard, columnCount: columnsResult.data.length, taskCount: tasksResult.data.length, overdueCount: tasksResult.data.filter((task) => task.due_date && getDueDateStatus(task.due_date) === "overdue").length }, canEdit },
    };
  } catch {
    return { ok: false, error: "This board could not be loaded. Check your connection and try again." };
  }
}

export async function getPublicBoards(): Promise<PublicBoardListResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: boards, error } = await supabase
      .from("boards")
      .select("id, owner_id, title, description, color, visibility, created_at, updated_at")
      .eq("visibility", "public")
      .order("updated_at", { ascending: false });
    if (error || !boards) return { ok: false, error: "Public boards could not be loaded. Try again." };
    if (!boards.length) return { ok: true, data: [] };

    const boardIds = boards.map((board) => board.id);
    const [columnsResult, tasksResult] = await Promise.all([
      supabase.from("columns").select("board_id").in("board_id", boardIds),
      supabase.from("tasks").select("board_id, due_date").in("board_id", boardIds),
    ]);
    if (columnsResult.error || !columnsResult.data || tasksResult.error || !tasksResult.data) {
      return { ok: false, error: "Public board details could not be loaded. Try again." };
    }
    const columnCounts = countByBoardId(columnsResult.data);
    const taskCounts = countByBoardId(tasksResult.data);
    const overdueCounts = new Map<string, number>();
    for (const task of tasksResult.data) {
      if (task.due_date && getDueDateStatus(task.due_date) === "overdue") overdueCounts.set(task.board_id, (overdueCounts.get(task.board_id) ?? 0) + 1);
    }
    return { ok: true, data: boards.map((board) => ({
      id: board.id,
      title: board.title,
      description: board.description,
      color: board.color,
      visibility: board.visibility,
      created_at: board.created_at,
      updated_at: board.updated_at,
      columnCount: columnCounts.get(board.id) ?? 0,
      taskCount: taskCounts.get(board.id) ?? 0,
      overdueCount: overdueCounts.get(board.id) ?? 0,
    })) };
  } catch {
    return { ok: false, error: "Public boards could not be loaded. Check your connection and try again." };
  }
}
