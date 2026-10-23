"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteBoard } from "@/actions/boards";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { BoardSummary } from "@/lib/boards";

type DeletableBoard = Pick<BoardSummary, "id" | "title" | "columnCount" | "taskCount">;

export function DeleteBoardDialog({
  board,
  trigger,
  redirectAfterDelete = false,
}: {
  board: DeletableBoard;
  trigger: ReactNode;
  redirectAfterDelete?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBoard({ id: board.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Board deleted");
      setOpen(false);
      if (redirectAfterDelete) router.push("/boards");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete “{board.title}”?</DialogTitle>
        <DialogDescription>
          This permanently deletes {board.columnCount} {board.columnCount === 1 ? "column" : "columns"} and {board.taskCount} {board.taskCount === 1 ? "task" : "tasks"} on this board.
        </DialogDescription>
        <div className="board-dialog-actions">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" className="danger-button" disabled={pending} onClick={handleDelete}>
            {pending ? "Deleting…" : "Delete board"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
