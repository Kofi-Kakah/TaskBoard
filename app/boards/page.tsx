import { auth } from "@clerk/nextjs/server";

export default async function BoardsPage() {
  await auth.protect();

  return (
    <main className="protected-placeholder">
      <h1>Your boards</h1>
      <p>Your board list will be available here.</p>
    </main>
  );
}
