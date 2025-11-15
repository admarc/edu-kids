/**
 * GenerateQuestionsView Component
 *
 * Main view component for question generation
 * Manages state via useGenerateQuestions hook and renders form + results
 */

import { useGenerateQuestions } from "../lib/hooks/useGenerateQuestions";
import { QuestionGeneratorForm } from "./QuestionGeneratorForm";
import { GeneratedQuestionsList } from "./GeneratedQuestionsList";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorAlert } from "./ErrorAlert";

export function GenerateQuestionsView() {
  const {
    topics,
    formData,
    generatedQuestions,
    isLoadingTopics,
    isGenerating,
    error,
    updateFormData,
    handleSubmit,
    handleAccept,
    handleReject,
    handleEdit,
    clearError,
    retryGeneration,
  } = useGenerateQuestions();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Generuj pytania</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Wygeneruj pytania AI dostosowane do wieku dziecka i wybranego tematu
        </p>
      </header>

      {/* Error Alert */}
      {error && (
        <ErrorAlert error={error} onRetry={error.retryable ? retryGeneration : undefined} onDismiss={clearError} />
      )}

      {/* Loading Topics State */}
      {isLoadingTopics && (
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner message="Ładowanie tematów..." />
        </div>
      )}

      {/* Main Content (Form + Results) */}
      {!isLoadingTopics && (
        <>
          {/* Question Generator Form */}
          <QuestionGeneratorForm
            topics={topics}
            formData={formData}
            isLoading={isGenerating}
            onSubmit={handleSubmit}
            onFormDataChange={updateFormData}
          />

          {/* Loading State During Generation */}
          {isGenerating && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner message="Generowanie pytań... To może potrwać kilka sekund." />
            </div>
          )}

          {/* Generated Questions List */}
          {!isGenerating && generatedQuestions.length > 0 && (
            <GeneratedQuestionsList
              questions={generatedQuestions}
              onAccept={handleAccept}
              onReject={handleReject}
              onEdit={handleEdit}
            />
          )}
        </>
      )}
    </div>
  );
}
