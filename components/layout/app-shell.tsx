"use client";

import {
  BarChart3,
  ChevronDown,
  ChevronsLeft,
  CircleHelp,
  Compass,
  LayoutGrid,
  Menu,
  PanelLeft,
  Plus,
  Search,
  Settings2,
  Share2,
  SquareKanban,
  Users,
  X,
} from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const recentBoards = [
  { name: "Product Launch", color: "#1570EF" },
  { name: "Website Redesign", color: "#7A5AF8" },
  { name: "Marketing Plan", color: "#12B76A" },
  { name: "Team Roadmap", color: "#F97316" },
  { name: "Personal", color: "#EE46BC" },
];

const boardList = [
  { name: "Product Launch", color: "#1570EF" },
  { name: "Website Redesign", color: "#7A5AF8" },
  { name: "Marketing Plan", color: "#12B76A" },
];

function AuthControl({ inSidebar = false }: { inSidebar?: boolean }) {
  return (
    <Suspense fallback={<span className="user-button-fallback" aria-hidden="true" />}>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <div className={inSidebar ? "sidebar-auth" : "rail-auth"}>
          <SignInButton mode="redirect">
            <button type="button" className="auth-link">Sign in</button>
          </SignInButton>
          <SignUpButton mode="redirect">
            <button type="button" className="auth-link">Sign up</button>
          </SignUpButton>
        </div>
      </Show>
    </Suspense>
  );
}

function SidebarContents({ onCollapse }: { onCollapse: () => void }) {
  return (
    <>
      <div className="sidebar-brand">
        <div className="brand-mark"><SquareKanban size={19} strokeWidth={1.7} /></div>
        <div className="brand-copy">
          <span className="brand-name">TaskBoard</span>
          <span className="brand-subtitle">Organize your work</span>
        </div>
        <button className="sidebar-collapse" type="button" onClick={onCollapse} aria-label="Collapse sidebar">
          <ChevronsLeft size={17} />
        </button>
      </div>

      <button className="board-switcher" type="button" aria-label="Current board: Product Launch, private">
        <span className="switcher-top">
          <span className="board-avatar" style={{ backgroundColor: "#1570EF" }}>P</span>
          <span className="switcher-name-group">
            <span className="switcher-name">Product Launch</span>
            <span className="switcher-visibility"><span className="privacy-dot" /> Private board</span>
          </span>
          <ChevronDown size={15} className="switcher-chevron" />
        </span>
        <span className="switcher-stats">
          <span><SquareKanban size={13} /> <b>4</b><small>columns</small></span>
          <span><LayoutGrid size={13} /> <b>18</b><small>tasks</small></span>
          <span><CircleHelp size={13} /> <b className="overdue-number">2</b><small>overdue</small></span>
        </span>
      </button>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <Link className="sidebar-nav-link" href="/boards">
          <LayoutGrid size={17} strokeWidth={1.7} /> <span>All Boards</span>
        </Link>
        <Link className="sidebar-nav-link" href="/explore">
          <Compass size={17} strokeWidth={1.7} /> <span>Explore</span>
        </Link>
      </nav>

      <div className="sidebar-section-heading">
        <span><ChevronDown size={14} /> Boards</span>
        <span className="sidebar-section-actions">
          <button type="button" aria-label="More board options">···</button>
          <button type="button" aria-label="Create board"><Plus size={16} /></button>
        </span>
      </div>
      <nav className="board-list" aria-label="Your boards">
        {boardList.map((board, index) => (
          <Link className={index === 0 ? "board-list-link active" : "board-list-link"} href="/" key={board.name}>
            <span className="board-list-icon" style={{ backgroundColor: board.color }}>{board.name.slice(0, 1)}</span>
            <span>{board.name}</span>
            {index === 0 && <span className="board-active-mark" />}
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom-note">
        <Users size={15} /> <span>Work together, stay on track.</span>
      </div>
      <div className="sidebar-mobile-auth"><AuthControl inSidebar /></div>
    </>
  );
}

function BoardRail({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <aside className="app-rail" aria-label="Recent boards">
      <button className="rail-menu-button" type="button" onClick={onOpenSidebar} aria-label="Open sidebar">
        <PanelLeft size={17} />
      </button>
      <div className="rail-board-list">
        {recentBoards.map((board, index) => (
          <Link
            className={index === 0 ? "rail-board active" : "rail-board"}
            href="/"
            key={board.name}
            title={board.name}
            aria-label={board.name}
          >
            <span style={{ backgroundColor: board.color }}>{board.name.slice(0, 1)}</span>
          </Link>
        ))}
      </div>
      <div className="rail-divider" />
      <button className="rail-create" type="button" aria-label="Create board"><Plus size={18} /></button>
      <div className="rail-bottom-spacer" />
      <div className="rail-user"><AuthControl /></div>
    </aside>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  function focusTaskSearch() {
    document.getElementById("task-search")?.focus();
  }

  return (
    <div className="app-shell" data-sidebar-open={sidebarOpen}>
      <BoardRail onOpenSidebar={() => setSidebarOpen(true)} />

      <aside className={sidebarOpen ? "app-sidebar is-visible" : "app-sidebar"} aria-label="Board sidebar">
        <SidebarContents onCollapse={() => setSidebarOpen(false)} />
      </aside>

      <button
        type="button"
        className={sidebarOpen ? "sidebar-backdrop is-visible" : "sidebar-backdrop"}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
        tabIndex={sidebarOpen ? 0 : -1}
      />

      <main className="app-main">
        <header className="board-header">
          <div className="board-heading">
            <button className="mobile-menu-button" type="button" onClick={() => setMobileSheetOpen(true)} aria-label="Open navigation">
              <Menu size={19} />
            </button>
            <button className="desktop-sidebar-button" type="button" onClick={() => setSidebarOpen((open) => !open)} aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
              <PanelLeft size={17} />
            </button>
            <span className="header-board-mark"><SquareKanban size={18} /></span>
            <h1>Product Launch</h1>
            <span className="visibility-badge"><span className="privacy-dot" /> Private</span>
          </div>
          <div className="header-actions">
            <Button type="button" variant="outline" size="icon" className="header-icon-button" onClick={focusTaskSearch} aria-label="Focus task search">
              <Search size={16} />
            </Button>
            <Button type="button" variant="outline" size="icon" className="header-icon-button" aria-label="Share board">
              <Share2 size={16} />
            </Button>
          </div>
        </header>
        {children}
      </main>

      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent className="mobile-navigation-sheet" aria-label="Navigation">
          <div className="mobile-sheet-heading">
            <span>Navigation</span>
            <button type="button" className="icon-button" onClick={() => setMobileSheetOpen(false)} aria-label="Close navigation"><X size={17} /></button>
          </div>
          <SidebarContents onCollapse={() => setMobileSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
