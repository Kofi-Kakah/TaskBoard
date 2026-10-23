"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createLabel, deleteLabel, updateLabel } from "@/actions/labels";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { boardColors, resolveBoardColor } from "@/lib/validation/boards";
import type { LabelRow } from "@/types/database";

export function BoardLabelManager({ boardId, labels, onLabelsChange }: {
  boardId: string;
  labels: LabelRow[];
  onLabelsChange: (labels: LabelRow[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(boardColors[1]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>(boardColors[1]);
  const [pending, startTransition] = useTransition();

  function addLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createLabel({ boardId, name, color });
      if (!result.ok) { toast.error(result.error); return; }
      onLabelsChange([...labels, result.data].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      toast.success("Label created");
    });
  }

  function saveLabel(event: FormEvent<HTMLFormElement>, label: LabelRow) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateLabel({ boardId, labelId: label.id, name: editName, color: editColor });
      if (!result.ok) { toast.error(result.error); return; }
      onLabelsChange(labels.map((item) => item.id === label.id ? result.data : item).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      toast.success("Label updated");
    });
  }

  function removeLabel(label: LabelRow) {
    if (!window.confirm(`Delete “${label.name}”? It will be removed from all tasks.`)) return;
    startTransition(async () => {
      const result = await deleteLabel({ boardId, labelId: label.id });
      if (!result.ok) { toast.error(result.error); return; }
      onLabelsChange(labels.filter((item) => item.id !== label.id));
      toast.success("Label deleted");
    });
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button type="button" variant="outline" className="label-manager-trigger">Manage labels</Button></DialogTrigger>
    <DialogContent>
      <DialogTitle>Board labels</DialogTitle>
      <DialogDescription>Create and update labels available to tasks on this board.</DialogDescription>
      <div className="board-label-list">
        {labels.length === 0 && <p className="board-label-empty">No labels yet. Create one to use it on tasks.</p>}
        {labels.map((label) => editingId === label.id ? (
          <form className="board-label-row is-editing" key={label.id} onSubmit={(event) => saveLabel(event, label)}>
            <Input aria-label="Label name" value={editName} maxLength={24} required onChange={(event) => setEditName(event.target.value)} />
            <div className="label-color-options" aria-label="Label color">
              {boardColors.map((item) => <button type="button" key={item} className={editColor === item ? "board-color-option is-selected" : "board-color-option"} aria-label={`Choose ${item} label color`} aria-pressed={editColor === item} onClick={() => setEditColor(item)}><span style={{ backgroundColor: item }} /></button>)}
            </div>
            <Button type="submit" variant="default" disabled={pending}>Save</Button>
            <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
          </form>
        ) : (
          <div className="board-label-row" key={label.id}>
            <span className="board-label-swatch" style={{ backgroundColor: label.color }} aria-hidden="true" />
            <span className="board-label-name">{label.name}</span>
            <button type="button" className="icon-button" aria-label={`Edit ${label.name}`} onClick={() => { setEditName(label.name); setEditColor(resolveBoardColor(label.color)); setEditingId(label.id); }}><Pencil size={15} /></button>
            <button type="button" className="icon-button label-delete-button" aria-label={`Delete ${label.name}`} onClick={() => removeLabel(label)}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <form className="board-label-create" onSubmit={addLabel}>
        <label className="board-field-label" htmlFor="new-board-label">New label</label>
        <div className="board-label-create-row">
          <Input id="new-board-label" value={name} maxLength={24} required placeholder="e.g. Design" onChange={(event) => setName(event.target.value)} />
          <Button type="submit" variant="default" disabled={pending || !name.trim()}><Plus size={15} /> Add</Button>
        </div>
        <div className="label-color-options" aria-label="New label color">
          {boardColors.map((item) => <button type="button" key={item} className={color === item ? "board-color-option is-selected" : "board-color-option"} aria-label={`Choose ${item} label color`} aria-pressed={color === item} onClick={() => setColor(item)}><span style={{ backgroundColor: item }} /></button>)}
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
