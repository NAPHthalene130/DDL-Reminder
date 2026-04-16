import { z } from "zod";

export const taskIdSchema = z.string().min(1);

const taskFieldsSchema = z.object({
  title: z.string().trim().min(1, "Task title is required."),
  description: z.string().trim().optional(),
  startAt: z.coerce.date().optional(),
  dueAt: z.coerce.date()
});

export const createTaskSchema = taskFieldsSchema.superRefine(
  (data, context) => {
    const startAt = data.startAt;

    if (startAt && data.dueAt.getTime() <= startAt.getTime()) {
      context.addIssue({
        code: "custom",
        message: "DDL time must be later than start time.",
        path: ["dueAt"]
      });
    }
  }
);

export const updateTaskSchema = taskFieldsSchema
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
