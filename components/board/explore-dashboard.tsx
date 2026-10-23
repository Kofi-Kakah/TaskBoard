import Link from "next/link";
import { ArrowUpRight, Columns3, LayoutGrid, SquareKanban } from "lucide-react";
import type { PublicBoardListResult } from "@/lib/boards";

export function ExploreDashboard({ result }: { result: PublicBoardListResult }) {
  if (!result.ok) return <section className="boards-content-state" role="alert"><h2>Public boards could not load</h2><p>{result.error}</p><Link className="ui-button" href="/explore">Retry</Link></section>;

  return <section className="boards-dashboard" aria-labelledby="explore-heading">
    <div className="boards-section-heading"><div><h2 id="explore-heading">Explore public boards</h2><p>Browse boards shared by their owners.</p></div></div>
    {result.data.length ? <div className="boards-grid">
      {result.data.map((board) => <article className="board-card" key={board.id}>
        <Link className="board-card-main" href={`/boards/${board.id}`}>
          <span className="board-card-mark" style={{ backgroundColor: board.color }}>{board.title.slice(0, 1).toUpperCase()}</span>
          <span className="board-card-title-wrap"><span className="board-card-title">{board.title}</span><span className="board-card-visibility"><span className="privacy-dot" />Public board</span></span>
          <ArrowUpRight className="board-card-open" size={16} />
        </Link>
        {board.description && <p className="board-card-description">{board.description}</p>}
        <div className="board-card-stats"><span><Columns3 size={14} /> {board.columnCount} {board.columnCount === 1 ? "column" : "columns"}</span><span><LayoutGrid size={14} /> {board.taskCount} {board.taskCount === 1 ? "task" : "tasks"}</span></div>
      </article>)}
    </div> : <div className="boards-empty-state"><span className="boards-empty-icon"><SquareKanban size={23} /></span><h2>No public boards yet</h2><p>Boards shared publicly will appear here.</p></div>}
  </section>;
}
