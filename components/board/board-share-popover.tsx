"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { updateBoard } from "@/actions/boards";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BoardDisplaySummary } from "@/lib/boards";

export function BoardSharePopover({ board }: { board: BoardDisplaySummary }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function toggleVisibility() {
    if (pending) return;
    setPending(true);
    const result = await updateBoard({ id: board.id, title: board.title, description: board.description, color: board.color, visibility: board.visibility === "public" ? "private" : "public" });
    setPending(false);
    if (!result.ok) { toast.error(result.error); return; }
    toast.success(result.data.visibility === "public" ? "Board is now public." : "Board is now private.");
    router.refresh();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/boards/${board.id}`);
      setCopied(true);
      toast.success("Board link copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("The link could not be copied. Copy it from your browser address bar.");
    }
  }

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button type="button" variant="outline" size="icon" className="header-icon-button" aria-label="Share board"><Share2 size={16} /></Button></PopoverTrigger>
    <PopoverContent align="end" className="board-share-popover">
      <strong>Share board</strong>
      <p>{board.visibility === "public" ? "Anyone with the link can view this board." : "Only you can view this board."}</p>
      <Button type="button" variant="outline" disabled={pending} onClick={() => void toggleVisibility()}>{pending ? "Saving…" : board.visibility === "public" ? "Make board private" : "Make board public"}</Button>
      {board.visibility === "public" && <Button type="button" variant="default" onClick={() => void copyLink()}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy link"}</Button>}
    </PopoverContent>
  </Popover>;
}
