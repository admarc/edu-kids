/**
 * ErrorAlert Component
 *
 * Displays error messages with optional retry action
 * Uses Shadcn Alert component for consistent styling
 */

import { Button } from "./ui/button";
import { AlertCircle, X, RefreshCw } from "lucide-react";
import type { ErrorType } from "../types";

interface ErrorAlertProps {
  error: ErrorType | null;
  onRetry?: () => void;
  onDismiss: () => void;
}

export function ErrorAlert({ error, onRetry, onDismiss }: ErrorAlertProps) {
  if (!error) {
    return null;
  }

  return (
    <div
      className="relative rounded-lg border border-destructive/50 bg-destructive/10 p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-destructive">{error.message}</p>
          {error.retryable && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-destructive/50 hover:bg-destructive/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Spróbuj ponownie
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-6 w-6 flex-shrink-0 hover:bg-destructive/20"
          aria-label="Zamknij alert"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
