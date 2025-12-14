/**
 * BrowseQuestionsView Component
 *
 * Main view component for browsing existing questions
 * Manages state via useBrowseQuestions hook and renders filters + results
 */

import { useBrowseQuestions } from "../lib/hooks/useBrowseQuestions";
import { QuestionsList } from "./QuestionsList";
import { QuestionsFilters } from "./QuestionsFilters";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorAlert } from "./ErrorAlert";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";

export function BrowseQuestionsView() {
  const {
    questions,
    isLoading,
    error,
    pagination,
    filters,
    loadQuestions,
    updateFilters,
    handleAccept,
    handleReject,
    handleEdit,
    clearError,
  } = useBrowseQuestions();

  const handlePageChange = (newPage: number) => {
    loadQuestions(newPage);
  };

  const handleRetry = () => {
    loadQuestions();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Przeglądaj pytania</h1>
        <p className="text-sm text-muted-foreground mt-1">Przeglądaj wygenerowane pytania i zarządzaj ich statusem</p>
      </header>

      {/* Error Alert */}
      {error && <ErrorAlert error={error} onRetry={error.retryable ? handleRetry : undefined} onDismiss={clearError} />}

      {/* Filters */}
      <QuestionsFilters filters={filters} onFiltersChange={updateFilters} />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner message="Ładowanie pytań..." />
        </div>
      )}

      {/* Questions List */}
      {!isLoading && (
        <>
          {questions.length > 0 ? (
            <QuestionsList
              questions={questions}
              pagination={pagination}
              onPageChange={handlePageChange}
              onAccept={handleAccept}
              onReject={handleReject}
              onEdit={handleEdit}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {Object.keys(filters).some((key) => {
                  const value = filters[key as keyof typeof filters];
                  return Array.isArray(value) ? value.length > 0 : value !== undefined;
                })
                  ? "Brak pytań spełniających kryteria filtrowania"
                  : "Brak pytań do wyświetlenia"}
              </div>
              <Button variant="outline" onClick={() => loadQuestions()} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Odśwież
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
