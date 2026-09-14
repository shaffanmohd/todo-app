"use client";

import {useState} from "react";
import {useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {Loader2, ArrowLeft} from "lucide-react";

import {
  getUsers,
  updateUserRole,
  deleteUser,
  type AdminUser,
} from "@/lib/api-client";

import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

export default function AdminUsersPage() {
  const {data: session, status: sessionStatus} = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const {data, isLoading, error} = useQuery({
    queryKey: ["admin-users"],
    queryFn: getUsers,
    enabled:
      sessionStatus === "authenticated" && session?.user?.role === "superadmin",
  });

  const roleMutation = useMutation({
    mutationFn: ({id, role}: {id: string; role: string}) =>
      updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["admin-users"]});
      toast.success("Role updated.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["admin-users"]});
      setDeleteTarget(null);
      toast.success("User deleted.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    },
  });

  // Client-side gate — mirrors the server-side check, but the server is the
  // real enforcement (see the 403 checks in the API routes).
  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session?.user?.role !== "superadmin") {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-sm text-destructive">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  const users = data?.data ?? [];
  const currentUserId = session.user.id;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <Link
        href="/todos"
        className="text-sm text-muted-foreground hover:underline flex items-center gap-1 w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Todos
      </Link>
      <div>
        <p className="text-sm text-muted-foreground mb-1">Task Manager</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          User Management
        </h1>
      </div>
      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load users"}
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                users.map((u) => {
                  const isSelf = u._id === currentUserId;
                  return (
                    <TableRow key={u._id}>
                      <TableCell>
                        {u.email}
                        {isSelf && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(v: string | null) => {
                            if (v) roleMutation.mutate({id: u._id, role: v});
                          }}
                          disabled={isSelf || roleMutation.isPending}
                        >
                          <SelectTrigger className="w-40 rounded-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">user</SelectItem>
                            <SelectItem value="superadmin">
                              superadmin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={isSelf}
                          onClick={() => setDeleteTarget(u)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{deleteTarget?.email}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. If this user still owns active todos,
              deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget._id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
