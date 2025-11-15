/**
 * PageHeader Component
 *
 * Header for the topics page with title and add button
 */

import { Plus } from "lucide-react";
import { Button } from "./ui/button";

interface PageHeaderProps {
  onAddClick: () => void;
}

export function PageHeader({ onAddClick }: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Moje tematy</h1>
        <p className="text-sm text-muted-foreground mt-1">Zarządzaj swoimi tematami do nauki</p>
      </div>
      <Button onClick={onAddClick} className="sm:flex-shrink-0">
        <Plus className="mr-2 h-4 w-4" />
        Dodaj temat
      </Button>
    </header>
  );
}
