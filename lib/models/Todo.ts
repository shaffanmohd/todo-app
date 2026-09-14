import mongoose, {Schema, model, models, Document, Types} from "mongoose";
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

export interface ITodo extends Document {
  userId: Types.ObjectId;
  name: string;
  description: string;
  dueDate?: Date;
  status: TodoStatus;
  priority: TodoPriority;
  dependsOn: Types.ObjectId[];
  recurrence: {
    frequency: RecurrenceFrequency;
    intervalDays?: number;
  };
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const RecurrenceSchema = new Schema(
  {
    frequency: {type: String, enum: RECURRENCE_FREQUENCY, default: "none"},
    intervalDays: {type: Number},
  },
  {_id: false},
);

const TodoSchema = new Schema<ITodo>(
  {
    userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
    name: {type: String, required: true, trim: true},
    description: {type: String, default: ""},
    dueDate: {type: Date},
    status: {type: String, enum: TODO_STATUS, default: "Not Started"},
    priority: {type: String, enum: TODO_PRIORITY, default: "Medium"},
    dependsOn: [{type: Schema.Types.ObjectId, ref: "Todo"}],
    recurrence: {type: RecurrenceSchema, default: () => ({frequency: "none"})},
    deletedAt: {type: Date, default: null},
  },
  {timestamps: true},
);

TodoSchema.index({userId: 1, status: 1});
TodoSchema.index({userId: 1, priority: 1});
TodoSchema.index({userId: 1, dueDate: 1});
TodoSchema.index({userId: 1, deletedAt: 1});

export const Todo =
  (models.Todo as mongoose.Model<ITodo>) || model<ITodo>("Todo", TodoSchema);
