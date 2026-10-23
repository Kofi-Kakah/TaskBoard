import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/layout/app-shell";
import { ExploreDashboard } from "@/components/board/explore-dashboard";
import { getOwnedBoards, getPublicBoards } from "@/lib/boards";

export default async function ExplorePage() {
  const { userId } = await auth();
  const [publicBoards, ownedBoards] = await Promise.all([
    getPublicBoards(),
    userId ? getOwnedBoards(userId) : Promise.resolve(null),
  ]);
  return <AppShell boards={ownedBoards?.ok ? ownedBoards.data : []} pageTitle="Explore" canCreateBoard={Boolean(userId)}><ExploreDashboard result={publicBoards} /></AppShell>;
}
