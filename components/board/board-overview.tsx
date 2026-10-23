"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { endOfWeek, isToday, isWithinInterval, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { Filter, Plus, Search, SquareKanban, X } from "lucide-react";
import { moveColumn, moveTask } from "@/actions/ordering";
import { createTask, deleteTask, updateTask, type TaskActionResult } from "@/actions/tasks";
import { BoardColumns } from "@/components/board/board-columns";
import { BoardDialog } from "@/components/board/board-dialog";
import { ColumnDialog } from "@/components/board/column-dialog";
import { DeleteBoardDialog } from "@/components/board/delete-board-dialog";
import { DeleteTaskDialog } from "@/components/board/delete-task-dialog";
import { TaskDialog } from "@/components/board/task-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getDueDateStatus, parseDateOnly } from "@/lib/dates";
import type { BoardDisplaySummary } from "@/lib/boards";
import type { ColumnSummary } from "@/lib/columns";
import type { TaskFormValues } from "@/lib/validation/tasks";
import type { LabelRow, TaskWithLabels } from "@/types/database";

export function BoardOverview({ board, columns: initialColumns, labels: initialLabels, canEdit = true, signedIn = true }: { board: BoardDisplaySummary; columns: ColumnSummary[]; labels: LabelRow[]; canEdit?: boolean; signedIn?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [columns, setColumns] = useState(initialColumns);
  const [labels, setLabels] = useState(initialLabels);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithLabels>();
  const [deletingTask, setDeletingTask] = useState<TaskWithLabels>();
  const [newColumnOpen, setNewColumnOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("q") ?? "");
  const searchRef = useRef<HTMLInputElement>(null);
  const query = searchParams.get("q")?.trim() ?? "";
  const urlQuery = searchParams.get("q") ?? "";
  const priorities = (searchParams.get("priority") ?? "").split(",").filter((value): value is TaskWithLabels["priority"] => value === "low" || value === "medium" || value === "high");
  const selectedLabelIds = (searchParams.get("labels") ?? "").split(",").filter(Boolean);
  const dueFilter = searchParams.get("due") && ["overdue", "today", "week", "none"].includes(searchParams.get("due") ?? "") ? searchParams.get("due") : null;
  const activeFilterCount = priorities.length + selectedLabelIds.length + (dueFilter ? 1 : 0);

  // Keep the input in sync with browser back/forward navigation.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSearchDraft(urlQuery), [urlQuery]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      const value = searchDraft.trim();
      if (value) next.set("q", value); else next.delete("q");
      if (next.toString() !== searchParams.toString()) router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [searchDraft, searchParams, pathname, router]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function updateParams(update: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    update(next);
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  }

  function setPriority(priority: TaskWithLabels["priority"], enabled: boolean) {
    const nextValues = new Set(priorities);
    if (enabled) nextValues.add(priority); else nextValues.delete(priority);
    updateParams((params) => nextValues.size ? params.set("priority", ["high", "medium", "low"].filter((value) => nextValues.has(value as TaskWithLabels["priority"])).join(",")) : void params.delete("priority"));
  }

  function setLabel(labelId: string, enabled: boolean) {
    const nextValues = new Set(selectedLabelIds);
    if (enabled) nextValues.add(labelId); else nextValues.delete(labelId);
    updateParams((params) => nextValues.size ? params.set("labels", [...nextValues].join(",")) : void params.delete("labels"));
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const visibleColumns = columns.map((column) => {
    const tasks = column.tasks.filter((task) => {
      const matchesQuery = !normalizedQuery || `${task.title} ${task.description ?? ""}`.toLocaleLowerCase().includes(normalizedQuery);
      const matchesPriority = priorities.length === 0 || priorities.includes(task.priority);
      const matchesLabels = selectedLabelIds.length === 0 || task.labels.some((label) => selectedLabelIds.includes(label.id));
      const due = task.due_date ? parseDateOnly(task.due_date) : null;
      const matchesDue = !dueFilter || (dueFilter === "overdue" ? Boolean(task.due_date && getDueDateStatus(task.due_date) === "overdue") : dueFilter === "today" ? Boolean(due && isToday(due)) : dueFilter === "week" ? Boolean(due && isWithinInterval(due, { start: weekStart, end: weekEnd })) : !task.due_date);
      return matchesQuery && matchesPriority && matchesLabels && matchesDue;
    });
    return { ...column, tasks, taskCount: tasks.length };
  });
  const noMatches = columns.some((column) => column.tasks.length > 0) && visibleColumns.every((column) => column.tasks.length === 0);
  const dragDisabled = Boolean(query || activeFilterCount);
  const dragDisabledReason = query ? "Clear search to reorder tasks." : activeFilterCount ? "Clear filters to reorder tasks." : undefined;

  function replaceTask(task: TaskWithLabels) {
    setColumns((current) => current.map((column) => {
      if (column.id !== task.column_id) return column;
      const exists = column.tasks.some((item) => item.id === task.id);
      return { ...column, tasks: exists ? column.tasks.map((item) => item.id === task.id ? task : item) : [...column.tasks, task], taskCount: exists ? column.taskCount : column.taskCount + 1 };
    }));
  }

  async function saveTask(values: TaskFormValues, task?: TaskWithLabels): Promise<TaskActionResult> {
    const columnId = task?.column_id ?? values.columnId;
    const snapshot = columns;
    const optimisticTask: TaskWithLabels = {
      id: task?.id ?? `optimistic-${crypto.randomUUID()}`,
      board_id: board.id,
      column_id: columnId,
      title: values.title.trim(),
      description: values.description || null,
      priority: values.priority,
      due_date: values.dueDate || null,
      position: task?.position ?? `z${Date.now()}`,
      created_by: task?.created_by ?? null,
      created_at: task?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
      labels: labels.filter((label) => values.labelIds.includes(label.id)),
    };

    if (task) {
      setColumns((current) => current.map((column) => ({ ...column, tasks: column.tasks.map((item) => item.id === task.id ? optimisticTask : item) })));
    } else {
      setColumns((current) => current.map((column) => column.id === columnId ? { ...column, taskCount: column.taskCount + 1, tasks: [...column.tasks, optimisticTask] } : column));
    }

    const result = task
      ? await updateTask({ boardId: board.id, taskId: task.id, title: values.title, description: values.description, priority: values.priority, dueDate: values.dueDate, labelIds: values.labelIds })
      : await createTask({ ...values, boardId: board.id, columnId });

    if (!result.ok) {
      setColumns(snapshot);
      return result;
    }
    replaceTask(result.data);
    router.refresh();
    return result;
  }

  async function quickAdd(columnId: string, title: string) {
    const snapshot = columns;
    const optimisticTask: TaskWithLabels = {
      id: `optimistic-${crypto.randomUUID()}`, board_id: board.id, column_id: columnId,
      title, description: null, priority: "medium", due_date: null, position: `z${Date.now()}`,
      created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      labels: [],
    };
    setColumns((current) => current.map((column) => column.id === columnId ? { ...column, taskCount: column.taskCount + 1, tasks: [...column.tasks, optimisticTask] } : column));
    const result = await createTask({ boardId: board.id, columnId, title, description: "", priority: "medium", dueDate: "", labelIds: [] });
    if (!result.ok) {
      setColumns(snapshot);
      toast.error(result.error);
      return false;
    }
    replaceTask(result.data);
    router.refresh();
    return true;
  }

  async function removeTask(task: TaskWithLabels) {
    const snapshot = columns;
    setColumns((current) => current.map((column) => column.id === task.column_id
      ? { ...column, taskCount: Math.max(0, column.taskCount - 1), tasks: column.tasks.filter((item) => item.id !== task.id) }
      : column));
    const result = await deleteTask({ boardId: board.id, taskId: task.id });
    if (!result.ok) {
      setColumns(snapshot);
      toast.error(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  return <>
    <section className="board-toolbar board-overview-toolbar" aria-label="Board actions">
      <label className="board-search">
        <Search size={16} aria-hidden="true" />
        <input ref={searchRef} className="ui-input" id="task-search" type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search tasks" aria-label="Search tasks" />
        <kbd>⌘ K</kbd>
      </label>
      <div className="board-toolbar-actions">
        {!canEdit && <span className="view-only-badge">View only</span>}
        {canEdit && <>
        <div className="add-new-split">
          <Button type="button" variant="default" className="add-new-main" disabled={!columns.length} onClick={() => { setEditingTask(undefined); setTaskOpen(true); }}><Plus size={15} /> New task</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button type="button" variant="default" className="add-new-chevron" aria-label="More add options"><span aria-hidden="true">⌄</span></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!columns.length} onSelect={() => { setEditingTask(undefined); setTaskOpen(true); }}>New task</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setNewColumnOpen(true)}>New column</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ColumnDialog boardId={board.id} mode="create" open={newColumnOpen} onOpenChange={setNewColumnOpen} />
        <BoardDialog board={board} labels={labels} onLabelsChange={(nextLabels) => {
          setLabels(nextLabels);
          const labelsById = new Map(nextLabels.map((label) => [label.id, label]));
          setColumns((current) => current.map((column) => ({ ...column, tasks: column.tasks.map((task) => ({ ...task, labels: task.labels.flatMap((label) => labelsById.has(label.id) ? [labelsById.get(label.id)!] : []) })) })));
        }} trigger={<Button type="button" variant="outline">Board settings</Button>} />
        <DeleteBoardDialog board={board} redirectAfterDelete trigger={<Button type="button" variant="outline" className="danger-outline">Delete board</Button>} />
        </>}
      </div>
    </section>
    {!signedIn && <div className="view-only-signin-prompt">Sign in to create your own board. <Link href="/sign-in">Sign in</Link></div>}
    <section className="board-subtoolbar" aria-label="Task filters">
      <div className="active-filter-list">
        {priorities.map((priority) => <span className="active-filter-chip" key={`priority-${priority}`}>Priority: {priority}<button type="button" aria-label={`Remove ${priority} priority filter`} onClick={() => setPriority(priority, false)}><X size={12} /></button></span>)}
        {selectedLabelIds.map((id) => { const label = labels.find((item) => item.id === id); return <span className="active-filter-chip" key={`label-${id}`}>Label: {label?.name ?? "Unknown"}<button type="button" aria-label={`Remove ${label?.name ?? "label"} filter`} onClick={() => setLabel(id, false)}><X size={12} /></button></span>; })}
        {dueFilter && <span className="active-filter-chip">Due: {dueFilter === "week" ? "This week" : dueFilter === "none" ? "No due date" : dueFilter === "today" ? "Today" : "Overdue"}<button type="button" aria-label="Remove due date filter" onClick={() => updateParams((params) => { params.delete("due"); })}><X size={12} /></button></span>}
        {activeFilterCount > 0 && <button className="clear-filters" type="button" onClick={() => updateParams((params) => { params.delete("priority"); params.delete("labels"); params.delete("due"); })}>Clear all</button>}
        {activeFilterCount === 0 && <span className="filter-summary-muted">{query ? "Search results" : "All tasks"}</span>}
      </div>
      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild><Button type="button" variant="outline" className="filter-button"><Filter size={15} /> Filter{activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}</Button></PopoverTrigger>
        <PopoverContent align="end" className="task-filter-popover">
          <div className="filter-popover-heading"><strong>Filter tasks</strong><span>{activeFilterCount ? `${activeFilterCount} active` : "Choose filters"}</span></div>
          <fieldset className="filter-group"><legend>Priority</legend>{(["high", "medium", "low"] as const).map((priority) => <label className="filter-option" key={priority}><input type="checkbox" checked={priorities.includes(priority)} onChange={(event) => setPriority(priority, event.target.checked)} /> <span className={`priority-dot priority-dot-${priority}`} /> {priority[0].toUpperCase() + priority.slice(1)}</label>)}</fieldset>
          <fieldset className="filter-group"><legend>Labels</legend>{labels.length ? labels.map((label) => <label className="filter-option" key={label.id}><input type="checkbox" checked={selectedLabelIds.includes(label.id)} onChange={(event) => setLabel(label.id, event.target.checked)} /><span className="filter-label-dot" style={{ backgroundColor: label.color }} />{label.name}</label>) : <p className="filter-empty">No labels on this board.</p>}</fieldset>
          <fieldset className="filter-group"><legend>Due date</legend>{([["overdue", "Overdue"], ["today", "Today"], ["week", "This week"], ["none", "No due date"]] as const).map(([value, label]) => <label className="filter-option" key={value}><input type="radio" name="due-filter" checked={dueFilter === value} onChange={() => updateParams((params) => { params.set("due", value); })} />{label}</label>)}</fieldset>
          {activeFilterCount > 0 && <button className="filter-popover-clear" type="button" onClick={() => updateParams((params) => { params.delete("priority"); params.delete("labels"); params.delete("due"); })}>Clear filters</button>}
        </PopoverContent>
      </Popover>
    </section>
    {noMatches && <div className="board-no-matches" role="status">{query ? "No tasks match your search." : "No tasks match these filters."}</div>}
    {columns.length ? <BoardColumns boardId={board.id} columns={visibleColumns} readOnly={!canEdit} dragDisabled={dragDisabled || !canEdit} dragDisabledReason={dragDisabledReason} onColumnsChange={setColumns} onQuickAdd={quickAdd} onEditTask={(task) => { setEditingTask(task); setTaskOpen(true); }} onDeleteTask={setDeletingTask}
      onMoveTask={async (taskId, columnId, previousId, nextId, snapshot) => {
        const result = await moveTask({ boardId: board.id, taskId, columnId, previousId, nextId });
        if (!result.ok) { setColumns(snapshot); toast.error(result.error); } else router.refresh();
      }}
      onMoveColumn={async (columnId, previousId, nextId, snapshot) => {
        const result = await moveColumn({ boardId: board.id, columnId, previousId, nextId });
        if (!result.ok) { setColumns(snapshot); toast.error(result.error); } else router.refresh();
      }} /> : (
      <section className="board-detail-empty">
        <span className="boards-empty-icon"><SquareKanban size={23} /></span>
        <h2>{canEdit ? "Your board is ready" : "This board is empty"}</h2><p>{canEdit ? "Create your first column to start organizing tasks." : "The owner has not added any columns yet."}</p>
        {canEdit && <ColumnDialog boardId={board.id} mode="create" trigger={<Button type="button" variant="default"><Plus size={16} /> Create your first column</Button>} />}
      </section>
    )}
    {canEdit && <TaskDialog key={`${editingTask?.id ?? "new-task"}-${taskOpen ? "open" : "closed"}`} boardId={board.id} columns={columns.map(({ id, title }) => ({ id, title }))} labels={labels} onLabelsChange={setLabels} task={editingTask} open={taskOpen} onOpenChange={(open) => { setTaskOpen(open); if (!open) setEditingTask(undefined); }} onSave={saveTask} />}
    {canEdit && <DeleteTaskDialog task={deletingTask} open={Boolean(deletingTask)} onOpenChange={(open) => { if (!open) setDeletingTask(undefined); }} onDelete={removeTask} />}
  </>;
}
