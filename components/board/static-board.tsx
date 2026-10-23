import {
  CalendarDays,
  ChevronDown,
  Circle,
  Filter,
  Grip,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { formatDateOnly, getDueDateStatus } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Priority = "low" | "medium" | "high";

type Label = {
  name: string;
  color: string;
};

type Task = {
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  labels: Label[];
};

type BoardColumn = {
  title: string;
  color: string;
  tasks: Task[];
};

const taskLabels = {
  design: { name: "Design", color: "#7A5AF8" },
  product: { name: "Product", color: "#2E90FA" },
  research: { name: "Research", color: "#15B79E" },
  marketing: { name: "Marketing", color: "#F97316" },
  content: { name: "Content", color: "#EE46BC" },
};

const columns: BoardColumn[] = [
  {
    title: "To do",
    color: "#667085",
    tasks: [
      { title: "Map the onboarding flow", description: "Outline each step from sign up to first project", dueDate: "2026-10-20", priority: "high", labels: [taskLabels.product, taskLabels.research] },
      { title: "Collect launch requirements", description: "Gather final input from the product team", dueDate: "2026-10-24", priority: "medium", labels: [taskLabels.product] },
      { title: "Review competitor messaging", priority: "low", labels: [taskLabels.research] },
      { title: "Draft help center outline", description: "Plan the first set of support articles", priority: "low", labels: [taskLabels.content] },
    ],
  },
  {
    title: "In progress",
    color: "#2E90FA",
    tasks: [
      { title: "Design the welcome screen", description: "Explore a clear, friendly first-run experience", dueDate: "2026-10-27", priority: "high", labels: [taskLabels.design, taskLabels.product, taskLabels.marketing] },
      { title: "Write release announcement", description: "Prepare copy for the launch email and blog", dueDate: "2026-11-02", priority: "medium", labels: [taskLabels.marketing] },
      { title: "Set up product analytics", priority: "medium", labels: [taskLabels.product] },
      { title: "Prepare customer interview guide", description: "Questions for the first five user calls", priority: "low", labels: [taskLabels.research] },
    ],
  },
  {
    title: "In review",
    color: "#F97316",
    tasks: [
      { title: "Finalize brand illustrations", description: "Check scale, spacing, and color consistency", dueDate: "2026-10-23", priority: "medium", labels: [taskLabels.design] },
      { title: "QA the sign-up experience", dueDate: "2026-10-25", priority: "high", labels: [taskLabels.product, taskLabels.design] },
      { title: "Edit launch page copy", description: "Tighten headlines and clarify the call to action", priority: "low", labels: [taskLabels.content, taskLabels.marketing] },
    ],
  },
  {
    title: "Done",
    color: "#12B76A",
    tasks: [
      { title: "Agree on launch goals", description: "Align the team on the first month targets", priority: "medium", labels: [taskLabels.product] },
      { title: "Create project workspace", priority: "low", labels: [taskLabels.product] },
      { title: "Pick a launch date", dueDate: "2026-10-16", priority: "high", labels: [taskLabels.marketing] },
    ],
  },
];

function PriorityTile({ priority }: { priority: Priority }) {
  const labels: Record<Priority, string> = {
    low: "Low priority",
    medium: "Medium priority",
    high: "High priority",
  };

  return (
    <span className={`priority-tile priority-${priority}`} aria-label={labels[priority]} title={labels[priority]}>
      <span className="priority-bars" aria-hidden="true"><i /><i /><i /></span>
    </span>
  );
}

function TaskCard({ task }: { task: Task }) {
  const firstLabelColor = task.labels[0]?.color ?? "#D0D5DD";
  const dueStatus = task.dueDate ? getDueDateStatus(task.dueDate) : null;

  return (
    <article className="kanban-task-card" tabIndex={0}>
      <div className="task-card-heading">
        <span className="task-label-marker" style={{ backgroundColor: `${firstLabelColor}1A`, color: firstLabelColor }} aria-hidden="true">
          <Circle size={11} fill="currentColor" strokeWidth={1.4} />
        </span>
        <h3 title={task.title}>{task.title}</h3>
        <button className="icon-button task-menu-button" type="button" aria-label={`More options for ${task.title}`}>
          <MoreHorizontal size={17} />
        </button>
      </div>

      {task.description && <p className="task-card-description" title={task.description}>{task.description}</p>}

      {task.dueDate && (
        <p className={`task-card-due ${dueStatus ? `due-${dueStatus}` : ""}`}>
          <CalendarDays size={14} aria-hidden="true" />
          <span>{formatDateOnly(task.dueDate)}</span>
          {dueStatus === "overdue" && <span className="due-state-label">Overdue</span>}
          {dueStatus === "soon" && <span className="due-state-label">Due soon</span>}
        </p>
      )}

      <div className="task-card-divider" />
      <div className="task-card-footer">
        <PriorityTile priority={task.priority} />
        <div className="task-label-list">
          {task.labels.slice(0, 2).map((label) => (
            <span className="task-label-pill" key={label.name}>
              <span style={{ backgroundColor: label.color }} />{label.name}
            </span>
          ))}
          {task.labels.length > 2 && <span className="task-label-overflow">+{task.labels.length - 2}</span>}
        </div>
      </div>
    </article>
  );
}

function KanbanColumn({ column }: { column: BoardColumn }) {
  return (
    <section className="kanban-column" aria-label={`${column.title}, ${column.tasks.length} tasks`}>
      <header className="kanban-column-header">
        <button className="column-grip" type="button" aria-label={`Drag ${column.title} column`}>
          <Grip size={16} />
        </button>
        <span className="column-name-pill" style={{ backgroundColor: column.color }}>{column.title}</span>
        <span className="kanban-task-count">{column.tasks.length}</span>
        <span className="column-header-spacer" />
        <button className="icon-button column-menu-button" type="button" aria-label={`More options for ${column.title}`}>
          <MoreHorizontal size={17} />
        </button>
        <button className="icon-button column-add-button" type="button" aria-label={`Add task to ${column.title}`}>
          <Plus size={17} />
        </button>
      </header>
      <div className="kanban-column-cards">
        {column.tasks.map((task) => <TaskCard task={task} key={task.title} />)}
      </div>
    </section>
  );
}

export function StaticBoard() {
  return (
    <>
      <section className="board-toolbar" aria-label="Board actions">
        <label className="board-search">
          <Search size={16} aria-hidden="true" />
          <Input id="task-search" type="search" placeholder="Search tasks" aria-label="Search tasks" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="board-toolbar-actions">
          <Button type="button" variant="outline" className="settings-button"><Settings2 size={16} /> Settings</Button>
          <div className="add-new-split">
            <Button type="button" variant="default" className="add-new-main"><Plus size={16} /> Add new</Button>
            <Button type="button" variant="default" size="icon" className="add-new-chevron" aria-label="More add options"><ChevronDown size={15} /></Button>
          </div>
        </div>
      </section>

      <section className="board-subtoolbar" aria-label="Task filters">
        <div className="active-filter-list">
          <span className="active-filter-chip">Priority: High <button type="button" aria-label="Remove priority filter"><X size={12} /></button></span>
          <span className="active-filter-chip">Due date: This week <button type="button" aria-label="Remove due date filter"><X size={12} /></button></span>
          <button className="clear-filters" type="button">Clear all</button>
        </div>
        <Button type="button" variant="outline" className="filter-button"><Filter size={15} /> Filter <span className="filter-count">2</span></Button>
      </section>

      <section className="kanban-board" aria-label="Product Launch board columns">
        {columns.map((column) => <KanbanColumn column={column} key={column.title} />)}
        <button type="button" className="add-column-ghost"><Plus size={17} /> Add column</button>
      </section>
    </>
  );
}
