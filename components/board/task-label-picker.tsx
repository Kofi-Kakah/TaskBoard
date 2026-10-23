"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { createLabel } from "@/actions/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { boardColors } from "@/lib/validation/boards";
import type { LabelRow } from "@/types/database";

export function TaskLabelPicker({ boardId, labels, selectedIds, onChange, onLabelsChange }: {
  boardId: string;
  labels: LabelRow[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onLabelsChange: (labels: LabelRow[]) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(boardColors[1]);
  const [pending, startTransition] = useTransition();

  function toggle(labelId: string) {
    onChange(selectedIds.includes(labelId) ? selectedIds.filter((id) => id !== labelId) : [...selectedIds, labelId]);
  }

  function handleCreate() {
    if (!name.trim() || pending) return;
    startTransition(async () => {
      const result = await createLabel({ boardId, name, color });
      if (!result.ok) { toast.error(result.error); return; }
      onLabelsChange([...labels, result.data].sort((a, b) => a.name.localeCompare(b.name)));
      onChange([...selectedIds, result.data.id]);
      setName("");
      setCreating(false);
      toast.success("Label created");
    });
  }

  function handleCreateKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCreate();
    }
  }

  return <fieldset className="task-label-picker">
    <legend className="board-field-label">Labels <span>Optional</span></legend>
    {labels.length ? <div className="task-label-options">
      {labels.map((label) => <button key={label.id} type="button" className={`task-label-option ${selectedIds.includes(label.id) ? "is-selected" : ""}`} aria-pressed={selectedIds.includes(label.id)} onClick={() => toggle(label.id)}>
        <span className="task-label-option-dot" style={{ backgroundColor: label.color }} /><span>{label.name}</span>
      </button>)}
    </div> : <p className="board-label-empty task-label-empty">No labels yet.</p>}
    {creating ? <div className="task-inline-label-form">
      <Input aria-label="New label name" value={name} maxLength={24} required placeholder="Label name" onChange={(event) => setName(event.target.value)} onKeyDown={handleCreateKeyDown} />
      <div className="label-color-options" aria-label="New label color">
        {boardColors.map((item) => <button type="button" key={item} className={color === item ? "board-color-option is-selected" : "board-color-option"} aria-label={`Choose ${item} label color`} aria-pressed={color === item} onClick={() => setColor(item)}><span style={{ backgroundColor: item }} /></button>)}
      </div>
      <div className="task-inline-label-actions"><Button type="button" variant="default" disabled={pending || !name.trim()} onClick={handleCreate}><Plus size={14} /> Add label</Button><Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button></div>
    </div> : <Button type="button" variant="ghost" className="task-create-label-button" onClick={() => setCreating(true)}><Tag size={14} /> Create label</Button>}
  </fieldset>;
}
