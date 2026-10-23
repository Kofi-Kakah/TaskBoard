"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBoard, updateBoard } from "@/actions/boards";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { boardColors } from "@/lib/validation/boards";
import type { BoardRow } from "@/types/database";

export function BoardDialog({ board, trigger }: { board?: BoardRow; trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(board?.title ?? "");
  const [description, setDescription] = useState(board?.description ?? "");
  const [color, setColor] = useState(board?.color ?? boardColors[1]);
  const [visibility, setVisibility] = useState<"private" | "public">(board?.visibility ?? "private");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const payload = { title, description, color, visibility };
      const result = board
        ? await updateBoard({ ...payload, id: board.id })
        : await createBoard(payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(board ? "Board updated" : "Board created");
      setOpen(false);
      if (!board) router.push(`/boards/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{board ? "Board settings" : "Create a board"}</DialogTitle>
        <DialogDescription>
          {board ? "Update this board's name, color, or visibility." : "Give your new board a name and choose who can see it."}
        </DialogDescription>
        <form className="board-dialog-form" onSubmit={handleSubmit}>
          <label className="board-field-label" htmlFor={`board-title-${board?.id ?? "new"}`}>Board name</label>
          <Input
            id={`board-title-${board?.id ?? "new"}`}
            autoFocus
            maxLength={80}
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Product launch"
          />

          <label className="board-field-label" htmlFor={`board-description-${board?.id ?? "new"}`}>Description <span>Optional</span></label>
          <textarea
            id={`board-description-${board?.id ?? "new"}`}
            className="board-textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this board for?"
            rows={3}
          />

          <fieldset className="board-color-fieldset">
            <legend className="board-field-label">Board color</legend>
            <div className="board-color-options">
              {boardColors.map((option) => (
                <button
                  className={color === option ? "board-color-option is-selected" : "board-color-option"}
                  type="button"
                  key={option}
                  aria-label={`Choose ${option} board color`}
                  aria-pressed={color === option}
                  onClick={() => setColor(option)}
                >
                  <span style={{ backgroundColor: option }} />
                </button>
              ))}
            </div>
          </fieldset>

          <label className="board-field-label" htmlFor={`board-visibility-${board?.id ?? "new"}`}>Visibility</label>
          <select
            id={`board-visibility-${board?.id ?? "new"}`}
            className="board-select"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as "private" | "public")}
          >
            <option value="private">Private · only you can see it</option>
            <option value="public">Public · anyone with the link can view</option>
          </select>

          <div className="board-dialog-actions">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="default" disabled={pending}>
              {pending ? "Saving…" : board ? "Save changes" : "Create board"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
