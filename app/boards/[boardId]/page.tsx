import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BoardOverview } from "@/components/board/board-overview";
import { getOwnedBoards, getVisibleBoard } from "@/lib/boards";
import { getBoardColumns } from "@/lib/columns";
import { getBoardLabels } from "@/lib/labels";
import { boardIdSchema } from "@/lib/validation/boards";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { userId } = await auth();
  const { boardId } = await params;
  const parsedId = boardIdSchema.safeParse(boardId);
  if (!parsedId.success) notFound();

  const [boardResult, ownedBoardsResult] = await Promise.all([
    getVisibleBoard(userId, parsedId.data),
    userId ? getOwnedBoards(userId) : Promise.resolve(null),
  ]);
  if (!boardResult.ok) {
    if (boardResult.error === "not-found") notFound();
    return (
      <AppShell boards={ownedBoardsResult?.ok ? ownedBoardsResult.data : []} pageTitle="Board unavailable" canCreateBoard={Boolean(userId)}>
        <section className="boards-content-state" role="alert">
          <h2>Board could not load</h2>
          <p>{boardResult.error}</p>
          <Link className="ui-button" href={`/boards/${parsedId.data}`}>Retry</Link>
        </section>
      </AppShell>
    );
  }

  const board = boardResult.data.board;
  const canEdit = boardResult.data.canEdit;
  const ownedBoards = ownedBoardsResult?.ok ? ownedBoardsResult.data : [];
  const [columnsResult, labelsResult] = await Promise.all([getBoardColumns(board.id), getBoardLabels(board.id)]);
  if (!columnsResult.ok || !labelsResult.ok) {
    return (
      <AppShell boards={ownedBoards} currentBoard={board} canManageBoard={canEdit} canCreateBoard={Boolean(userId)}>
        <section className="boards-content-state" role="alert">
          <h2>Board contents could not load</h2>
          <p>{!columnsResult.ok ? columnsResult.error : !labelsResult.ok ? labelsResult.error : "Board data could not be loaded."}</p>
          <Link className="ui-button" href={`/boards/${board.id}`}>Retry</Link>
        </section>
      </AppShell>
    );
  }
  const columnsForView = canEdit ? columnsResult.data : columnsResult.data.map((column) => ({
    ...column,
    tasks: column.tasks.map((task) => ({ ...task, created_by: null })),
  }));

  return (
    <AppShell boards={ownedBoards} currentBoard={board} canManageBoard={canEdit} canCreateBoard={Boolean(userId)}>
      <BoardOverview
        key={columnsResult.data.map((column) => `${column.id}:${column.updated_at}:${column.tasks.map((task) => `${task.id}:${task.updated_at}`).join(",")}`).join("|")}
        board={board}
        columns={columnsForView}
        labels={labelsResult.data}
        canEdit={canEdit}
        signedIn={Boolean(userId)}
      />
    </AppShell>
  );
}
