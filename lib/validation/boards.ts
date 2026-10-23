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

export const boardInputSchema = z.object({
  title: z.string().trim().min(1, "Enter a board name.").max(80, "Board names can be up to 80 characters."),
  description: z.string().trim().nullable().optional(),
  color: z.enum(boardColors),
  visibility: z.enum(["private", "public"]),
});

export const boardIdSchema = z.string().uuid();

export type BoardInput = z.infer<typeof boardInputSchema>;
