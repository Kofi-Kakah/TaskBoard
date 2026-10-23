import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
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
        <ClerkProvider
          afterSignOutUrl="/"
          appearance={{
            theme: shadcn,
            variables: {
              colorPrimary: "#1570EF",
              colorBackground: "#FFFFFF",
              colorForeground: "#101828",
            },
          }}
        >
          <Suspense fallback={<main className="min-h-screen" aria-busy="true" />}>
            {children}
          </Suspense>
          <Toaster position="bottom-right" theme="light" toastOptions={{ style: { borderColor: "var(--border)", borderRadius: "12px", fontFamily: "var(--font-inter)" } }} />
        </ClerkProvider>
      </body>
    </html>
  );
}
