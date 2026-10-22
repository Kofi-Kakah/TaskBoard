import { CalendarDays, ChartNoAxesColumnIncreasing, Grip, MoreHorizontal, Plus, Settings2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const palette = ["#667085", "#2e90fa", "#f97316", "#12b76a", "#f04438", "#7a5af8", "#ee46bc", "#15b79e"];

export default function DesignPreviewPage() {
  return (
    <main className="preview-shell">
      <header className="preview-heading">
        <h1>TaskBoard design preview</h1>
        <p>Foundation components and task card styling based on the written project design specs.</p>
      </header>
      <div className="preview-layout">
        <section className="preview-section" aria-labelledby="components-heading">
          <h2 id="components-heading">Controls and tokens</h2>
          <div className="preview-row">
            <Button variant="default">Add New <span aria-hidden="true">⌄</span></Button>
            <Button><Settings2 size={16} aria-hidden="true" />Settings</Button>
          </div>
          <label className="preview-label" htmlFor="demo-input">Search tasks</label>
          <Input id="demo-input" placeholder="Search tasks" />
          <div className="preview-row" style={{ marginTop: 16 }}>
            <Badge>Private</Badge>
            <Badge className="ui-badge-blue">In progress</Badge>
            <Badge className="ui-badge-green">Complete</Badge>
          </div>
          <div className="preview-row">
            <span className="pill">Landing Page</span>
            <span className="pill">+2</span>
          </div>
          <h2>Board colors</h2>
          <div className="swatch-row" aria-label="Board color palette">
            {palette.map((color) => <span key={color} className="swatch" style={{ backgroundColor: color }} />)}
          </div>
        </section>

        <section className="preview-section" aria-labelledby="column-heading">
          <h2 id="column-heading">Sample column and task</h2>
          <div className="demo-column">
            <div className="column-head">
              <Grip className="drag-grip" size={16} aria-hidden="true" />
              <span className="column-pill">In Progress</span>
              <span className="task-count">3</span>
              <span className="column-spacer" />
              <button className="icon-button" aria-label="Column options"><MoreHorizontal size={16} /></button>
              <button className="icon-button" aria-label="Add task"><Plus size={16} /></button>
            </div>
            <article className="task-card">
              <div className="task-title-row">
                <span className="task-icon" aria-hidden="true"><Sparkles size={13} /></span>
                <span className="task-title">Finalize onboarding flow</span>
                <button className="icon-button" aria-label="Task options"><MoreHorizontal size={16} /></button>
              </div>
              <p className="task-description">Review the new user steps and polish the handoff.</p>
              <p className="task-due"><CalendarDays size={14} aria-hidden="true" /> &nbsp;Feb 25, 2025</p>
              <div className="task-divider" />
              <div className="task-footer">
                <span className="priority-tile" aria-label="High priority"><ChartNoAxesColumnIncreasing size={16} /></span>
                <span className="pill">Product</span>
                <span className="pill">Research</span>
                <span className="pill">+1</span>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
