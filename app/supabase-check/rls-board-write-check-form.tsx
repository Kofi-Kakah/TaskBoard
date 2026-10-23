"use client";

import { useActionState } from "react";
import { checkBoardWritePolicy } from "@/actions/supabase-check";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RlsBoardWriteCheckForm({
  boardId,
  title,
  editable = false,
}: {
  boardId?: string;
  title?: string;
  editable?: boolean;
}) {
  const [state, action, pending] = useActionState(checkBoardWritePolicy, null);

  return (
    <form action={action}>
      {editable ? (
        <>
          <label>
            Board ID
            <Input name="boardId" required pattern="[0-9a-fA-F-]{36}" />
          </label>
          <label>
            Current board title (the update writes it back unchanged)
            <Input name="title" required maxLength={80} />
          </label>
        </>
      ) : (
        <>
          <input type="hidden" name="boardId" value={boardId} />
          <input type="hidden" name="title" value={title} />
        </>
      )}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Checking…" : "Check owner-only update"}
      </Button>
      <span aria-live="polite" role="status">
        {state?.ok ? state.message : state?.error}
      </span>
    </form>
  );
}
