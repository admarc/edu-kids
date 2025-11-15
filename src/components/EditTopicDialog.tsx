/**
 * EditTopicDialog Component
 *
 * Modal dialog for editing an existing topic
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { TopicForm } from "./TopicForm";
import type { TopicDto, UpdateTopicCommand } from "../types";

interface EditTopicDialogProps {
  isOpen: boolean;
  topic: TopicDto | null;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateTopicCommand) => Promise<void>;
  isSubmitting: boolean;
}

export function EditTopicDialog({ isOpen, topic, onClose, onSubmit, isSubmitting }: EditTopicDialogProps) {
  const handleSubmit = async (data: { name: string }) => {
    if (!topic) return;

    try {
      await onSubmit(topic.id, data);
      // Dialog will be closed by the hook after successful submission
    } catch {
      // Error handling is done in the hook
      // Dialog remains open for user to retry
    }
  };

  if (!topic) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj temat</DialogTitle>
          <DialogDescription>Zmień nazwę tematu. Wszystkie powiązane pytania pozostaną bez zmian.</DialogDescription>
        </DialogHeader>
        <TopicForm
          initialValue={topic.name}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitLabel="Zapisz"
        />
      </DialogContent>
    </Dialog>
  );
}
