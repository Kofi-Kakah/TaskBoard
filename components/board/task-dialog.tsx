"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TaskLabelPicker } from "@/components/board/task-label-picker";
import { formatDateOnly, parseDateOnly } from "@/lib/dates";
import { taskInputSchema, type TaskFormValues } from "@/lib/validation/tasks";
import type { TaskActionResult } from "@/actions/tasks";
import type { LabelRow, TaskWithLabels } from "@/types/database";

function localDateToString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TaskDialog({
  boardId,
  columns,
  labels,
  onLabelsChange,
  task,
  open,
  onOpenChange,
  onSave,
}: {
  boardId: string;
  columns: Array<{ id: string; title: string }>;
  labels: LabelRow[];
  onLabelsChange: (labels: LabelRow[]) => void;
  task?: TaskWithLabels;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: TaskFormValues, task?: TaskWithLabels) => Promise<TaskActionResult>;
}) {
  const [pending, setPending] = useState(false);
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskInputSchema),
    defaultValues: {
      boardId,
      columnId: task?.column_id ?? columns[0]?.id ?? "",
      title: task?.title ?? "",
      description: task?.description ?? "",
      priority: task?.priority ?? "medium",
      dueDate: task?.due_date ?? "",
      labelIds: task?.labels.map((label) => label.id) ?? [],
    },
  });
  const dueDateValue = useWatch({ control: form.control, name: "dueDate" });
  const descriptionValue = useWatch({ control: form.control, name: "description" });
  const selectedDate = dueDateValue ? parseDateOnly(dueDateValue) : null;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && form.formState.isDirty && !window.confirm("Discard your unsaved task changes?")) return;
    onOpenChange(nextOpen);
  }

  async function handleSubmit(values: TaskFormValues) {
    setPending(true);
    const result = await onSave(values, task);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(task ? "Task updated" : "Task created");
    form.reset(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        <DialogDescription>{task ? "Update the details for this task." : "Add a task to a board column."}</DialogDescription>
        <form className="task-dialog-form" onSubmit={form.handleSubmit(handleSubmit)}>
          {!task && <>
            <label className="board-field-label" htmlFor="task-column">Column</label>
            <select id="task-column" className="board-select" {...form.register("columnId")}>
              {columns.map((column) => <option key={column.id} value={column.id}>{column.title}</option>)}
            </select>
            {form.formState.errors.columnId && <span className="field-error">Choose a column.</span>}
          </>}

          <label className="board-field-label" htmlFor="task-title">Task title</label>
          <Input id="task-title" autoFocus maxLength={120} placeholder="What needs to get done?" {...form.register("title")} />
          {form.formState.errors.title && <span className="field-error">{form.formState.errors.title.message}</span>}

          <label className="board-field-label" htmlFor="task-description">Description <span>Optional</span></label>
          <textarea id="task-description" className="board-textarea" rows={4} maxLength={2000} placeholder="Add a few details" {...form.register("description")} />
          <div className="task-field-meta"><span>{descriptionValue.length}/2000</span>{form.formState.errors.description && <span className="field-error">{form.formState.errors.description.message}</span>}</div>

          <label className="board-field-label" htmlFor="task-priority">Priority</label>
          <select id="task-priority" className="board-select" {...form.register("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <Controller control={form.control} name="labelIds" render={({ field }) => (
            <TaskLabelPicker boardId={boardId} labels={labels} selectedIds={field.value} onChange={field.onChange} onLabelsChange={onLabelsChange} />
          )} />

          <span className="board-field-label">Due date <span>Optional</span></span>
          <Controller
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="due-date-trigger" aria-label={field.value ? `Due date ${formatDateOnly(field.value)}` : "Choose due date"}>
                    <CalendarDays size={15} />
                    <span>{field.value ? formatDateOnly(field.value) : "Choose a date"}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="due-date-popover">
                  <Calendar
                    mode="single"
                    selected={selectedDate ?? undefined}
                    defaultMonth={selectedDate ?? new Date()}
                    onSelect={(date) => field.onChange(date ? localDateToString(date) : "")}
                  />
                  <Button type="button" variant="ghost" className="due-date-clear" onClick={() => field.onChange("")}>Clear date</Button>
                </PopoverContent>
              </Popover>
            )}
          />
          {form.formState.errors.dueDate && <span className="field-error">{form.formState.errors.dueDate.message}</span>}

          <div className="board-dialog-actions">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="default" disabled={pending}>{pending ? "Saving…" : "Save task"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
