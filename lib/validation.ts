import {
  TODO_STATUS,
  TODO_PRIORITY,
  RECURRENCE_FREQUENCY,
} from "@/lib/constants";
import type {
  TodoStatus,
  TodoPriority,
  RecurrenceFrequency,
} from "@/lib/constants";
import mongoose from "mongoose";

export interface TodoInput {
  name?: unknown;
  description?: unknown;
  dueDate?: unknown;
  status?: unknown;
  priority?: unknown;
  dependsOn?: unknown;
  recurrence?: {
    frequency?: unknown;
    intervalDays?: unknown;
  };
}


function validateProvidedFields(input: TodoInput): string[] {
  const errors: string[] = [];

  if (input.status !== undefined && !TODO_STATUS.includes(input.status as TodoStatus)) {
    errors.push(`status must be one of: ${TODO_STATUS.join(", ")}`);
  }
  if (input.priority !== undefined && !TODO_PRIORITY.includes(input.priority as TodoPriority)) {
    errors.push(`priority must be one of: ${TODO_PRIORITY.join(", ")}`);
  }
  if (input.dueDate !== undefined) {
    if (typeof input.dueDate !== "string" || isNaN(Date.parse(input.dueDate))) {
      errors.push("dueDate must be a valid date string");
    }
  }
  if (input.dependsOn !== undefined) {
    if (!Array.isArray(input.dependsOn)) {
      errors.push("dependsOn must be an array of todo IDs");
    } else {
      for (const id of input.dependsOn) {
        if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
          errors.push(`dependsOn contains an invalid id: ${String(id)}`);
        }
      }
    }
  }
  if (input.recurrence?.frequency !== undefined) {
    if (!RECURRENCE_FREQUENCY.includes(input.recurrence.frequency as RecurrenceFrequency)) {
      errors.push(`recurrence.frequency must be one of: ${RECURRENCE_FREQUENCY.join(", ")}`);
    }
  }

  return errors;
}

export function validateTodoCreate(body: unknown): string[] {
  if (typeof body !== "object" || body === null) {
    return ["Request body must be a JSON object"];
  }
  const input = body as TodoInput;
  const errors: string[] = [];

  if (typeof input.name !== "string" || !input.name.trim()) {
    errors.push("name is required and must be a non-empty string");
  }

  // Past-date check only applies to creation.
  if (input.dueDate !== undefined && typeof input.dueDate === "string" && !isNaN(Date.parse(input.dueDate))) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parsedDate = new Date(input.dueDate);
    if (parsedDate < today) {
      errors.push("dueDate cannot be in the past");
    }
  }

  return [...errors, ...validateProvidedFields(input)];
}

export function validateTodoUpdate(body: unknown): string[] {
  if (typeof body !== "object" || body === null) {
    return ["Request body must be a JSON object"];
  }
  const input = body as TodoInput;
  const errors: string[] = [];

  if (input.name !== undefined && (typeof input.name !== "string" || !input.name.trim())) {
    errors.push("name must be a non-empty string");
  }

  // No past-date restriction on update — an overdue task should remain editable.
  return [...errors, ...validateProvidedFields(input)];
}