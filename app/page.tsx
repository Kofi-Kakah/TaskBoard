import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/boards");

  return (
    <main className="welcome-page">
      <div className="welcome-card">
        <span className="brand-mark"><span>TB</span></span>
        <p className="welcome-eyebrow">TaskBoard</p>
        <h1>Plan your work, one board at a time.</h1>
        <p className="welcome-copy">Create a board for your projects and keep every task in view.</p>
        <div className="welcome-actions">
          <Link className="ui-button ui-button-primary" href="/sign-up">Create your account</Link>
          <Link className="ui-button" href="/sign-in">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
