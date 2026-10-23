"use client";

import { RouteError } from "@/components/layout/route-error";

export default function BoardsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError reset={reset} />;
}
