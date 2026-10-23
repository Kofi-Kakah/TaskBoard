import { AppShell } from "@/components/layout/app-shell";
import { StaticBoard } from "@/components/board/static-board";

export default function HomePage() {
  return (
    <AppShell>
      <StaticBoard />
    </AppShell>
  );
}
