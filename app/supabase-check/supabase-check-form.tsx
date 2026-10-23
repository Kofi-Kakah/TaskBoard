"use client";

import { useActionState } from "react";
import { runSupabaseCheck } from "@/actions/supabase-check";
import { Button } from "@/components/ui/button";

export function SupabaseCheckForm() {
  const [state, action, pending] = useActionState(runSupabaseCheck, null);

  return (
    <form action={action}>
      <input type="hidden" name="title" value="TaskBoard Phase 3 connection check" />
      <Button type="submit" disabled={pending}>
        {pending ? "Checking…" : "Run authenticated write check"}
      </Button>
      <p aria-live="polite" role="status">
        {state?.ok ? state.message : state?.error}
      </p>
    </form>
  );
}
