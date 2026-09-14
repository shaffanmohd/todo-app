import {NextRequest, NextResponse} from "next/server";
import mongoose from "mongoose";
import {connectDb} from "@/lib/db";
import {User, USER_ROLES} from "@/lib/models/User";
import {Todo} from "@/lib/models/Todo";
import {getCurrentUser} from "@/lib/session";

interface RouteParams {
  params: Promise<{id: string}>;
}

export async function PATCH(
  req: NextRequest,
  {params}: RouteParams,
): Promise<NextResponse> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }
  if (currentUser.role !== "superadmin") {
    return NextResponse.json({error: "Forbidden"}, {status: 403});
  }

  await connectDb();
  const {id} = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({error: "Invalid user id"}, {status: 400});
  }

  if (id === currentUser.id) {
    return NextResponse.json(
      {error: "You cannot change your own role"},
      {status: 400},
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
  }

  const {role} = (body ?? {}) as {role?: unknown};

  if (
    typeof role !== "string" ||
    !(USER_ROLES as readonly string[]).includes(role)
  ) {
    return NextResponse.json(
      {error: `role must be one of: ${USER_ROLES.join(", ")}`},
      {status: 400},
    );
  }

  const updated = await User.findByIdAndUpdate(id, {role}, {new: true}).select(
    "email role",
  );

  if (!updated) {
    return NextResponse.json({error: "User not found"}, {status: 404});
  }

  return NextResponse.json({data: updated});
}

export async function DELETE(
  req: NextRequest,
  {params}: RouteParams,
): Promise<NextResponse> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }
  if (currentUser.role !== "superadmin") {
    return NextResponse.json({error: "Forbidden"}, {status: 403});
  }

  await connectDb();
  const {id} = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({error: "Invalid user id"}, {status: 400});
  }

  if (id === currentUser.id) {
    return NextResponse.json(
      {error: "You cannot delete your own account"},
      {status: 400},
    );
  }

  // Block deletion if the user still owns active todos — see README for
  // the future "reassign ownership" idea this leaves room for.
  const todoCount = await Todo.countDocuments({userId: id, deletedAt: null});
  if (todoCount > 0) {
    return NextResponse.json(
      {error: `Cannot delete: this user still owns ${todoCount} todo(s).`},
      {status: 409},
    );
  }

  const deleted = await User.findByIdAndDelete(id);

  if (!deleted) {
    return NextResponse.json({error: "User not found"}, {status: 404});
  }

  return NextResponse.json({data: {message: "User deleted"}});
}
