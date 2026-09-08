import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { ITodo, Todo } from "@/lib/models/Todo";
import { validateTodoCreate, type TodoInput } from "@/lib/validation";
import {
  TODO_PRIORITY,
  TODO_STATUS,
  TodoPriority,
  TodoStatus,
} from "@/lib/constants";

const VALID_SORT_FIELDS = [
  "dueDate",
  "priority",
  "status",
  "name",
  "createdAt",
] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

function isSortField(value: string): value is SortField {
  return (VALID_SORT_FIELDS as readonly string[]).includes(value);
}

interface TodoFilter {
  deletedAt: null;
  status?: TodoStatus;
  priority?: TodoPriority;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  await connectDb();

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const priorityParam = searchParams.get("priority");
  const sortParam = searchParams.get("sort") ?? "createdAt";
  const order: 1 | -1 = searchParams.get("order") === "asc" ? 1 : -1;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const filter: TodoFilter = { deletedAt: null };
  if (statusParam && (TODO_STATUS as readonly string[]).includes(statusParam)) {
    filter.status = statusParam as TodoStatus;
  }
  if (
    priorityParam &&
    (TODO_PRIORITY as readonly string[]).includes(priorityParam)
  ) {
    filter.priority = priorityParam as TodoPriority;
  }

  const sortField: SortField = isSortField(sortParam) ? sortParam : "createdAt";

  const todos = await Todo.find(filter)
    .sort({ [sortField]: order })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Todo.countDocuments(filter);

  return NextResponse.json({
    data: todos,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  await connectDb();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const errors = validateTodoCreate(body);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Validation failed", details: errors },
      { status: 400 },
    );
  }

  const input = body as TodoInput;
  const dependsOn = (input.dependsOn as string[] | undefined) ?? [];

  // Check if all dependsOn IDs exist in the database
  if (dependsOn.length > 0) {
    const existingCount = await Todo.countDocuments({
      _id: { $in: dependsOn },
    });
    if (existingCount !== dependsOn.length) {
      return NextResponse.json(
        { error: "One or more dependsOn IDs do not exist" },
        { status: 400 },
      );
    }
  }

  const todoData: Partial<ITodo> = {
    name: input.name as string,
    description: (input.description as string | undefined) ?? "",
    dueDate: input.dueDate ? new Date(input.dueDate as string) : undefined,
    status: input.status as ITodo["status"] | undefined,
    priority: input.priority as ITodo["priority"] | undefined,
    dependsOn: dependsOn as unknown as ITodo["dependsOn"],
    recurrence: input.recurrence as ITodo["recurrence"] | undefined,
  };

  try {
    const todo = await Todo.create(todoData);
    return NextResponse.json({ data: todo }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create todo", details: message },
      { status: 500 },
    );
  }
}
