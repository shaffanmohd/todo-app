import {Badge} from "@/components/ui/badge";
import {Card, CardHeader, CardTitle} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  PRIORITY_BAR_COLORS,
  STATUS_STYLES,
  TODO_PRIORITY,
  TODO_STATUS,
} from "@/lib/constants";
import {Loader2} from "lucide-react";

export type TodoTableHeaderProps = {
  isFetching: boolean;
  statusFilter: string;
  statusOnValueChange: (v: string | null) => void;
  priorityFilter: string;
  prioritysOnValueChange: (v: string | null) => void;
  dueDateFilter: string;
  dueDateFilterOnValueChange: (v: string | null) => void;
  dependencyFilter: string;
  dependencyFilterrOnValueChange: (v: string | null) => void;
};

export default function TodoTableHeader({
  isFetching,
  statusFilter,
  statusOnValueChange,
  priorityFilter,
  prioritysOnValueChange,
  dueDateFilter,
  dueDateFilterOnValueChange,
  dependencyFilter,
  dependencyFilterrOnValueChange,
}: TodoTableHeaderProps) {
  return (
    <>
      <CardTitle className="text-base flex items-center gap-2">
        All todos
        {isFetching && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </CardTitle>
      <div className="flex gap-3 pt-2 flex-wrap">
        <Select value={statusFilter} onValueChange={statusOnValueChange}>
          <SelectTrigger className="w-44 rounded-full">
            <span>Status: {statusFilter === "all" ? "All" : statusFilter}</span>
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

        <Select value={priorityFilter} onValueChange={prioritysOnValueChange}>
          <SelectTrigger className="w-44 rounded-full">
            <span>
              Priority: {priorityFilter === "all" ? "All" : priorityFilter}
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
          onValueChange={dueDateFilterOnValueChange}
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
          onValueChange={dependencyFilterrOnValueChange}
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
    </>
  );
}
