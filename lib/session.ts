import { auth } from "@/auth";

export interface CurrentUser {
  id: string;
  role: string;
}

/**
 * Returns the current session's user, or null if unauthenticated.
 * Every API route that touches todos must call this first.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return { id: session.user.id, role: session.user.role };
}