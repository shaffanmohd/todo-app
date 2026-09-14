import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TodoForm from "./TodoForm";
import {Dispatch, SetStateAction} from "react";
import {TodoFormValues} from "@/lib/api-client";

type CreateTodoModalProps = {
  createOpen: boolean;
  setCreateOpen: Dispatch<SetStateAction<boolean>>;
  handleCreate: (values: TodoFormValues) => Promise<void>;
};
export default function CreateTodoModal({
  createOpen,
  setCreateOpen,
  handleCreate,
}: CreateTodoModalProps) {
  return (
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
  );
}
