import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Todo } from "@/lib/models/Todo";
import { validateTodoInput, type TodoInput } from "@/lib/validation";

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
  status?: string;
  priority?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  await connectDb();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const sortParam = searchParams.get("sort") ?? "createdAt";
  const order: 1 | -1 = searchParams.get("order") === "asc" ? 1 : -1;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const filter: TodoFilter = { deletedAt: null };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

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

  const errors = validateTodoInput(body);
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

  try {
    const todo = await Todo.create(input);
    return NextResponse.json({ data: todo }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create todo", details: message },
      { status: 500 },
    );
  }
}
