"use client";

import { RouteError } from "@/components/layout/route-error";

export default function BoardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError reset={reset} />;
}
