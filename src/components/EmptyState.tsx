/**
 * EmptyState Component
 *
 * Displays a friendly message when the user has no topics yet
 */

import { FolderOpen } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <FolderOpen className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Nie masz jeszcze żadnych tematów</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Tematy pomagają organizować pytania. Utwórz pierwszy temat, aby rozpocząć.
      </p>
      <Button onClick={onAddClick} size="lg">
        Utwórz pierwszy temat
      </Button>
    </div>
  );
}
