"use client";

import Link from "next/link";
import { ArrowUpRight, Columns3, LayoutGrid, Plus, SquareKanban, Trash2 } from "lucide-react";
import { BoardDialog } from "@/components/board/board-dialog";
import { DeleteBoardDialog } from "@/components/board/delete-board-dialog";
import { Button } from "@/components/ui/button";
import type { BoardListResult, BoardSummary } from "@/lib/boards";

function BoardCard({ board }: { board: BoardSummary }) {
  return (
    <article className="board-card">
      <Link className="board-card-main" href={`/boards/${board.id}`}>
        <span className="board-card-mark" style={{ backgroundColor: board.color }}>{board.title.slice(0, 1).toUpperCase()}</span>
        <span className="board-card-title-wrap">
          <span className="board-card-title">{board.title}</span>
          <span className="board-card-visibility"><span className="privacy-dot" />{board.visibility}</span>
        </span>
        <ArrowUpRight className="board-card-open" size={16} />
      </Link>
      {board.description && <p className="board-card-description">{board.description}</p>}
      <div className="board-card-stats">
        <span><Columns3 size={14} /> {board.columnCount} {board.columnCount === 1 ? "column" : "columns"}</span>
        <span><LayoutGrid size={14} /> {board.taskCount} {board.taskCount === 1 ? "task" : "tasks"}</span>
      </div>
      <div className="board-card-actions">
        <BoardDialog
          board={board}
          trigger={<Button type="button" variant="outline" className="board-card-edit">Edit board</Button>}
        />
        <DeleteBoardDialog
          board={board}
          trigger={<button className="icon-button board-card-delete" type="button" aria-label={`Delete ${board.title}`}><Trash2 size={15} /></button>}
        />
      </div>
    </article>
  );
}

export function BoardsDashboard({ result }: { result: BoardListResult }) {
  if (!result.ok) {
    return (
      <section className="boards-content-state" role="alert">
        <h2>Boards could not load</h2>
        <p>{result.error}</p>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </section>
    );
  }

  return (
    <section className="boards-dashboard" aria-labelledby="boards-heading">
      <div className="boards-section-heading">
        <div>
          <h2 id="boards-heading">Your boards</h2>
          <p>Keep projects and tasks organized in one place.</p>
        </div>
        <BoardDialog trigger={<Button type="button" variant="default"><Plus size={16} /> New board</Button>} />
      </div>

      {result.data.length ? (
        <div className="boards-grid">
          {result.data.map((board) => <BoardCard key={board.id} board={board} />)}
        </div>
      ) : (
        <div className="boards-empty-state">
          <span className="boards-empty-icon"><SquareKanban size={23} /></span>
          <h2>No boards yet</h2>
          <p>Create a board to start organizing your work.</p>
          <BoardDialog trigger={<Button type="button" variant="default"><Plus size={16} /> Create your first board</Button>} />
        </div>
      )}
    </section>
  );
}
