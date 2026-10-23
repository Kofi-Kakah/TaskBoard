import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BoardsDashboard } from "@/components/board/boards-dashboard";
import { getOwnedBoards } from "@/lib/boards";

export default async function BoardsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const result = await getOwnedBoards(userId);
  const boards = result.ok ? result.data : [];

  return (
    <AppShell boards={boards} pageTitle="Your boards" canCreateBoard={Boolean(userId)}>
      <BoardsDashboard result={result} />
    </AppShell>
  );
}
