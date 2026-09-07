import { Schema, model, models } from "mongoose";
import {
  TODO_STATUS,
  TODO_PRIORITY,
  RECURRENCE_FREQUENCY,
} from "@/lib/constants";

const RecurrenceSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: RECURRENCE_FREQUENCY,
      default: "none",
    },
    intervalDays: { type: Number },
  },
  { _id: false },
);

const TodoSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: TODO_STATUS,
      default: "Not Started",
    },
    priority: {
      type: String,
      enum: TODO_PRIORITY,
      default: "Medium",
    },
    dependsOn: [{ type: Schema.Types.ObjectId, ref: "Todo" }],
    recurrence: {
      type: RecurrenceSchema,
      default: () => ({ frequency: "none" }),
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

TodoSchema.index({ status: 1 });
TodoSchema.index({ priority: 1 });
TodoSchema.index({ dueDate: 1 });
TodoSchema.index({ deletedAt: 1 });

export const Todo = models.Todo || model("Todo", TodoSchema);
