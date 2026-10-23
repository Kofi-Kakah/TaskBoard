"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Columns3, LayoutGrid, Plus, SquareKanban } from "lucide-react";
import { createTask, deleteTask, updateTask, type TaskActionResult } from "@/actions/tasks";
import { BoardColumns } from "@/components/board/board-columns";
import { BoardDialog } from "@/components/board/board-dialog";
import { ColumnDialog } from "@/components/board/column-dialog";
import { DeleteBoardDialog } from "@/components/board/delete-board-dialog";
import { DeleteTaskDialog } from "@/components/board/delete-task-dialog";
import { TaskDialog } from "@/components/board/task-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { BoardSummary } from "@/lib/boards";
import type { ColumnSummary } from "@/lib/columns";
import type { TaskFormValues } from "@/lib/validation/tasks";
import type { TaskRow } from "@/types/database";

export function BoardOverview({ board, columns: initialColumns }: { board: BoardSummary; columns: ColumnSummary[] }) {
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow>();
  const [deletingTask, setDeletingTask] = useState<TaskRow>();
  const [newColumnOpen, setNewColumnOpen] = useState(false);

  function replaceTask(task: TaskRow) {
    setColumns((current) => current.map((column) => {
      if (column.id !== task.column_id) return column;
      const exists = column.tasks.some((item) => item.id === task.id);
      return { ...column, tasks: exists ? column.tasks.map((item) => item.id === task.id ? task : item) : [...column.tasks, task], taskCount: exists ? column.taskCount : column.taskCount + 1 };
    }));
  }

  async function saveTask(values: TaskFormValues, task?: TaskRow): Promise<TaskActionResult> {
    const columnId = task?.column_id ?? values.columnId;
    const snapshot = columns;
    const optimisticTask: TaskRow = {
      id: task?.id ?? `optimistic-${crypto.randomUUID()}`,
      board_id: board.id,
      column_id: columnId,
      title: values.title.trim(),
      description: values.description || null,
      priority: values.priority,
      due_date: values.dueDate || null,
      position: task?.position ?? `z${Date.now()}`,
      created_by: task?.created_by ?? null,
      created_at: task?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (task) {
      setColumns((current) => current.map((column) => ({ ...column, tasks: column.tasks.map((item) => item.id === task.id ? optimisticTask : item) })));
    } else {
      setColumns((current) => current.map((column) => column.id === columnId ? { ...column, taskCount: column.taskCount + 1, tasks: [...column.tasks, optimisticTask] } : column));
    }

    const result = task
      ? await updateTask({ boardId: board.id, taskId: task.id, title: values.title, description: values.description, priority: values.priority, dueDate: values.dueDate })
      : await createTask({ ...values, boardId: board.id, columnId });

    if (!result.ok) {
      setColumns(snapshot);
      return result;
    }
    replaceTask(result.data);
    router.refresh();
    return result;
  }

  async function quickAdd(columnId: string, title: string) {
    const snapshot = columns;
    const optimisticTask: TaskRow = {
      id: `optimistic-${crypto.randomUUID()}`, board_id: board.id, column_id: columnId,
      title, description: null, priority: "medium", due_date: null, position: `z${Date.now()}`,
      created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setColumns((current) => current.map((column) => column.id === columnId ? { ...column, taskCount: column.taskCount + 1, tasks: [...column.tasks, optimisticTask] } : column));
    const result = await createTask({ boardId: board.id, columnId, title, description: "", priority: "medium", dueDate: "" });
    if (!result.ok) {
      setColumns(snapshot);
      toast.error(result.error);
      return false;
    }
    replaceTask(result.data);
    router.refresh();
    return true;
  }

  async function removeTask(task: TaskRow) {
    const snapshot = columns;
    setColumns((current) => current.map((column) => column.id === task.column_id
      ? { ...column, taskCount: Math.max(0, column.taskCount - 1), tasks: column.tasks.filter((item) => item.id !== task.id) }
      : column));
    const result = await deleteTask({ boardId: board.id, taskId: task.id });
    if (!result.ok) {
      setColumns(snapshot);
      toast.error(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  return <>
    <section className="board-toolbar board-overview-toolbar" aria-label="Board actions">
      <div className="board-overview-stats">
        <span><Columns3 size={15} /> {columns.length} {columns.length === 1 ? "column" : "columns"}</span>
        <span><LayoutGrid size={15} /> {columns.reduce((total, column) => total + column.taskCount, 0)} tasks</span>
      </div>
      <div className="board-toolbar-actions">
        <div className="add-new-split">
          <Button type="button" variant="default" className="add-new-main" disabled={!columns.length} onClick={() => { setEditingTask(undefined); setTaskOpen(true); }}><Plus size={15} /> New task</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button type="button" variant="default" className="add-new-chevron" aria-label="More add options"><span aria-hidden="true">⌄</span></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!columns.length} onSelect={() => { setEditingTask(undefined); setTaskOpen(true); }}>New task</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setNewColumnOpen(true)}>New column</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ColumnDialog boardId={board.id} mode="create" open={newColumnOpen} onOpenChange={setNewColumnOpen} />
        <BoardDialog board={board} trigger={<Button type="button" variant="outline">Board settings</Button>} />
        <DeleteBoardDialog board={board} redirectAfterDelete trigger={<Button type="button" variant="outline" className="danger-outline">Delete board</Button>} />
      </div>
    </section>
    {columns.length ? <BoardColumns boardId={board.id} columns={columns} onQuickAdd={quickAdd} onEditTask={(task) => { setEditingTask(task); setTaskOpen(true); }} onDeleteTask={setDeletingTask} /> : (
      <section className="board-detail-empty">
        <span className="boards-empty-icon"><SquareKanban size={23} /></span>
        <h2>Your board is ready</h2><p>Create your first column to start organizing tasks.</p>
        <ColumnDialog boardId={board.id} mode="create" trigger={<Button type="button" variant="default"><Plus size={16} /> Create your first column</Button>} />
      </section>
    )}
    <TaskDialog key={`${editingTask?.id ?? "new-task"}-${taskOpen ? "open" : "closed"}`} boardId={board.id} columns={columns.map(({ id, title }) => ({ id, title }))} task={editingTask} open={taskOpen} onOpenChange={(open) => { setTaskOpen(open); if (!open) setEditingTask(undefined); }} onSave={saveTask} />
    <DeleteTaskDialog task={deletingTask} open={Boolean(deletingTask)} onOpenChange={(open) => { if (!open) setDeletingTask(undefined); }} onDelete={removeTask} />
  </>;
}
