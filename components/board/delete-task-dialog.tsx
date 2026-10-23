"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { TaskWithLabels } from "@/types/database";

export function DeleteTaskDialog({
  task,
  open,
  onOpenChange,
  onDelete,
}: {
  task?: TaskWithLabels;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (task: TaskWithLabels) => Promise<boolean>;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!task) return;
    startTransition(async () => {
      const deleted = await onDelete(task);
      if (!deleted) return;
      toast.success("Task deleted");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Delete task?</DialogTitle>
        <DialogDescription>“{task?.title}” will be permanently removed from this board.</DialogDescription>
        <div className="board-dialog-actions">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" className="danger-button" disabled={pending} onClick={handleDelete}>{pending ? "Deleting…" : "Delete task"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
