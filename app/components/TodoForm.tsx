"use client";

import { useEffect, useState } from "react";
import {
  TODO_STATUS,
  TODO_PRIORITY,
  RECURRENCE_FREQUENCY,
  STATUS_STYLES,
  PRIORITY_BAR_COLORS,
} from "@/lib/constants";
import { getTodos, type TodoFormValues } from "@/lib/api-client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface TodoOption {
  _id: string;
  name: string;
}

interface TodoFormProps {
  initialValues?: Partial<TodoFormValues>;
  currentTodoId?: string;
  onSubmit: (values: TodoFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function TodoForm({
  initialValues,
  currentTodoId,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: TodoFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? "");
  const [status, setStatus] = useState(initialValues?.status ?? TODO_STATUS[0]);
  const [priority, setPriority] = useState(
    initialValues?.priority ?? TODO_PRIORITY[1],
  );
  const [dependsOn, setDependsOn] = useState<string[]>(
    initialValues?.dependsOn ?? [],
  );
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(
    initialValues?.recurrence?.frequency ?? "none",
  );
  const [intervalDays, setIntervalDays] = useState(
    initialValues?.recurrence?.intervalDays?.toString() ?? "",
  );

  const [todoOptions, setTodoOptions] = useState<TodoOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTodos({ limit: 500 })
      .then((res) => {
        const options = res.data
          .filter((t) => t._id.toString() !== currentTodoId)
          .map((t) => ({ _id: t._id.toString(), name: t.name }));
        setTodoOptions(options);
      })
      .catch(() => setError("Failed to load dependency options"));
  }, [currentTodoId]);

  function toggleDependency(id: string) {
    setDependsOn((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (recurrenceFrequency !== "none" && dependsOn.length > 0) {
      setError("A todo with dependencies cannot be set to recur");
      return;
    }

    const values: TodoFormValues = {
      name: name.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      status,
      priority,
      dependsOn,
      recurrence: {
        frequency: recurrenceFrequency,
        intervalDays:
          recurrenceFrequency === "custom" && intervalDays
            ? parseInt(intervalDays, 10)
            : undefined,
      },
    };

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save todo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded bg-red-50 border border-red-200 text-red-700 text-sm p-2">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate ? dueDate.slice(0, 10) : ""}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as typeof priority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
      </div>

      <div className="space-y-1">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as typeof status)}
        >
          <SelectTrigger>
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
      </div>

      <div className="space-y-1">
        <Label>Depends on (must be completed first)</Label>
        <div className="border rounded max-h-40 overflow-y-auto p-2 space-y-2">
          {todoOptions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No other todos available
            </p>
          )}
          {todoOptions.map((opt) => (
            <div key={opt._id} className="flex items-center gap-2">
              <Checkbox
                id={`dep-${opt._id}`}
                checked={dependsOn.includes(opt._id)}
                onCheckedChange={() => toggleDependency(opt._id)}
              />
              <Label
                htmlFor={`dep-${opt._id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {opt.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Recurrence</Label>
        <Select
          value={recurrenceFrequency}
          onValueChange={(v) =>
            setRecurrenceFrequency(v as typeof recurrenceFrequency)
          }
          disabled={dependsOn.length > 0}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECURRENCE_FREQUENCY.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {dependsOn.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Recurrence is disabled for todos with dependencies.
          </p>
        )}

        {recurrenceFrequency === "custom" && (
          <div className="pt-2 space-y-1">
            <Label htmlFor="intervalDays">Interval (days)</Label>
            <Input
              id="intervalDays"
              type="number"
              min={1}
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
