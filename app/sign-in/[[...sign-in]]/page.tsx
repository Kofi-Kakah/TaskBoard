import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <section className="auth-frame" aria-labelledby="auth-title">
        <div className="auth-brand-tile" aria-hidden="true">T</div>
        <h1 id="auth-title">Welcome back</h1>
        <p className="auth-caption">Sign in to continue to TaskBoard.</p>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/boards"
          signUpFallbackRedirectUrl="/boards"
          signUpForceRedirectUrl="/boards"
        />
      </section>
    </main>
  );
}
