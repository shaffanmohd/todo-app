"use client";

import {useState} from "react";
import Link from "next/link";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {
  Loader2,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react";
import {
  TODO_STATUS,
  TODO_PRIORITY,
  STATUS_STYLES,
  PRIORITY_BAR_COLORS,
} from "@/lib/constants";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  type TodoFormValues,
} from "@/lib/api-client";
import type {ITodo} from "@/lib/models/Todo";

import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import TodoForm from "../components/TodoForm";
import {toast} from "sonner";

type SortableField = "dueDate" | "priority" | "status" | "name" | "createdAt";

function getSortIcon(
  field: SortableField,
  sort: SortableField | null,
  order: "asc" | "desc",
) {
  if (sort !== field) {
    return (
      <ChevronsUpDown className="inline h-3.5 w-3.5 ml-1 text-muted-foreground/50" />
    );
  }
  return order === "asc" ? (
    <ArrowUp className="inline h-3.5 w-3.5 ml-1 text-foreground" />
  ) : (
    <ArrowDown className="inline h-3.5 w-3.5 ml-1 text-foreground" />
  );
}

export default function TodosPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");
  const [dependencyFilter, setDependencyFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortableField | null>(null);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTodo, setEditTodo] = useState<ITodo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ITodo | null>(null);

  // --- Query: fetch todos, keyed on every param that affects the result ---
  const queryKey = [
    "todos",
    {
      statusFilter,
      priorityFilter,
      dueDateFilter,
      dependencyFilter,
      sort,
      order,
      page,
      limit,
    },
  ];

  const {data, isLoading, isFetching, error} = useQuery({
    queryKey,
    queryFn: () =>
      getTodos({
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        dueDateStatus: dueDateFilter !== "all" ? dueDateFilter : undefined,
        dependencyType:
          dependencyFilter !== "all" ? dependencyFilter : undefined,
        sort: sort ?? undefined,
        order: sort ? order : undefined,
        page,
        limit,
      }),
  });

  const todos = data?.data ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;

  // --- Mutations: create, update, delete ---
  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["todos"]});
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({id, values}: {id: string; values: Partial<TodoFormValues>}) =>
      updateTodo(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["todos"]});
      setEditTodo(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["todos"]});
      setDeleteTarget(null);
      toast.success("Todo deleted.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete todo");
    },
  });

  async function handleCreate(values: TodoFormValues) {
    await createMutation.mutateAsync(values);
  }

  async function handleEdit(values: TodoFormValues) {
    if (!editTodo) return;
    await updateMutation.mutateAsync({id: editTodo._id.toString(), values});
  }

  function openDeleteDialog(todo: ITodo) {
    setDeleteTarget(todo);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id.toString());
  }

  function toggleSort(field: SortableField) {
    if (sort !== field) {
      setSort(field);
      setOrder("asc");
    } else if (order === "asc") {
      setOrder("desc");
    } else {
      setSort(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Task Manager</p>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Todos
            </h1>
            <Button onClick={() => setCreateOpen(true)}>New Todo</Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load todos"}
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              All todos
              {isFetching && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <div className="flex gap-3 pt-2 flex-wrap">
              <Select
                value={statusFilter}
                onValueChange={(v: string) => {
                  if (v) {
                    setStatusFilter(v);
                    setPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-44 rounded-full">
                  <span>
                    Status: {statusFilter === "all" ? "All" : statusFilter}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
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

              <Select
                value={priorityFilter}
                onValueChange={(v: string) => {
                  if (v) {
                    setPriorityFilter(v);
                    setPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-44 rounded-full">
                  <span>
                    Priority:{" "}
                    {priorityFilter === "all" ? "All" : priorityFilter}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {TODO_PRIORITY.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-block w-1.5 h-4 rounded-full ${PRIORITY_BAR_COLORS[p]}`}
                        />
                        {p}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={dueDateFilter}
                onValueChange={(v: string) => {
                  if (v) {
                    setDueDateFilter(v);
                    setPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-52 rounded-full">
                  <span>
                    Due date:{" "}
                    {dueDateFilter === "all"
                      ? "All"
                      : dueDateFilter === "overdue"
                        ? "Passed"
                        : "Not passed"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All due dates</SelectItem>
                  <SelectItem value="overdue">Passed due date</SelectItem>
                  <SelectItem value="upcoming">Not passed due date</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={dependencyFilter}
                onValueChange={(v: string) => {
                  if (v) {
                    setDependencyFilter(v);
                    setPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-52 rounded-full">
                  <span>
                    Dependency: {dependencyFilter === "all" ? "All" : "None"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All todos</SelectItem>
                  <SelectItem value="none">No dependencies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none text-muted-foreground"
                    onClick={() => toggleSort("name")}
                  >
                    Name {getSortIcon("name", sort, order)}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-muted-foreground"
                    onClick={() => toggleSort("status")}
                  >
                    Status {getSortIcon("status", sort, order)}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-muted-foreground"
                    onClick={() => toggleSort("priority")}
                  >
                    Priority {getSortIcon("priority", sort, order)}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-muted-foreground"
                    onClick={() => toggleSort("dueDate")}
                  >
                    Due Date {getSortIcon("dueDate", sort, order)}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-muted-foreground"
                    onClick={() => toggleSort("createdAt")}
                  >
                    Created {getSortIcon("createdAt", sort, order)}
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && todos.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No todos found.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  todos.map((todo) => (
                    <TableRow key={todo._id.toString()}>
                      <TableCell>
                        <Link
                          href={`/todos/${todo._id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {todo.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={STATUS_STYLES[todo.status]}
                          variant="secondary"
                        >
                          {todo.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block w-1.5 h-4 rounded-full ${PRIORITY_BAR_COLORS[todo.priority]}`}
                          />
                          <span className="text-muted-foreground">
                            {todo.priority}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {todo.dueDate
                          ? new Date(todo.dueDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(todo.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              />
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditTodo(todo)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => openDeleteDialog(todo)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>

          <CardFooter className="border-t justify-between items-center py-4">
            <Select
              value={String(limit)}
              onValueChange={(v: string) => {
                if (v) {
                  setLimit(Number(v));
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="w-36 rounded-full">
                <span>Showing {limit}</span>
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Create modal */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Todo</DialogTitle>
            </DialogHeader>
            <TodoForm
              onSubmit={handleCreate}
              onCancel={() => setCreateOpen(false)}
              submitLabel="Create"
            />
          </DialogContent>
        </Dialog>

        {/* Edit modal */}
        <Dialog
          open={!!editTodo}
          onOpenChange={(open: boolean) => !open && setEditTodo(null)}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Todo</DialogTitle>
            </DialogHeader>
            {editTodo && (
              <TodoForm
                currentTodoId={editTodo._id.toString()}
                initialValues={{
                  name: editTodo.name,
                  description: editTodo.description,
                  dueDate: editTodo.dueDate
                    ? new Date(editTodo.dueDate).toISOString()
                    : undefined,
                  status: editTodo.status,
                  priority: editTodo.priority,
                  dependsOn: editTodo.dependsOn.map((d) => d.toString()),
                  recurrence: editTodo.recurrence,
                }}
                onSubmit={handleEdit}
                onCancel={() => setEditTodo(null)}
                submitLabel="Save"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setDeleteTarget(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete &ldquo;{deleteTarget?.name}&rdquo;?
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
