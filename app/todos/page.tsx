"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { TODO_STATUS, TODO_PRIORITY } from "@/lib/constants";
import type { TodoStatus, TodoPriority } from "@/lib/constants";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  type TodoFormValues,
} from "@/lib/api-client";
import type { ITodo } from "@/lib/models/Todo";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  SelectValue,
} from "@/components/ui/select";
import TodoForm from "../components/TodoForm";

type SortableField = "dueDate" | "priority" | "status" | "name" | "createdAt";

const STATUS_STYLES: Record<TodoStatus, string> = {
  "Not Started": "bg-muted text-muted-foreground",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Archived: "bg-secondary text-secondary-foreground",
};

const PRIORITY_BAR_COLORS: Record<TodoPriority, string> = {
  Low: "bg-emerald-400",
  Medium: "bg-amber-400",
  High: "bg-red-500",
};

export default function TodosPage() {
  const [todos, setTodos] = useState<ITodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [limit, setLimit] = useState(25);
  const [sort, setSort] = useState<SortableField>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTodo, setEditTodo] = useState<ITodo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ITodo | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTodos({
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        sort,
        order,
        page,
        limit,
      });
      setTodos(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, sort, order, page, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/filter-change pattern
    loadTodos();
  }, [loadTodos]);

  async function handleCreate(values: TodoFormValues) {
    await createTodo(values);
    setCreateOpen(false);
    await loadTodos();
  }

  async function handleEdit(values: TodoFormValues) {
    if (!editTodo) return;
    await updateTodo(editTodo._id.toString(), values);
    setEditTodo(null);
    await loadTodos();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteTodo(deleteTarget._id.toString());
      setDeleteTarget(null);
      await loadTodos();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete todo",
      );
      setDeleteTarget(null);
    }
  }

  function toggleSort(field: SortableField) {
    if (sort === field) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("asc");
    }
  }

  function sortIndicator(field: SortableField) {
    if (sort !== field) return null;
    return order === "asc" ? "▲" : "▼";
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

        {error && <p className="text-sm text-destructive">{error}</p>}
        {deleteError && (
          <p className="text-sm text-destructive">{deleteError}</p>
        )}

        {/* Main card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All todos</CardTitle>
            <div className="flex gap-3 pt-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  if (v) {
                    setStatusFilter(v);
                    setPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-40 rounded-full">
                  <SelectValue placeholder="All statuses" />
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
                onValueChange={(v) => {
                  if (v) {
                    setPriorityFilter(v);
                    setPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-40 rounded-full">
                  <SelectValue placeholder="All priorities" />
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
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer text-muted-foreground"
                    onClick={() => toggleSort("name")}
                  >
                    Name {sortIndicator("name")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-muted-foreground"
                    onClick={() => toggleSort("status")}
                  >
                    Status {sortIndicator("status")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-muted-foreground"
                    onClick={() => toggleSort("priority")}
                  >
                    Priority {sortIndicator("priority")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-muted-foreground"
                    onClick={() => toggleSort("dueDate")}
                  >
                    Due Date {sortIndicator("dueDate")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-muted-foreground"
                    onClick={() => toggleSort("createdAt")}
                  >
                    Created {sortIndicator("createdAt")}
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && todos.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No todos found.
                    </TableCell>
                  </TableRow>
                )}
                {todos.map((todo) => (
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
                            onClick={() => setDeleteTarget(todo)}
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
              onValueChange={(v) => {
                if (v) {
                  setLimit(Number(v));
                  setPage(1); // reset to page 1 since page count changes with limit
                }
              }}
            >
              <SelectTrigger className="w-32 rounded-full">
                <span>Showing {limit}</span>
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
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
          onOpenChange={(open) => !open && setEditTodo(null)}
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
          onOpenChange={(open) => !open && setDeleteTarget(null)}
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
                onClick={confirmDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
