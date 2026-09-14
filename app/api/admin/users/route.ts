import {NextRequest, NextResponse} from "next/server";
import {connectDb} from "@/lib/db";
import {User} from "@/lib/models/User";
import {getCurrentUser} from "@/lib/session";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }
  if (user.role !== "superadmin") {
    return NextResponse.json({error: "Forbidden"}, {status: 403});
  }

  await connectDb();

  const users = await User.find({}).select("email role createdAt").lean();

  return NextResponse.json({data: users});
}
