// components/Navbar.tsx
"use client";

import Link from "next/link";
import {useSession, signOut} from "next-auth/react";
import {Button} from "@/components/ui/button";

export default function Navbar() {
  const {data: session, status} = useSession();

  if (status !== "authenticated") {
    return null; // no navbar on login/signup pages
  }

  return (
    <div className="border-b bg-card">
      <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/todos" className="font-semibold text-foreground">
            Task Manager
          </Link>
          {session?.user?.role === "superadmin" && (
            <Link
              href="/admin/users"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Manage Users
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {session.user.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({callbackUrl: "/login"})}
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
