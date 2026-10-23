"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteColumn } from "@/actions/columns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ColumnSummary } from "@/lib/columns";

export function DeleteColumnDialog({
  boardId,
  column,
  trigger,
  open,
  onOpenChange,
}: {
  boardId: string;
  column: ColumnSummary;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isOpen = open ?? uncontrolledOpen;
  const changeOpen = onOpenChange ?? setUncontrolledOpen;

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteColumn({ boardId, columnId: column.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Column deleted");
      changeOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={changeOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogTitle>Delete “{column.title}”?</DialogTitle>
        <DialogDescription>
          This permanently deletes this column and its {column.taskCount} {column.taskCount === 1 ? "task" : "tasks"}.
        </DialogDescription>
        <div className="board-dialog-actions">
          <Button type="button" variant="outline" onClick={() => changeOpen(false)}>Cancel</Button>
          <Button type="button" className="danger-button" disabled={pending} onClick={handleDelete}>
            {pending ? "Deleting…" : "Delete column"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
