"use client";

import {
  ChevronDown,
  ChevronsLeft,
  CircleHelp,
  Compass,
  LayoutGrid,
  Menu,
  PanelLeft,
  Plus,
  Search,
  SquareKanban,
  Users,
  X,
} from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense, useState, type ReactNode } from "react";
import { BoardDialog } from "@/components/board/board-dialog";
import { BoardSharePopover } from "@/components/board/board-share-popover";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { BoardDisplaySummary, BoardSummary } from "@/lib/boards";

function AuthControl({ inSidebar = false }: { inSidebar?: boolean }) {
  return (
    <Suspense fallback={<span className="user-button-fallback" aria-hidden="true" />}>
      <Show when="signed-in">
        {inSidebar ? <div className="sidebar-account-control"><UserButton /><span>Account</span></div> : <UserButton />}
      </Show>
      <Show when="signed-out">
        <div className={inSidebar ? "sidebar-auth" : "rail-auth"}>
          <SignInButton mode="redirect"><button type="button" className="auth-link">Sign in</button></SignInButton>
          <SignUpButton mode="redirect"><button type="button" className="auth-link">Sign up</button></SignUpButton>
        </div>
      </Show>
    </Suspense>
  );
}

function SidebarContents({
  onCollapse,
  boards,
  currentBoard,
  canCreateBoard,
  pageTitle,
}: {
  onCollapse: () => void;
  boards: BoardSummary[];
  currentBoard?: BoardDisplaySummary;
  canCreateBoard: boolean;
  pageTitle: string;
}) {
  const switcherBoard = currentBoard ?? boards[0];

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="board-switcher" type="button" aria-label={switcherBoard ? `Switch boards, current board ${switcherBoard.title}` : "No boards available"}>
            <span className="switcher-top">
              <span className="board-avatar" style={{ backgroundColor: switcherBoard?.color ?? "var(--primary)" }}>
                {switcherBoard?.title.slice(0, 1).toUpperCase() ?? "T"}
              </span>
              <span className="switcher-name-group">
                <span className="switcher-name">{switcherBoard?.title ?? pageTitle}</span>
                <span className="switcher-visibility"><span className="privacy-dot" /> {switcherBoard ? `${switcherBoard.visibility} board` : "Start a board"}</span>
              </span>
              <ChevronDown size={15} className="switcher-chevron" />
            </span>
            <span className="switcher-stats">
              <span><SquareKanban size={13} /> <b>{switcherBoard?.columnCount ?? 0}</b><small>columns</small></span>
              <span><LayoutGrid size={13} /> <b>{switcherBoard?.taskCount ?? 0}</b><small>tasks</small></span>
              <span><CircleHelp size={13} /> <b className="overdue-number">{switcherBoard?.overdueCount ?? 0}</b><small>overdue</small></span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="board-switcher-menu">
          {boards.map((board) => (
            <DropdownMenuItem asChild key={board.id}>
              <Link href={`/boards/${board.id}`} className="board-switcher-option">
                <span className="board-list-icon" style={{ backgroundColor: board.color }}>{board.title.slice(0, 1).toUpperCase()}</span>
                <span>{board.title}</span>
              </Link>
            </DropdownMenuItem>
          ))}
          {!boards.length && <p className="board-switcher-empty">{canCreateBoard ? "Create a board to get started." : "Sign in to create your own board."}</p>}
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <Link className={!currentBoard && pageTitle !== "Explore" ? "sidebar-nav-link active" : "sidebar-nav-link"} href="/boards">
          <LayoutGrid size={17} strokeWidth={1.7} /> <span>All Boards</span>
        </Link>
        <Link className={pageTitle === "Explore" ? "sidebar-nav-link active" : "sidebar-nav-link"} href="/explore">
          <Compass size={17} strokeWidth={1.7} /> <span>Explore</span>
        </Link>
      </nav>

      <div className="sidebar-section-heading">
        <span><ChevronDown size={14} /> Boards</span>
        <span className="sidebar-section-actions">
          {canCreateBoard && <Show when="signed-in"><BoardDialog trigger={<button type="button" aria-label="Create board"><Plus size={16} /></button>} /></Show>}
        </span>
      </div>
      <nav className="board-list" aria-label="Your boards">
        {boards.map((board) => (
          <Link className={currentBoard?.id === board.id ? "board-list-link active" : "board-list-link"} href={`/boards/${board.id}`} key={board.id}>
            <span className="board-list-icon" style={{ backgroundColor: board.color }}>{board.title.slice(0, 1).toUpperCase()}</span>
            <span>{board.title}</span>
            {currentBoard?.id === board.id && <span className="board-active-mark" />}
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom-note"><Users size={15} /> <span>Work together, stay on track.</span></div>
      <div className="sidebar-mobile-auth"><AuthControl inSidebar /></div>
    </>
  );
}

function BoardRail({
  boards,
  currentBoard,
  canCreateBoard,
  onOpenSidebar,
}: {
  boards: BoardSummary[];
  currentBoard?: BoardDisplaySummary;
  canCreateBoard: boolean;
  onOpenSidebar: () => void;
}) {
  return (
    <aside className="app-rail" aria-label="Recent boards">
      <button className="rail-menu-button" type="button" onClick={onOpenSidebar} aria-label="Open sidebar"><PanelLeft size={17} /></button>
      <div className="rail-board-list">
        {boards.slice(0, 5).map((board) => (
          <Link
            className={currentBoard?.id === board.id ? "rail-board active" : "rail-board"}
            href={`/boards/${board.id}`}
            key={board.id}
            title={board.title}
            aria-label={board.title}
          >
            <span style={{ backgroundColor: board.color }}>{board.title.slice(0, 1).toUpperCase()}</span>
          </Link>
        ))}
      </div>
      <div className="rail-divider" />
      {canCreateBoard && <Show when="signed-in"><BoardDialog trigger={<button className="rail-create" type="button" aria-label="Create board"><Plus size={18} /></button>} /></Show>}
      <div className="rail-bottom-spacer" />
      <div className="rail-user"><AuthControl /></div>
    </aside>
  );
}

export function AppShell({
  children,
  boards,
  currentBoard,
  pageTitle = "Your boards",
  canManageBoard = false,
  canCreateBoard = false,
}: {
  children: ReactNode;
  boards: BoardSummary[];
  currentBoard?: BoardDisplaySummary;
  pageTitle?: string;
  canManageBoard?: boolean;
  canCreateBoard?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  function focusTaskSearch() {
    document.getElementById("task-search")?.focus();
  }

  return (
    <div className="app-shell" data-sidebar-open={sidebarOpen}>
      <a className="skip-to-content" href="#main-content">Skip to content</a>
      <BoardRail boards={boards} currentBoard={currentBoard} canCreateBoard={canCreateBoard} onOpenSidebar={() => setSidebarOpen(true)} />
      <aside className={sidebarOpen ? "app-sidebar is-visible" : "app-sidebar"} aria-label="Board sidebar">
        <SidebarContents onCollapse={() => setSidebarOpen(false)} boards={boards} currentBoard={currentBoard} canCreateBoard={canCreateBoard} pageTitle={pageTitle} />
      </aside>
      <button
        type="button"
        className={sidebarOpen ? "sidebar-backdrop is-visible" : "sidebar-backdrop"}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
        tabIndex={sidebarOpen ? 0 : -1}
      />
      <main className="app-main" id="main-content" tabIndex={-1}>
        <header className="board-header">
          <div className="board-heading">
            <button className="mobile-menu-button" type="button" onClick={() => setMobileSheetOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
            <button className="desktop-sidebar-button" type="button" onClick={() => setSidebarOpen((open) => !open)} aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}><PanelLeft size={17} /></button>
            <span className="header-board-mark" style={currentBoard ? { backgroundColor: `${currentBoard.color}1A`, color: currentBoard.color } : undefined}><SquareKanban size={18} /></span>
            <h1>{currentBoard?.title ?? pageTitle}</h1>
            {currentBoard && <span className="visibility-badge"><span className="privacy-dot" /> {currentBoard.visibility}</span>}
          </div>
          {currentBoard && (
            <div className="header-actions">
              <Button type="button" variant="outline" size="icon" className="header-icon-button" onClick={focusTaskSearch} aria-label="Focus task search"><Search size={16} /></Button>
              {canManageBoard && <BoardSharePopover board={currentBoard} />}
            </div>
          )}
        </header>
        {children}
      </main>
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent className="mobile-navigation-sheet" aria-label="Navigation">
          <div className="mobile-sheet-heading">
            <span>Navigation</span>
            <button type="button" className="icon-button" onClick={() => setMobileSheetOpen(false)} aria-label="Close navigation"><X size={17} /></button>
          </div>
          <SidebarContents onCollapse={() => setMobileSheetOpen(false)} boards={boards} currentBoard={currentBoard} canCreateBoard={canCreateBoard} pageTitle={pageTitle} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
