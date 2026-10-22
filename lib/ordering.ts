import { generateKeyBetween } from "fractional-indexing";

export function positionBetween(previous: string | null, next: string | null): string {
  return generateKeyBetween(previous, next);
}

export function positionAtEnd(previous: string | null): string {
  return positionBetween(previous, null);
}

export function positionAtStart(next: string | null): string {
  return positionBetween(null, next);
}
