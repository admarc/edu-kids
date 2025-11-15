/**
 * GenerateButton Component
 *
 * Submit button for question generation form
 * Displays loading state with spinner during generation
 */

import { Button } from "./ui/button";
import { LoaderCircle } from "lucide-react";

interface GenerateButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function GenerateButton({ isLoading, disabled, onClick }: GenerateButtonProps) {
  return (
    <Button type="submit" disabled={disabled || isLoading} onClick={onClick} className="w-full sm:w-auto">
      {isLoading ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Generowanie...
        </>
      ) : (
        "Generuj pytania"
      )}
    </Button>
  );
}
