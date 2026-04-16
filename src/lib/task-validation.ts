import { z } from "zod";

export const taskIdSchema = z.string().min(1);

const updateTaskFieldsSchema = z.object({
  title: z.string().trim().min(1, "Task title is required."),
  description: z.string().trim().optional(),
  startAt: z.coerce.date().optional(),
  dueAt: z.coerce.date()
});

const createTaskFieldsSchema = updateTaskFieldsSchema.extend({
  startAt: z.coerce.date().default(() => new Date())
});

export const createTaskSchema = createTaskFieldsSchema.superRefine(
  (data, context) => {
    if (data.dueAt.getTime() <= data.startAt.getTime()) {
      context.addIssue({
        code: "custom",
        message: "DDL time must be later than start time.",
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
        message: "DDL time must be later than start time.",
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
