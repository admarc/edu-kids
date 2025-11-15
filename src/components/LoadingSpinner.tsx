/**
 * LoadingSpinner Component
 *
 * Displays an animated spinner during loading states
 */

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Ładowanie..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
