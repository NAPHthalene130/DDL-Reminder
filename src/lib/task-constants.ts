export const TASK_STATUSES = ["ACTIVE", "COMPLETED", "ARCHIVED"] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const REMINDER_TYPES = ["DUE_IN_24H", "DUE_IN_1H", "OVERDUE"] as const;
export type ReminderTypeValue = (typeof REMINDER_TYPES)[number];
