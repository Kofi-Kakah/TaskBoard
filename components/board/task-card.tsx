"use client";

import { CalendarDays, Circle, MoreHorizontal } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDateOnly, getDueDateStatus } from "@/lib/dates";
import type { TaskWithLabels } from "@/types/database";

function PriorityTile({ priority }: { priority: TaskWithLabels["priority"] }) {
  const labels: Record<TaskWithLabels["priority"], string> = { low: "Low priority", medium: "Medium priority", high: "High priority" };
  return <span className={`priority-tile priority-${priority}`} aria-label={labels[priority]} title={labels[priority]}><span className="priority-bars" aria-hidden="true"><i /><i /><i /></span></span>;
}

export function TaskCard({ task, onEdit, onDelete, dragAttributes, dragListeners, dragActivatorRef, readOnly = false }: { task: TaskWithLabels; onEdit: (task: TaskWithLabels) => void; onDelete: (task: TaskWithLabels) => void; dragAttributes?: DraggableAttributes; dragListeners?: DraggableSyntheticListeners; dragActivatorRef?: (element: HTMLElement | null) => void; readOnly?: boolean }) {
  const dueStatus = task.due_date ? getDueDateStatus(task.due_date) : null;
  function handleOpenKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      onEdit(task);
    }
  }
  return (
    <article className="kanban-task-card">
      <div ref={dragActivatorRef} className={`task-card-content${readOnly ? "" : " task-card-open"}`} role={readOnly ? undefined : "button"} tabIndex={readOnly ? undefined : 0} onClick={readOnly ? undefined : () => onEdit(task)} onKeyDown={readOnly ? undefined : handleOpenKeyDown} aria-label={readOnly ? undefined : `Edit task: ${task.title}`} {...(!readOnly ? dragAttributes : undefined)} {...(!readOnly ? dragListeners : undefined)}>
        <div className="task-card-heading">
          <span className="task-label-marker" style={{ backgroundColor: task.labels[0]?.color ?? "#EAECF0", color: task.labels[0]?.color ?? "#667085" }} aria-hidden="true"><Circle size={11} /></span>
          <span className="task-card-title" title={task.title}>{task.title}</span>
        </div>
        {task.description && <p className="task-card-description" title={task.description}>{task.description}</p>}
        {task.due_date && <p className={`task-card-due ${dueStatus ? `due-${dueStatus}` : ""}`}>
          <CalendarDays size={14} aria-hidden="true" /><span>{formatDateOnly(task.due_date)}</span>
          {dueStatus === "overdue" && <span className="due-state-label">Overdue</span>}
          {dueStatus === "soon" && <span className="due-state-label">Due soon</span>}
        </p>}
        <div className="task-card-divider" />
        <div className="task-card-footer">
          <PriorityTile priority={task.priority} />
          {task.labels.length > 0 && <div className="task-label-list" aria-label="Task labels">
            {task.labels.slice(0, 2).map((label) => <span key={label.id} className="task-label-pill" title={label.name}><span style={{ backgroundColor: label.color }} />{label.name}</span>)}
            {task.labels.length > 2 && <span className="task-label-overflow">+{task.labels.length - 2}</span>}
          </div>}
        </div>
      </div>
      {!readOnly && <DropdownMenu>
        <DropdownMenuTrigger asChild><button className="icon-button task-menu-button" type="button" aria-label={`More options for ${task.title}`}><MoreHorizontal size={17} /></button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(task)}>Edit</DropdownMenuItem>
          <DropdownMenuItem className="menu-item-danger" onSelect={() => onDelete(task)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>}
    </article>
  );
}
