import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BoardOverview } from "@/components/board/board-overview";
import { getOwnedBoards } from "@/lib/boards";
import { getBoardColumns } from "@/lib/columns";
import { boardIdSchema } from "@/lib/validation/boards";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { boardId } = await params;
  const parsedId = boardIdSchema.safeParse(boardId);
  if (!parsedId.success) notFound();

  const result = await getOwnedBoards(userId);
  if (result.ok) {
    const board = result.data.find((item) => item.id === parsedId.data);
    if (!board) notFound();

    const columnsResult = await getBoardColumns(board.id);
    if (!columnsResult.ok) {
      return (
        <AppShell boards={result.data} currentBoard={board}>
          <section className="boards-content-state" role="alert">
            <h2>Columns could not load</h2>
            <p>{columnsResult.error}</p>
            <Link className="ui-button" href={`/boards/${board.id}`}>Retry</Link>
          </section>
        </AppShell>
      );
    }

    return (
      <AppShell boards={result.data} currentBoard={board}>
        <BoardOverview board={board} columns={columnsResult.data} />
      </AppShell>
    );
  }

  return (
    <AppShell boards={[]} pageTitle="Board unavailable">
      <section className="boards-content-state" role="alert">
        <h2>Board could not load</h2>
        <p>{result.error}</p>
        <Link className="ui-button" href={`/boards/${parsedId.data}`}>Retry</Link>
      </section>
    </AppShell>
  );
}
