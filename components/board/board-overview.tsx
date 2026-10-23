"use client";

import { Columns3, LayoutGrid, Plus, SquareKanban } from "lucide-react";
import { BoardColumns } from "@/components/board/board-columns";
import { BoardDialog } from "@/components/board/board-dialog";
import { ColumnDialog } from "@/components/board/column-dialog";
import { DeleteBoardDialog } from "@/components/board/delete-board-dialog";
import { Button } from "@/components/ui/button";
import type { BoardSummary } from "@/lib/boards";
import type { ColumnSummary } from "@/lib/columns";

export function BoardOverview({ board, columns }: { board: BoardSummary; columns: ColumnSummary[] }) {
  return (
    <>
      <section className="board-toolbar board-overview-toolbar" aria-label="Board actions">
        <div className="board-overview-stats">
          <span><Columns3 size={15} /> {board.columnCount} {board.columnCount === 1 ? "column" : "columns"}</span>
          <span><LayoutGrid size={15} /> {board.taskCount} {board.taskCount === 1 ? "task" : "tasks"}</span>
        </div>
        <div className="board-toolbar-actions">
          <ColumnDialog boardId={board.id} mode="create" trigger={<Button type="button" variant="default"><Plus size={15} /> Add column</Button>} />
          <BoardDialog board={board} trigger={<Button type="button" variant="outline">Board settings</Button>} />
          <DeleteBoardDialog board={board} redirectAfterDelete trigger={<Button type="button" variant="outline" className="danger-outline">Delete board</Button>} />
        </div>
      </section>
      {columns.length ? (
        <BoardColumns boardId={board.id} columns={columns} />
      ) : (
        <section className="board-detail-empty">
          <span className="boards-empty-icon"><SquareKanban size={23} /></span>
          <h2>Your board is ready</h2>
          <p>Create your first column to start organizing tasks.</p>
          <ColumnDialog boardId={board.id} mode="create" trigger={<Button type="button" variant="default"><Plus size={16} /> Create your first column</Button>} />
        </section>
      )}
    </>
  );
}
