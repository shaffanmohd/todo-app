import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {MoreHorizontal, ArrowUp, ArrowDown, ChevronsUpDown} from "lucide-react";
import {ITodo} from "@/lib/models/Todo";
import {PRIORITY_BAR_COLORS, STATUS_STYLES} from "@/lib/constants";

export type SortableField =
  | "dueDate"
  | "priority"
  | "status"
  | "name"
  | "createdAt";

export type OrderTypes = "asc" | "desc";

function getSortIcon(
  field: SortableField,
  sort: SortableField | null,
  order: OrderTypes,
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

export type TodoTableListProps = {
  isLoading: boolean;
  todos: ITodo[];
  sort: SortableField | null;
  setSort: (value: SortableField | null) => void;
  order: OrderTypes;
  setOrder: (value: OrderTypes) => void;
  onOpenEditForm: (todo: ITodo) => void;
  onOpenDeleteDialog: (todo: ITodo) => void;
};

export default function TodoTableList({
  isLoading,
  todos,
  sort,
  setSort,
  order,
  setOrder,
  onOpenEditForm,
  onOpenDeleteDialog,
}: TodoTableListProps) {
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
                  <span className="text-muted-foreground">{todo.priority}</span>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" />
                    }
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onOpenEditForm(todo)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onOpenDeleteDialog(todo)}
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
  );
}
