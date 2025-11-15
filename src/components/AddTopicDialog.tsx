/**
 * AddTopicDialog Component
 *
 * Modal dialog for creating a new topic
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { TopicForm } from "./TopicForm";
import type { CreateTopicCommand } from "../types";

interface AddTopicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTopicCommand) => Promise<void>;
  isSubmitting: boolean;
}

export function AddTopicDialog({ isOpen, onClose, onSubmit, isSubmitting }: AddTopicDialogProps) {
  const handleSubmit = async (data: { name: string }) => {
    try {
      await onSubmit(data);
      // Dialog will be closed by the hook after successful submission
    } catch {
      // Error handling is done in the hook
      // Dialog remains open for user to retry
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj nowy temat</DialogTitle>
          <DialogDescription>Utwórz nowy temat, aby organizować pytania do nauki.</DialogDescription>
        </DialogHeader>
        <TopicForm onSubmit={handleSubmit} onCancel={onClose} isSubmitting={isSubmitting} submitLabel="Dodaj" />
      </DialogContent>
    </Dialog>
  );
}
