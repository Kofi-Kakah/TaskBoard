import { z } from "zod";

export const boardColors = [
  "#667085",
  "#2E90FA",
  "#F97316",
  "#12B76A",
  "#F04438",
  "#7A5AF8",
  "#EE46BC",
  "#15B79E",
] as const;

const legacyColorNames = ["gray", "blue", "orange", "green", "red", "purple", "pink", "teal"] as const;
export const boardColorSchema = z.union([z.enum(boardColors), z.enum(legacyColorNames)]);

const resolvedColors: Record<string, (typeof boardColors)[number]> = {
  gray: boardColors[0],
  blue: boardColors[1],
  orange: boardColors[2],
  green: boardColors[3],
  red: boardColors[4],
  purple: boardColors[5],
  pink: boardColors[6],
  teal: boardColors[7],
};

export function resolveBoardColor(color: string): (typeof boardColors)[number] {
  if ((boardColors as readonly string[]).includes(color)) return color as (typeof boardColors)[number];
  return resolvedColors[color] ?? boardColors[0];
}

export const boardInputSchema = z.object({
  title: z.string().trim().min(1, "Enter a board name.").max(80, "Board names can be up to 80 characters."),
  description: z.string().trim().nullable().optional(),
  color: boardColorSchema,
  visibility: z.enum(["private", "public"]),
});

export const boardIdSchema = z.string().uuid();

export type BoardInput = z.infer<typeof boardInputSchema>;
