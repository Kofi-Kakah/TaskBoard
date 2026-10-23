"use client";

import { CalendarDays, Circle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDateOnly, getDueDateStatus } from "@/lib/dates";
import type { TaskRow } from "@/types/database";

function PriorityTile({ priority }: { priority: TaskRow["priority"] }) {
  const labels: Record<TaskRow["priority"], string> = { low: "Low priority", medium: "Medium priority", high: "High priority" };
  return <span className={`priority-tile priority-${priority}`} aria-label={labels[priority]} title={labels[priority]}><span className="priority-bars" aria-hidden="true"><i /><i /><i /></span></span>;
}

export function TaskCard({ task, onEdit, onDelete }: { task: TaskRow; onEdit: (task: TaskRow) => void; onDelete: (task: TaskRow) => void }) {
  const dueStatus = task.due_date ? getDueDateStatus(task.due_date) : null;
  return (
    <article className="kanban-task-card">
      <button className="task-card-open task-card-content" type="button" onClick={() => onEdit(task)} aria-label={`Edit task: ${task.title}`}>
        <div className="task-card-heading">
          <span className="task-label-marker" aria-hidden="true"><Circle size={11} /></span>
          <span className="task-card-title" title={task.title}>{task.title}</span>
        </div>
        {task.description && <p className="task-card-description" title={task.description}>{task.description}</p>}
        {task.due_date && <p className={`task-card-due ${dueStatus ? `due-${dueStatus}` : ""}`}>
          <CalendarDays size={14} aria-hidden="true" /><span>{formatDateOnly(task.due_date)}</span>
          {dueStatus === "overdue" && <span className="due-state-label">Overdue</span>}
          {dueStatus === "soon" && <span className="due-state-label">Due soon</span>}
        </p>}
        <div className="task-card-divider" />
        <div className="task-card-footer"><PriorityTile priority={task.priority} /></div>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><button className="icon-button task-menu-button" type="button" aria-label={`More options for ${task.title}`}><MoreHorizontal size={17} /></button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(task)}>Edit</DropdownMenuItem>
          <DropdownMenuItem className="menu-item-danger" onSelect={() => onDelete(task)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}
