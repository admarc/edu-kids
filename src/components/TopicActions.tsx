/**
 * TopicActions Component
 *
 * Action buttons for editing and deleting a topic
 */

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface TopicActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function TopicActions({ onEdit, onDelete }: TopicActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        aria-label="Edytuj temat"
        title="Edytuj temat"
        className="touch-manipulation"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label="Usuń temat"
        title="Usuń temat"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
