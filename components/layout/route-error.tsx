"use client";

import { Button } from "@/components/ui/button";

export function RouteError({ reset }: { reset: () => void }) {
  return (
    <main className="route-error" role="alert">
      <h1>Something went wrong</h1>
      <p>This page could not be loaded. Check your connection and try again.</p>
      <Button type="button" variant="outline" onClick={reset}>Try again</Button>
    </main>
  );
}
