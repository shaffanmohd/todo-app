"use client";

import {useState} from "react";
import {useRouter, useParams} from "next/navigation";
import Link from "next/link";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {ArrowLeft, Loader2, CheckCircle2} from "lucide-react";
import {STATUS_STYLES, PRIORITY_BAR_COLORS, TODO_STATUS} from "@/lib/constants";
import {
  getTodo,
  updateTodo,
  deleteTodo,
  type TodoFormValues,
  PopulatedTodoRef,
} from "@/lib/api-client";

import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import TodoForm from "@/app/components/TodoForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {toast} from "sonner";

export default function TodoDetailPage() {
  const router = useRouter();
  const params = useParams<{id: string}>();
  const id = params.id;
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {data, isLoading, isFetching, error} = useQuery({
    queryKey: ["todo", id],
    queryFn: () => getTodo(id),
    enabled: !!id,
  });

  const todo = data?.data;

  const updateMutation = useMutation({
    mutationFn: (values: Partial<TodoFormValues>) => updateTodo(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["todo", id]});
      queryClient.invalidateQueries({queryKey: ["todos"]}); // list page cache, in case it's revisited
      setEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["todos"]});
      toast.success("Todo deleted.");
      router.push("/todos");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete todo");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => updateTodo(id, {status: newStatus}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["todo", id]});
      queryClient.invalidateQueries({queryKey: ["todos"]});
      toast.success("Status updated.");
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    },
  });

  async function handleEdit(values: TodoFormValues) {
    await updateMutation.mutateAsync(values);
  }

  function confirmDelete() {
    deleteMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !todo) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
          <Link
            href="/todos"
            className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to list
          </Link>
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Todo not found"}
          </p>
        </div>
      </div>
    );
  }

  const canComplete = todo.status !== "Completed" && todo.status !== "Archived";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <Link
          href="/todos"
          className="text-sm text-muted-foreground hover:underline flex items-center gap-1 w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Task Manager</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              {todo.name}
              {isFetching && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </h1>
          </div>
          <div className="flex gap-2 items-center">
            <Select
              value={todo.status}
              onValueChange={(v: string|null) => {
                if (v) statusMutation.mutate(v);
              }}
              disabled={statusMutation.isPending}
            >
              <SelectTrigger className="w-44 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TODO_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <Badge className={STATUS_STYLES[s]} variant="secondary">
                        {s}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setDeleteOpen(true);
              }}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Main details card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge
                  className={STATUS_STYLES[todo.status]}
                  variant="secondary"
                >
                  {todo.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Priority</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-1.5 h-4 rounded-full ${PRIORITY_BAR_COLORS[todo.priority]}`}
                  />
                  <span>{todo.priority}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                <p>
                  {todo.dueDate
                    ? new Date(todo.dueDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recurrence</p>
                <p className="capitalize">
                  {todo.recurrence?.frequency === "none" || !todo.recurrence
                    ? "None"
                    : todo.recurrence.frequency === "custom"
                      ? `Every ${todo.recurrence.intervalDays ?? 1} day(s)`
                      : todo.recurrence.frequency}
                </p>
              </div>
            </div>

            {todo.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {todo.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dependencies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Depends on (must be completed first)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!todo.dependsOn || todo.dependsOn.length === 0) && (
              <p className="text-sm text-muted-foreground">
                No dependencies — this is a root task.
              </p>
            )}
            <div className="space-y-2">
              {todo.dependsOn?.map((dep: PopulatedTodoRef) => (
                <Link
                  key={dep._id}
                  href={`/todos/${dep._id}`}
                  className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                >
                  <span className="text-primary font-medium">{dep.name}</span>
                  <Badge
                    className={STATUS_STYLES[dep.status]}
                    variant="secondary"
                  >
                    {dep.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dependents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Dependents (blocked by this task)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!todo.dependents || todo.dependents.length === 0) && (
              <p className="text-sm text-muted-foreground">
                Nothing depends on this task.
              </p>
            )}
            <div className="space-y-2">
              {todo.dependents?.map((dep: PopulatedTodoRef) => (
                <Link
                  key={dep._id}
                  href={`/todos/${dep._id}`}
                  className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                >
                  <span className="text-primary font-medium">{dep.name}</span>
                  <Badge
                    className={STATUS_STYLES[dep.status]}
                    variant="secondary"
                  >
                    {dep.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Todo</DialogTitle>
            </DialogHeader>
            <TodoForm
              currentTodoId={id}
              initialValues={{
                name: todo.name,
                description: todo.description,
                dueDate: todo.dueDate
                  ? new Date(todo.dueDate).toISOString()
                  : undefined,
                status: todo.status,
                priority: todo.priority,
                dependsOn:
                  todo.dependsOn?.map((d: PopulatedTodoRef) =>
                    d._id.toString(),
                  ) ?? [],
                recurrence: todo.recurrence,
              }}
              onSubmit={handleEdit}
              onCancel={() => setEditOpen(false)}
              submitLabel="Save"
            />
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog
          open={deleteOpen}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setDeleteOpen(false);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete &ldquo;{todo.name}&rdquo;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. If other todos depend on this one, the
                deletion will be blocked.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  confirmDelete();
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
