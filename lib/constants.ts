export const TODO_STATUS = [
  "Not Started",
  "In Progress",
  "Completed",
  "Archived",
] as const;
export type TodoStatus = (typeof TODO_STATUS)[number];

export const TODO_PRIORITY = ["Low", "Medium", "High"] as const;
export type TodoPriority = (typeof TODO_PRIORITY)[number];

export const RECURRENCE_FREQUENCY = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "custom",
] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCY)[number];
