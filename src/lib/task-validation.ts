import { z } from "zod";
import { TASK_ERROR_MESSAGES } from "./task-error-messages";

export const taskIdSchema = z.string().min(1, TASK_ERROR_MESSAGES.idInvalid);

const updateTaskFieldsSchema = z.object({
  title: z.string().trim().min(1, TASK_ERROR_MESSAGES.titleRequired),
  description: z.string().trim().optional(),
  startAt: z.coerce.date({ error: TASK_ERROR_MESSAGES.dateInvalid }).optional(),
  dueAt: z.coerce.date({ error: TASK_ERROR_MESSAGES.dateInvalid })
});

const createTaskFieldsSchema = updateTaskFieldsSchema.extend({
  startAt: z.coerce.date().default(() => new Date())
});

export const createTaskSchema = createTaskFieldsSchema.superRefine(
  (data, context) => {
    if (data.dueAt.getTime() <= data.startAt.getTime()) {
      context.addIssue({
        code: "custom",
        message: TASK_ERROR_MESSAGES.dateRangeInvalid,
        path: ["dueAt"]
      });
    }
  }
);

export const updateTaskSchema = updateTaskFieldsSchema
  .partial()
  .superRefine((data, context) => {
    if (
      data.startAt &&
      data.dueAt &&
      data.dueAt.getTime() <= data.startAt.getTime()
    ) {
      context.addIssue({
        code: "custom",
        message: TASK_ERROR_MESSAGES.dateRangeInvalid,
        path: ["dueAt"]
      });
    }
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export function normalizeOptionalDescription(description: string | undefined) {
  return description && description.length > 0 ? description : null;
}

export function isValidTaskDateRange(startAt: Date, dueAt: Date) {
  return dueAt.getTime() > startAt.getTime();
}
