import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { ITodo, Todo } from "@/lib/models/Todo";
import { validateTodoUpdate, type TodoInput } from "@/lib/validation";
import {
  wouldCreateCycle,
  areAllDependenciesCompleted,
} from "@/lib/dependencies";
import { TODO_STATUS_VALUES } from "@/lib/constants";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/todos/[id]
export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  await connectDb();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
  }

  const todo = await Todo.findOne({ _id: id, deletedAt: null })
    .populate("dependsOn", "name status priority dueDate")
    .lean();

  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  // Reverse lookup: which other (non-deleted) todos depend on this one.
  const dependents = await Todo.find({ dependsOn: id, deletedAt: null })
    .select("name status priority dueDate")
    .lean();

  return NextResponse.json({
    data: {
      ...todo,
      dependents,
    },
  });
}

// PATCH /api/todos/[id]
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  await connectDb();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
  }

  const existing = await Todo.findOne({ _id: id, deletedAt: null });
  if (!existing) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const errors = validateTodoUpdate(body);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Validation failed", details: errors },
      { status: 400 },
    );
  }

  const input = body as TodoInput;

  // --- Rule 1: dependency cycle check, only relevant if dependsOn is being changed ---
  if (input.dependsOn !== undefined) {
    const newDependsOn = input.dependsOn as string[];

    const existingCount = await Todo.countDocuments({
      _id: { $in: newDependsOn },
    });
    if (existingCount !== newDependsOn.length) {
      return NextResponse.json(
        { error: "One or more dependsOn IDs do not exist" },
        { status: 400 },
      );
    }

    const hasCycle = await wouldCreateCycle(id, newDependsOn);
    if (hasCycle) {
      return NextResponse.json(
        { error: "This dependsOn change would create a circular dependency" },
        { status: 400 },
      );
    }
  }

  // --- Rule 2: block Completed/In Progress unless all dependencies are Completed ---
  const statusesRequiringCompletedDeps: string[] = [
    TODO_STATUS_VALUES.IN_PROGRESS,
    TODO_STATUS_VALUES.COMPLETED,
  ];

  if (
    input.status !== undefined &&
    statusesRequiringCompletedDeps.includes(input.status as string)
  ) {
    const dependsOn =
      (input.dependsOn as string[] | undefined) ??
      existing.dependsOn.map((d) => d.toString());

    const allCompleted = await areAllDependenciesCompleted(dependsOn);
    if (!allCompleted) {
      return NextResponse.json(
        {
          error: `Cannot move to ${input.status} until all dependencies are Completed`,
        },
        { status: 400 },
      );
    }
  }

  const updateData: Partial<ITodo> = {};
  if (input.name !== undefined) updateData.name = input.name as string;
  if (input.description !== undefined)
    updateData.description = input.description as string;
  if (input.dueDate !== undefined)
    updateData.dueDate = new Date(input.dueDate as string);
  if (input.status !== undefined)
    updateData.status = input.status as ITodo["status"];
  if (input.priority !== undefined)
    updateData.priority = input.priority as ITodo["priority"];
  if (input.dependsOn !== undefined)
    updateData.dependsOn = input.dependsOn as unknown as ITodo["dependsOn"];
  if (input.recurrence !== undefined)
    updateData.recurrence = input.recurrence as ITodo["recurrence"];

  try {
    const updated = await Todo.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update todo", details: message },
      { status: 500 },
    );
  }
}

// DELETE /api/todos/[id]  (soft delete)
//
// Decision: deleting a todo that other (non-deleted) todos still depend on
// is BLOCKED (409) rather than cascading. Cascading would either silently
// strip references from unrelated todos or silently delete them too — both
// risk surprising data loss. Blocking forces the user to explicitly resolve
// the dependency first.
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  await connectDb();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
  }

  const dependentCount = await Todo.countDocuments({
    dependsOn: id,
    deletedAt: null,
  });

  if (dependentCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete: ${dependentCount} other todo(s) depend on this one. Remove the dependency first.`,
      },
      { status: 409 },
    );
  }

  const todo = await Todo.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true },
  );

  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { message: "Todo deleted" } });
}
