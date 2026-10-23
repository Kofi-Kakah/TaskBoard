import { z } from "zod";
import { parseDateOnly } from "@/lib/dates";
import { boardIdSchema } from "@/lib/validation/boards";

export const taskInputSchema = z.object({
  boardId: boardIdSchema,
  columnId: boardIdSchema,
  title: z.string().trim().min(1, "Enter a task title.").max(120, "Task titles can be up to 120 characters."),
  description: z.string().max(2000, "Descriptions can be up to 2000 characters."),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().refine((value) => value === "" || parseDateOnly(value) !== null, "Choose a valid due date."),
});

export const taskUpdateSchema = taskInputSchema.omit({ columnId: true }).extend({ taskId: boardIdSchema });
export const taskDeleteSchema = z.object({ boardId: boardIdSchema, taskId: boardIdSchema });

export type TaskFormValues = z.infer<typeof taskInputSchema>;
