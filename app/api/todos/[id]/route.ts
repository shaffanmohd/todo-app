import {NextRequest, NextResponse} from "next/server";
import mongoose from "mongoose";
import {connectDb} from "@/lib/db";
import {Todo} from "@/lib/models/Todo";
import {validateTodoUpdate, type TodoInput} from "@/lib/validation";
import {
  wouldCreateCycle,
  areAllDependenciesCompleted,
} from "@/lib/dependencies";
import {TODO_STATUS_VALUES} from "@/lib/constants";
import {getCurrentUser} from "@/lib/session";

interface RouteParams {
  params: Promise<{id: string}>;
}

export async function GET(
  req: NextRequest,
  {params}: RouteParams,
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  await connectDb();
  const {id} = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({error: "Invalid todo id"}, {status: 400});
  }

  const todo = await Todo.findOne({_id: id, userId: user.id, deletedAt: null})
    .populate("dependsOn", "name status priority dueDate")
    .lean();

  if (!todo) {
    return NextResponse.json({error: "Todo not found"}, {status: 404});
  }

  const dependents = await Todo.find({
    dependsOn: id,
    userId: user.id,
    deletedAt: null,
  })
    .select("name status priority dueDate")
    .lean();

  return NextResponse.json({
    data: {...todo, dependents},
  });
}

export async function PATCH(
  req: NextRequest,
  {params}: RouteParams,
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  await connectDb();
  const {id} = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({error: "Invalid todo id"}, {status: 400});
  }

  const existing = await Todo.findOne({
    _id: id,
    userId: user.id,
    deletedAt: null,
  });
  if (!existing) {
    return NextResponse.json({error: "Todo not found"}, {status: 404});
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
  }

  const errors = validateTodoUpdate(body);
  if (errors.length > 0) {
    return NextResponse.json(
      {error: "Validation failed", details: errors},
      {status: 400},
    );
  }

  const input = body as TodoInput;

  if (input.dependsOn !== undefined) {
    const newDependsOn = input.dependsOn as string[];

    const existingCount = await Todo.countDocuments({
      _id: {$in: newDependsOn},
      userId: user.id,
    });
    if (existingCount !== newDependsOn.length) {
      return NextResponse.json(
        {error: "One or more dependsOn IDs do not exist"},
        {status: 400},
      );
    }

    const hasCycle = await wouldCreateCycle(id, newDependsOn, user.id);
    if (hasCycle) {
      return NextResponse.json(
        {error: "This dependsOn change would create a circular dependency"},
        {status: 400},
      );
    }
  }

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

    const allCompleted = await areAllDependenciesCompleted(dependsOn, user.id);
    if (!allCompleted) {
      return NextResponse.json(
        {
          error: `Cannot move to ${input.status} until all dependencies are Completed`,
        },
        {status: 400},
      );
    }
  }

  const updateData = input as unknown as Record<string, unknown>;

  try {
    const updated = await Todo.findOneAndUpdate(
      {_id: id, userId: user.id},
      updateData,
      {new: true, runValidators: true},
    );
    return NextResponse.json({data: updated});
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {error: "Failed to update todo", details: message},
      {status: 500},
    );
  }
}

export async function DELETE(
  req: NextRequest,
  {params}: RouteParams,
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  await connectDb();
  const {id} = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({error: "Invalid todo id"}, {status: 400});
  }

  const dependentCount = await Todo.countDocuments({
    dependsOn: id,
    userId: user.id,
    deletedAt: null,
  });

  if (dependentCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete: ${dependentCount} other todo(s) depend on this one. Remove the dependency first.`,
      },
      {status: 409},
    );
  }

  const todo = await Todo.findOneAndUpdate(
    {_id: id, userId: user.id, deletedAt: null},
    {deletedAt: new Date()},
    {new: true},
  );

  if (!todo) {
    return NextResponse.json({error: "Todo not found"}, {status: 404});
  }

  return NextResponse.json({data: {message: "Todo deleted"}});
}
