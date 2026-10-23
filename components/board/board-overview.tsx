"use client";

import { Columns3, LayoutGrid, Plus, SquareKanban } from "lucide-react";
import { BoardDialog } from "@/components/board/board-dialog";
import { DeleteBoardDialog } from "@/components/board/delete-board-dialog";
import { Button } from "@/components/ui/button";
import type { BoardSummary } from "@/lib/boards";

export function BoardOverview({ board }: { board: BoardSummary }) {
  return (
    <>
      <section className="board-toolbar board-overview-toolbar" aria-label="Board actions">
        <div className="board-overview-stats">
          <span><Columns3 size={15} /> {board.columnCount} {board.columnCount === 1 ? "column" : "columns"}</span>
          <span><LayoutGrid size={15} /> {board.taskCount} {board.taskCount === 1 ? "task" : "tasks"}</span>
        </div>
        <div className="board-toolbar-actions">
          <BoardDialog board={board} trigger={<Button type="button" variant="outline">Board settings</Button>} />
          <DeleteBoardDialog board={board} redirectAfterDelete trigger={<Button type="button" variant="outline" className="danger-outline">Delete board</Button>} />
        </div>
      </section>
      {board.columnCount === 0 ? (
        <section className="board-detail-empty">
          <span className="boards-empty-icon"><SquareKanban size={23} /></span>
          <h2>Your board is ready</h2>
          <p>Create your first column to start organizing tasks.</p>
          <Button type="button" variant="default" disabled><Plus size={16} /> Create your first column</Button>
        </section>
      ) : (
        <section className="board-detail-empty">
          <span className="boards-empty-icon"><SquareKanban size={23} /></span>
          <h2>Columns are ready</h2>
          <p>Task and column management continues in the next phases.</p>
        </section>
      )}
    </>
  );
}
