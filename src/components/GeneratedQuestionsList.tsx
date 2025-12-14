/**
 * GeneratedQuestionsList Component
 *
 * Displays a list of generated questions with a header
 * Each question is rendered in a QuestionCard component
 */

import { QuestionCard } from "./QuestionCard";
import type { GeneratedQuestionDto } from "../types";

interface GeneratedQuestionsListProps {
  questions: GeneratedQuestionDto[];
  onAccept: (questionId: number) => Promise<void>;
  onReject: (questionId: number) => Promise<void>;
  onEdit: (questionId: number, newContent: string) => Promise<void>;
}

export function GeneratedQuestionsList({ questions, onAccept, onReject, onEdit }: GeneratedQuestionsListProps) {
  if (questions.length === 0) {
    return null;
  }

  const questionCount = questions.length;
  const questionLabel = questionCount === 1 ? "pytanie" : "pytań";

  return (
    <section id="generated-questions-list" className="space-y-6" aria-label="Wygenerowane pytania">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold">Wygenerowane pytania</h2>
        <p className="text-muted-foreground mt-1" aria-live="polite" aria-atomic="true">
          Wygenerowano {questionCount} {questionLabel}. Zatwierdź, edytuj lub odrzuć każde z nich.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-1" role="list">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            onAccept={onAccept}
            onReject={onReject}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}
