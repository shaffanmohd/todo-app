import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TodoForm from "./TodoForm";
import {SetStateAction} from "react";
import {TodoFormValues} from "@/lib/api-client";
import {ITodo} from "@/lib/models/Todo";

type EditTodoModalProps = {
  editTodo: ITodo | null;
  setEditTodo: (value: SetStateAction<ITodo | null>) => void;
  handleEdit: (values: TodoFormValues) => Promise<void>;
};
export default function EditTodoModal({
  editTodo,
  setEditTodo,
  handleEdit,
}: EditTodoModalProps) {
  return (
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
  );
}
