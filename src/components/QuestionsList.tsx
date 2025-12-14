/**
 * QuestionsList Component
 *
 * Displays a paginated list of questions with actions
 * Each question is rendered in a QuestionCard component
 */

import { QuestionCard } from "./QuestionCard";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { QuestionDto, PaginationDto } from "../types";

interface QuestionsListProps {
  questions: QuestionDto[];
  pagination: PaginationDto;
  onPageChange: (page: number) => void;
  onAccept: (questionId: number) => Promise<void>;
  onReject: (questionId: number) => Promise<void>;
  onEdit: (questionId: number, newContent: string) => Promise<void>;
}

export function QuestionsList({ questions, pagination, onPageChange, onAccept, onReject, onEdit }: QuestionsListProps) {
  if (questions.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <section className="space-y-6">
      {/* Header with summary */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold">Znalezione pytania</h2>
        <p className="text-muted-foreground mt-1">
          Wyświetlanie {startItem}-{endItem} z {pagination.total} pytań
        </p>
      </div>

      {/* Questions Grid */}
      <div className="grid gap-4 sm:grid-cols-1" role="list" aria-label="Lista pytań">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={(pagination.page - 1) * pagination.limit + index}
            onAccept={onAccept}
            onReject={onReject}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Strona {pagination.page} z {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              aria-label="Poprzednia strona"
            >
              <ChevronLeft className="h-4 w-4" />
              Poprzednia
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              aria-label="Następna strona"
            >
              Następna
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
