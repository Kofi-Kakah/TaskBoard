"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createColumn, updateColumn } from "@/actions/columns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { boardColors, resolveBoardColor } from "@/lib/validation/boards";
import type { ColumnRow } from "@/types/database";

export type ColumnDialogMode = "create" | "rename" | "color";

export function ColumnDialog({
  boardId,
  column,
  mode,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  boardId: string;
  column?: ColumnRow;
  mode: ColumnDialogMode;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(column?.title ?? "");
  const [color, setColor] = useState(resolveBoardColor(column?.color ?? boardColors[0]));
  const open = controlledOpen ?? uncontrolledOpen;
  const changeOpen = onOpenChange ?? setUncontrolledOpen;
  const titleVisible = mode !== "color";
  const colorVisible = mode !== "rename";
  const heading = mode === "create" ? "Add a column" : mode === "rename" ? "Rename column" : "Change column color";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = mode === "create"
        ? await createColumn({ boardId, title, color })
        : await updateColumn({ boardId, columnId: column?.id, ...(titleVisible ? { title } : {}), ...(colorVisible ? { color } : {}) });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "create" ? "Column created" : mode === "rename" ? "Column renamed" : "Column color updated");
      changeOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogTitle>{heading}</DialogTitle>
        <DialogDescription>
          {mode === "create" ? "Add a place to organize tasks on this board." : "Update this column on the board."}
        </DialogDescription>
        <form className="board-dialog-form" onSubmit={handleSubmit}>
          {titleVisible && <>
            <label className="board-field-label" htmlFor={`column-title-${column?.id ?? "new"}`}>Column name</label>
            <Input
              id={`column-title-${column?.id ?? "new"}`}
              autoFocus
              maxLength={40}
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. In progress"
            />
          </>}
          {colorVisible && <fieldset className="board-color-fieldset">
            <legend className="board-field-label">Column color</legend>
            <div className="board-color-options">
              {boardColors.map((option) => (
                <button
                  className={color === option ? "board-color-option is-selected" : "board-color-option"}
                  type="button"
                  key={option}
                  aria-label={`Choose ${option} column color`}
                  aria-pressed={color === option}
                  onClick={() => setColor(option)}
                ><span style={{ backgroundColor: option }} /></button>
              ))}
            </div>
          </fieldset>}
          <div className="board-dialog-actions">
            <Button type="button" variant="outline" onClick={() => changeOpen(false)}>Cancel</Button>
            <Button type="submit" variant="default" disabled={pending}>{pending ? "Saving…" : mode === "create" ? "Add column" : "Save changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
