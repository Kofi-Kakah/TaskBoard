import { z } from "zod";
import { boardColorSchema, boardIdSchema } from "@/lib/validation/boards";

export const labelInputSchema = z.object({
  boardId: boardIdSchema,
  name: z.string().trim().min(1, "Enter a label name.").max(24, "Label names can be up to 24 characters."),
  color: boardColorSchema,
});

export const labelUpdateSchema = labelInputSchema.extend({ labelId: boardIdSchema });
export const labelDeleteSchema = z.object({ boardId: boardIdSchema, labelId: boardIdSchema });

export type LabelInput = z.infer<typeof labelInputSchema>;
