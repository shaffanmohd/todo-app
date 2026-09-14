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
import {ITodo} from "@/lib/models/Todo";
import {UseMutationResult} from "@tanstack/react-query";
import {SetStateAction} from "react";

type DeleteConfirmationModalProps = {
  deleteTarget: ITodo | null;
  setDeleteTarget: (value: SetStateAction<ITodo | null>) => void;
  confirmDelete: () => void;
  deleteMutation: UseMutationResult<
    {
      data: {
        message: string;
      };
    },
    unknown,
    string,
    unknown
  >;
};

export default function DeleteConfirmationModal({
  deleteTarget,
  setDeleteTarget,
  confirmDelete,
  deleteMutation,
}: DeleteConfirmationModalProps) {
  return (
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
  );
}
