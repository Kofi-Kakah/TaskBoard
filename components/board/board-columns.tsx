"use client";
/* eslint-disable react-hooks/refs -- dnd-kit exposes callback refs and drag state together from its hooks. */

import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, useDroppable, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip, MoreHorizontal, Plus } from "lucide-react";
import { ColumnDialog, type ColumnDialogMode } from "@/components/board/column-dialog";
import { DeleteColumnDialog } from "@/components/board/delete-column-dialog";
import { TaskCard } from "@/components/board/task-card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ColumnSummary } from "@/lib/columns";
import type { TaskWithLabels } from "@/types/database";

type Snapshot = ColumnSummary[];
type TaskMove = (taskId: string, columnId: string, previousId: string | null, nextId: string | null, snapshot: Snapshot) => Promise<void>;
type ColumnMove = (columnId: string, previousId: string | null, nextId: string | null, snapshot: Snapshot) => Promise<void>;

function TaskItem({ task, disabled, readOnly, onEdit, onDelete }: { task: TaskWithLabels; disabled: boolean; readOnly: boolean; onEdit: (task: TaskWithLabels) => void; onDelete: (task: TaskWithLabels) => void }) {
  const sortable = useSortable({ id: task.id, disabled, data: { type: "task", columnId: task.column_id, title: task.title } });
  const style: CSSProperties = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition, opacity: sortable.isDragging ? 0.35 : undefined };
  return <div ref={sortable.setNodeRef} style={style} className={sortable.isDragging ? "kanban-task-sortable is-dragging" : "kanban-task-sortable"}>
    <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} dragAttributes={sortable.attributes} dragListeners={sortable.listeners} dragActivatorRef={sortable.setActivatorNodeRef} readOnly={readOnly} />
  </div>;
}

function ColumnCard({ boardId, column, disabled, readOnly, onQuickAdd, onEditTask, onDeleteTask }: {
  boardId: string; column: ColumnSummary; disabled: boolean; readOnly: boolean;
  onQuickAdd: (columnId: string, title: string) => Promise<boolean>; onEditTask: (task: TaskWithLabels) => void; onDeleteTask: (task: TaskWithLabels) => void;
}) {
  const sortable = useSortable({ id: column.id, disabled, data: { type: "column", title: column.title } });
  const [dialogMode, setDialogMode] = useState<ColumnDialogMode | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const drop = useDroppable({ id: `column-drop-${column.id}`, disabled, data: { type: "column-drop", columnId: column.id } });
  const style: CSSProperties = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition, opacity: sortable.isDragging ? 0.35 : undefined };
  function openComposer() { setComposerOpen(true); requestAnimationFrame(() => inputRef.current?.focus()); }
  async function submitQuickAdd() { if (!title.trim() || pending) return; setPending(true); const added = await onQuickAdd(column.id, title.trim()); setPending(false); if (added) setTitle(""); }
  function handleComposerKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") { event.preventDefault(); void submitQuickAdd(); }
    else if (event.key === "Escape") { setComposerOpen(false); setTitle(""); }
  }
  return <section ref={sortable.setNodeRef} style={style} className={`kanban-column${drop.isOver ? " is-drop-target" : ""}`} aria-label={`${column.title}, ${column.taskCount} tasks`}>
    <header className="kanban-column-header">
      {!readOnly && <button ref={sortable.setActivatorNodeRef} className="column-grip" type="button" aria-label={`Reorder ${column.title}`} {...sortable.attributes} {...sortable.listeners}><Grip size={16} /></button>}
      <span className="column-name-pill" style={{ backgroundColor: column.color }}>{column.title}</span>
      <span className="kanban-task-count">{column.taskCount}</span><span className="column-header-spacer" />
      {!readOnly && <DropdownMenu><DropdownMenuTrigger asChild><button className="icon-button column-menu-button" type="button" aria-label={`More options for ${column.title}`}><MoreHorizontal size={17} /></button></DropdownMenuTrigger><DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setDialogMode("rename")}>Rename</DropdownMenuItem><DropdownMenuItem onSelect={() => setDialogMode("color")}>Change color</DropdownMenuItem><DropdownMenuItem className="menu-item-danger" onSelect={() => setDeleteOpen(true)}>Delete column</DropdownMenuItem>
      </DropdownMenuContent></DropdownMenu>}
      {!readOnly && <button className="icon-button column-add-button" type="button" aria-label={`Add task to ${column.title}`} onClick={openComposer}><Plus size={16} /></button>}
    </header>
    <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
      <div ref={drop.setNodeRef} className={`kanban-column-cards${drop.isOver ? " is-drop-target" : ""}`}>
        {composerOpen && <form className="quick-task-composer" onSubmit={(event) => { event.preventDefault(); void submitQuickAdd(); }}><input ref={inputRef} value={title} maxLength={120} placeholder="Task title" aria-label={`New task in ${column.title}`} onChange={(event) => setTitle(event.target.value)} onKeyDown={handleComposerKeyDown} /><div><span>Enter to add · Esc to close</span><button type="submit" disabled={!title.trim() || pending}>{pending ? "Adding…" : "Add task"}</button></div></form>}
        {column.tasks.map((task) => <TaskItem key={task.id} task={task} disabled={disabled} readOnly={readOnly} onEdit={onEditTask} onDelete={onDeleteTask} />)}
        {column.taskCount === 0 && !composerOpen && <p className="kanban-column-empty">No tasks yet</p>}
      </div>
    </SortableContext>
    {!readOnly && <><ColumnDialog boardId={boardId} column={column} mode="rename" open={dialogMode === "rename"} onOpenChange={(open) => setDialogMode(open ? "rename" : null)} />
    <ColumnDialog boardId={boardId} column={column} mode="color" open={dialogMode === "color"} onOpenChange={(open) => setDialogMode(open ? "color" : null)} />
    <DeleteColumnDialog boardId={boardId} column={column} open={deleteOpen} onOpenChange={setDeleteOpen} /></>}
  </section>;
}

