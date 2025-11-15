/**
 * DeleteConfirmationDialog Component
 *
 * Alert dialog for confirming topic deletion
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { TopicDto } from "../types";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  topic: TopicDto | null;
  onConfirm: (topicId: number) => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  topic,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = async () => {
    if (!topic) return;

    try {
      await onConfirm(topic.id);
      // Dialog will be closed by the hook after successful deletion
    } catch {
      // Error handling is done in the hook
    }
  };

  if (!topic) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć ten temat?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta operacja jest nieodwracalna. Temat <strong>&quot;{topic.name}&quot;</strong> zostanie trwale usunięty.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń temat"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
