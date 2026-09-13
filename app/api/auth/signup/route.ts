import {NextRequest, NextResponse} from "next/server";
import {connectDb} from "@/lib/db";
import {User} from "@/lib/models/User";
import {hashPassword, validatePassword, validateEmail} from "@/lib/auth-utils";

export async function POST(req: NextRequest): Promise<NextResponse> {
  await connectDb();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
  }

  const {email, password} = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
  };

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      {error: "Email and password are required"},
      {status: 400},
    );
  }

  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json({error: emailError}, {status: 400});
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({error: passwordError}, {status: 400});
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({email: normalizedEmail});
  if (existing) {
    return NextResponse.json(
      {error: "An account with this email already exists"},
      {status: 409},
    );
  }

  const hashedPassword = await hashPassword(password);

  try {
    const user = await User.create({
      email: normalizedEmail,
      hashedPassword,
      role: "user",
    });

    return NextResponse.json(
      {data: {id: user._id.toString(), email: user.email}},
      {status: 201},
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {error: "Failed to create account", details: message},
      {status: 500},
    );
  }
}