function insertTask(columns: Snapshot, taskId: string, targetColumnId: string, overId?: string): Snapshot {
  let moving: TaskWithLabels | undefined;
  const stripped = columns.map((column) => {
    const found = column.tasks.find((task) => task.id === taskId);
    moving ??= found;
    const tasks = column.tasks.filter((task) => task.id !== taskId);
    return { ...column, tasks, taskCount: tasks.length };
  });
  if (!moving) return columns;
  const destination = stripped.find((column) => column.id === targetColumnId);
  if (!destination) return columns;
  const tasks = [...destination.tasks];
  const overIndex = overId ? tasks.findIndex((task) => task.id === overId) : -1;
  const insertAt = overIndex < 0 ? tasks.length : overIndex;
  tasks.splice(insertAt, 0, { ...moving, column_id: targetColumnId });
  return stripped.map((column) => column.id === targetColumnId ? { ...column, tasks, taskCount: tasks.length } : column);
}

export function BoardColumns({ boardId, columns, onColumnsChange, onQuickAdd, onEditTask, onDeleteTask, onMoveTask, onMoveColumn, dragDisabled = false, dragDisabledReason, readOnly = false }: {
  boardId: string; columns: ColumnSummary[]; onColumnsChange: (columns: ColumnSummary[]) => void;
  onQuickAdd: (columnId: string, title: string) => Promise<boolean>; onEditTask: (task: TaskWithLabels) => void; onDeleteTask: (task: TaskWithLabels) => void;
  onMoveTask: TaskMove; onMoveColumn: ColumnMove; dragDisabled?: boolean; dragDisabledReason?: string; readOnly?: boolean;
}) {
  const snapshot = useRef<Snapshot>(columns);
  const active = useRef<{ type: string; id: string; title: string } | null>(null);
  const [overlay, setOverlay] = useState<{ type: string; title: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function handleDragStart(event: DragStartEvent) {
    snapshot.current = columns;
    active.current = { type: String(event.active.data.current?.type ?? ""), id: String(event.active.id), title: String(event.active.data.current?.title ?? "item") };
    setOverlay({ type: active.current.type, title: active.current.title });
  }
  function handleDragOver(event: DragOverEvent) {
    if (active.current?.type !== "task" || !event.over) return;
    const data = event.over.data.current;
    const targetColumnId = String(data?.columnId ?? (String(event.over.id).startsWith("column-drop-") ? String(event.over.id).slice(12) : ""));
    if (!targetColumnId) return;
    const next = insertTask(columns, active.current.id, targetColumnId, data?.type === "task" ? String(event.over.id) : undefined);
    if (next !== columns) onColumnsChange(next);
  }
  async function handleDragEnd(event: DragEndEvent) {
    const current = active.current;
    active.current = null;
    setOverlay(null);
    if (!current || !event.over) { onColumnsChange(snapshot.current); return; }
    const before = snapshot.current;
    if (current.type === "column") {
      const from = columns.findIndex((column) => column.id === current.id);
      const to = columns.findIndex((column) => column.id === String(event.over?.id));
      if (from < 0 || to < 0 || from === to) { if (from < 0) onColumnsChange(before); return; }
      const next = arrayMove(columns, from, to);
      onColumnsChange(next);
      const moved = next[to];
      await onMoveColumn(moved.id, next[to - 1]?.id ?? null, next[to + 1]?.id ?? null, before);
      return;
    }
    if (current.type !== "task") return;
    const target = event.over.data.current;
    const targetColumnId = String(target?.columnId ?? (String(event.over.id).startsWith("column-drop-") ? String(event.over.id).slice(12) : ""));
    const destination = columns.find((column) => column.id === targetColumnId);
    if (!destination) { onColumnsChange(before); return; }
    const taskIndex = destination.tasks.findIndex((task) => task.id === current.id);
    const task = destination.tasks[taskIndex];
    if (!task) { onColumnsChange(before); return; }
    const nextId = destination.tasks[taskIndex + 1]?.id ?? null;
    const previousId = destination.tasks[taskIndex - 1]?.id ?? null;
    if (task.column_id === before.flatMap((column) => column.tasks).find((item) => item.id === task.id)?.column_id && task.id === String(event.over.id)) { onColumnsChange(before); return; }
    await onMoveTask(task.id, destination.id, previousId, nextId, before);
  }
  const handleDragCancel = () => { active.current = null; setOverlay(null); onColumnsChange(snapshot.current); };
  const announcements = {
    onDragStart: ({ active: item }: { active: { data: { current?: Record<string, unknown> | undefined } } }) => `Picked up ${String(item.data.current?.title ?? "item")}. Use the arrow keys to move it.`,
    onDragOver: ({ over }: { over: { data: { current?: Record<string, unknown> | undefined } } | null }) => over ? `Over ${String(over.data.current?.title ?? over.data.current?.columnId ?? "board area")}.` : "Not over a drop target.",
    onDragEnd: () => "Item moved.", onDragCancel: () => "Movement cancelled.",
  };
  return <DndContext id={`taskboard-dnd-${boardId}`} sensors={sensors} collisionDetection={closestCorners} accessibility={{ announcements, screenReaderInstructions: { draggable: "Press Space to pick up, arrow keys to move, and Space to drop." } }} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={(event) => void handleDragEnd(event)} onDragCancel={handleDragCancel}>
    <SortableContext items={columns.map((column) => column.id)} strategy={horizontalListSortingStrategy}>
      <section className="kanban-board" aria-label="Board columns">
        {columns.map((column) => <ColumnCard key={column.id} boardId={boardId} column={column} disabled={dragDisabled || readOnly} readOnly={readOnly} onQuickAdd={onQuickAdd} onEditTask={onEditTask} onDeleteTask={onDeleteTask} />)}
        {!readOnly && <ColumnDialog boardId={boardId} mode="create" trigger={<Button type="button" variant="outline" className="add-column-ghost"><Plus size={17} /> Add column</Button>} />}
      </section>
    </SortableContext>
    <DragOverlay>{overlay ? <div className="drag-overlay-card" aria-hidden="true">{overlay.type === "column" ? <span className="column-name-pill">{overlay.title}</span> : overlay.title}</div> : null}</DragOverlay>
    {readOnly && <p className="drag-disabled-hint">View only. Only the board owner can make changes.</p>}
    {!readOnly && dragDisabled && dragDisabledReason && <p className="drag-disabled-hint">{dragDisabledReason}</p>}
  </DndContext>;
}
