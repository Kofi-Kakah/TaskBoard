import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <section className="auth-frame" aria-labelledby="auth-title">
        <div className="auth-brand-tile" aria-hidden="true">T</div>
        <h1 id="auth-title">Create your account</h1>
        <p className="auth-caption">Get started with TaskBoard.</p>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          signInFallbackRedirectUrl="/boards"
        />
      </section>
    </main>
  );
}
