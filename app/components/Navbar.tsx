"use client";

import Link from "next/link";
import {useSession, signOut} from "next-auth/react";
import {Button} from "@/components/ui/button";

export default function Navbar() {
  const {data: session} = useSession();

  return (
    <div className="border-b bg-card">
      <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/todos" className="font-semibold text-foreground">
          Task Manager
        </Link>
        <div className="flex items-center gap-3">
          {session?.user?.email && (
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
          )}
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
