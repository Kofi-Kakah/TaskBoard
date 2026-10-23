"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Grip, MoreHorizontal, Plus } from "lucide-react";
import { ColumnDialog, type ColumnDialogMode } from "@/components/board/column-dialog";
import { DeleteColumnDialog } from "@/components/board/delete-column-dialog";
import { TaskCard } from "@/components/board/task-card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ColumnSummary } from "@/lib/columns";
import type { TaskWithLabels } from "@/types/database";

function ColumnCard({ boardId, column, onQuickAdd, onEditTask, onDeleteTask }: {
  boardId: string;
  column: ColumnSummary;
  onQuickAdd: (columnId: string, title: string) => Promise<boolean>;
  onEditTask: (task: TaskWithLabels) => void;
  onDeleteTask: (task: TaskWithLabels) => void;
}) {
  const [dialogMode, setDialogMode] = useState<ColumnDialogMode | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function openComposer() {
    setComposerOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function submitQuickAdd() {
    if (!title.trim() || pending) return;
    setPending(true);
    const added = await onQuickAdd(column.id, title.trim());
    setPending(false);
    if (added) setTitle("");
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void submitQuickAdd();
    } else if (event.key === "Escape") {
      setComposerOpen(false);
      setTitle("");
    }
  }

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
        <button className="icon-button column-add-button" type="button" aria-label={`Add task to ${column.title}`} onClick={openComposer}><Plus size={16} /></button>
      </header>
      <div className="kanban-column-cards">
        {composerOpen && <form className="quick-task-composer" onSubmit={(event) => { event.preventDefault(); void submitQuickAdd(); }}>
          <input ref={inputRef} value={title} maxLength={120} placeholder="Task title" aria-label={`New task in ${column.title}`} onChange={(event) => setTitle(event.target.value)} onKeyDown={handleComposerKeyDown} />
          <div><span>Enter to add · Esc to close</span><button type="submit" disabled={!title.trim() || pending}>{pending ? "Adding…" : "Add task"}</button></div>
        </form>}
        {column.tasks.map((task) => <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />)}
        {column.taskCount === 0 && !composerOpen && <p className="kanban-column-empty">No tasks yet</p>}
      </div>
      <ColumnDialog boardId={boardId} column={column} mode="rename" open={dialogMode === "rename"} onOpenChange={(open) => setDialogMode(open ? "rename" : null)} />
      <ColumnDialog boardId={boardId} column={column} mode="color" open={dialogMode === "color"} onOpenChange={(open) => setDialogMode(open ? "color" : null)} />
      <DeleteColumnDialog boardId={boardId} column={column} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </section>
  );
}

export function BoardColumns({ boardId, columns, onQuickAdd, onEditTask, onDeleteTask }: {
  boardId: string;
  columns: ColumnSummary[];
  onQuickAdd: (columnId: string, title: string) => Promise<boolean>;
  onEditTask: (task: TaskWithLabels) => void;
  onDeleteTask: (task: TaskWithLabels) => void;
}) {
  return <section className="kanban-board" aria-label="Board columns">
    {columns.map((column) => <ColumnCard key={column.id} boardId={boardId} column={column} onQuickAdd={onQuickAdd} onEditTask={onEditTask} onDeleteTask={onDeleteTask} />)}
    <ColumnDialog boardId={boardId} mode="create" trigger={<Button type="button" variant="outline" className="add-column-ghost"><Plus size={17} /> Add column</Button>} />
  </section>;
}
