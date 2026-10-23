"use client";

import { useState } from "react";
import { Grip, MoreHorizontal, Plus } from "lucide-react";
import { ColumnDialog, type ColumnDialogMode } from "@/components/board/column-dialog";
import { DeleteColumnDialog } from "@/components/board/delete-column-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ColumnSummary } from "@/lib/columns";

function ColumnCard({ boardId, column }: { boardId: string; column: ColumnSummary }) {
  const [dialogMode, setDialogMode] = useState<ColumnDialogMode | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <section className="kanban-column" aria-label={`${column.title}, ${column.taskCount} tasks`}>
      <header className="kanban-column-header">
        <span className="column-grip" aria-hidden="true"><Grip size={16} /></span>
        <span className="column-name-pill" style={{ backgroundColor: column.color }}>{column.title}</span>
        <span className="kanban-task-count">{column.taskCount}</span>
        <span className="column-header-spacer" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button className="icon-button column-menu-button" type="button" aria-label={`More options for ${column.title}`}><MoreHorizontal size={17} /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setDialogMode("rename")}>Rename</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDialogMode("color")}>Change color</DropdownMenuItem>
            <DropdownMenuItem className="menu-item-danger" onSelect={() => setDeleteOpen(true)}>Delete column</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="kanban-column-cards">
        {column.taskCount === 0 ? <p className="kanban-column-empty">No tasks yet</p> : <p className="kanban-column-empty">{column.taskCount} {column.taskCount === 1 ? "task" : "tasks"} will appear here.</p>}
      </div>
      <ColumnDialog boardId={boardId} column={column} mode="rename" open={dialogMode === "rename"} onOpenChange={(open) => setDialogMode(open ? "rename" : null)} />
      <ColumnDialog boardId={boardId} column={column} mode="color" open={dialogMode === "color"} onOpenChange={(open) => setDialogMode(open ? "color" : null)} />
      <DeleteColumnDialog boardId={boardId} column={column} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </section>
  );
}

export function BoardColumns({ boardId, columns }: { boardId: string; columns: ColumnSummary[] }) {
  return (
    <section className="kanban-board" aria-label="Board columns">
      {columns.map((column) => <ColumnCard key={column.id} boardId={boardId} column={column} />)}
      <ColumnDialog
        boardId={boardId}
        mode="create"
        trigger={<Button type="button" variant="outline" className="add-column-ghost"><Plus size={17} /> Add column</Button>}
      />
    </section>
  );
}
