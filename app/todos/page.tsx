"use client";

import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  type TodoFormValues,
} from "@/lib/api-client";
import type {ITodo} from "@/lib/models/Todo";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";

import {toast} from "sonner";
import TodoTableHeader, {
  TodoTableHeaderProps,
} from "../components/TodoTableHeader";
import TodoTableList, {
  SortableField,
  TodoTableListProps,
} from "../components/TodoTableList";
import Pagination from "../components/Pagination";
import CreateTodoModal from "../components/CreateTodoModal";
import EditTodoModal from "../components/EditTodoModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

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

  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["todos"]});
      setCreateOpen(false);
      toast.success("Todo created.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to create todo");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({id, values}: {id: string; values: Partial<TodoFormValues>}) =>
      updateTodo(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["todos"]});
      setEditTodo(null);
      toast.success("Todo updated.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update todo");
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

  const todoTableHeaderProps: TodoTableHeaderProps = {
    isFetching,
    statusFilter,
    statusOnValueChange: (v: string | null) => {
      if (v) {
        setStatusFilter(v);
        setPage(1);
      }
    },
    priorityFilter,
    prioritysOnValueChange: (v: string | null) => {
      if (v) {
        setPriorityFilter(v);
        setPage(1);
      }
    },
    dueDateFilter,
    dueDateFilterOnValueChange: (v: string | null) => {
      if (v) {
        setDueDateFilter(v);
        setPage(1);
      }
    },
    dependencyFilter,
    dependencyFilterrOnValueChange: (v: string | null) => {
      if (v) {
        setDependencyFilter(v);
        setPage(1);
      }
    },
  };

  const todoTableListProps: TodoTableListProps = {
    isLoading,
    todos,
    sort,
    setSort,
    order,
    setOrder,
    onOpenEditForm: setEditTodo,
    onOpenDeleteDialog: openDeleteDialog,
  };

  return (
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
          <TodoTableHeader {...todoTableHeaderProps} />
        </CardHeader>

        <CardContent>
          <TodoTableList {...todoTableListProps} />
        </CardContent>

        <CardFooter className="border-t justify-between items-center py-4">
          <Pagination
            limit={limit}
            page={page}
            totalPages={totalPages}
            setLimit={setLimit}
            setPage={setPage}
          />
        </CardFooter>
      </Card>

      {/* Create modal */}
      <CreateTodoModal
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        handleCreate={handleCreate}
      />

      {/* Edit modal */}
      <EditTodoModal
        editTodo={editTodo}
        setEditTodo={setEditTodo}
        handleEdit={handleEdit}
      />

      {/* Delete confirmation */}
      <DeleteConfirmationModal
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        confirmDelete={confirmDelete}
        deleteMutation={deleteMutation}
      />
    </div>
  );
}
