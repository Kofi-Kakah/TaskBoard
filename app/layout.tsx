import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskBoard",
  description: "A clear, collaborative space for your tasks.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ClerkProvider afterSignOutUrl="/">
          <Suspense fallback={<div className="h-[57px] border-b border-border bg-surface" aria-hidden="true" />}>
            <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-surface">
              <Show when="signed-out">
                <div className="flex items-center gap-2">
                  <SignInButton mode="redirect" />
                  <SignUpButton mode="redirect" />
                </div>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </header>
          </Suspense>
          <Suspense fallback={<main className="min-h-[calc(100vh-57px)]" aria-busy="true" />}>
            {children}
          </Suspense>
          <Toaster position="bottom-right" theme="light" toastOptions={{ style: { borderColor: "var(--border)", borderRadius: "12px", fontFamily: "var(--font-inter)" } }} />
        </ClerkProvider>
      </body>
    </html>
  );
}
