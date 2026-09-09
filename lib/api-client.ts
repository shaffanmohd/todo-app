import type { ITodo } from "@/lib/models/Todo";
import { TodoPriority, TodoStatus } from "./constants";

const BASE_URL = "/api/todos";

export interface TodoListResponse {
  data: ITodo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface ApiError {
  error: string;
  details?: string[] | string;
}

export interface TodoQueryParams {
  status?: string;
  priority?: string;
  dueDateStatus?: string;
  dependencyType?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface TodoDetail extends Omit<ITodo, "dependsOn"> {
  dependsOn: PopulatedTodoRef[];
  dependents: PopulatedTodoRef[];
}

export interface TodoDetailResponse {
  data: TodoDetail;
}

export interface PopulatedTodoRef {
  _id: string;
  name: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string | Date | null;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) {
    const err = body as ApiError;
    throw new Error(
      Array.isArray(err.details)
        ? err.details.join(", ")
        : err.error || "Request failed",
    );
  }
  return body as T;
}

export async function getTodos(
  params: TodoQueryParams = {},
): Promise<TodoListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  const res = await fetch(`${BASE_URL}?${query.toString()}`);
  return handleResponse<TodoListResponse>(res);
}

export async function getTodo(id: string): Promise<TodoDetailResponse> {
  const res = await fetch(`${BASE_URL}/${id}`);
  return handleResponse<TodoDetailResponse>(res);
}

export interface TodoFormValues {
  name: string;
  description?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  dependsOn?: string[];
  recurrence?: { frequency: string; intervalDays?: number };
}

export async function createTodo(
  values: TodoFormValues,
): Promise<{ data: ITodo }> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return handleResponse(res);
}

export async function updateTodo(
  id: string,
  values: Partial<TodoFormValues>,
): Promise<{ data: ITodo }> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return handleResponse(res);
}

export async function deleteTodo(
  id: string,
): Promise<{ data: { message: string } }> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  return handleResponse(res);
}

export async function completeTodo(
  id: string,
): Promise<{ data: { completed: ITodo; nextOccurrence: ITodo | null } }> {
  const res = await fetch(`${BASE_URL}/${id}/complete`, { method: "POST" });
  return handleResponse(res);
}
