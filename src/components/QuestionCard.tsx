/**
 * QuestionCard Component
 *
 * Displays a single generated question with actions (accept, reject, edit)
 * Supports two modes: view and edit
 */

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Check, X, Pencil, Save, Undo2, LoaderCircle } from "lucide-react";
import { Label } from "./ui/label";
import type { GeneratedQuestionDto, QuestionDto } from "../types";

interface QuestionCardProps {
  question: GeneratedQuestionDto | QuestionDto;
  index: number;
  onAccept: (questionId: number) => Promise<void>;
  onReject: (questionId: number) => Promise<void>;
  onEdit: (questionId: number, newContent: string) => Promise<void>;
}

export function QuestionCard({ question, index, onAccept, onReject, onEdit }: QuestionCardProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editedContent, setEditedContent] = useState(question.content);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (mode === "edit" && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [mode]);

  // Handle accept action
  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(question.id);
    } catch {
      // Error is already handled in the hook with toast
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle reject action
  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(question.id);
    } catch {
      // Error is already handled in the hook with toast
    } finally {
      setIsRejecting(false);
    }
  };

  // Handle edit mode toggle
  const handleEditClick = () => {
    setMode("edit");
    setEditedContent(question.content);
    setError(undefined);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    // Validate content
    const trimmedContent = editedContent.trim();
    if (!trimmedContent) {
      setError("Pytanie nie może być puste");
      return;
    }

    setIsEditing(true);
    setError(undefined);

    try {
      await onEdit(question.id, trimmedContent);
      setMode("view");
    } catch {
      // Error is already handled in the hook with toast
    } finally {
      setIsEditing(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setMode("view");
    setEditedContent(question.content);
    setError(undefined);
  };

  // Handle keyboard events in edit mode
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
    // Ctrl+Enter or Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  const isProcessing = isAccepting || isRejecting || isEditing;

  return (
    <Card
      className="transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-300"
      role="article"
      aria-labelledby={`question-${question.id}-title`}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {index + 1}
          </span>
          <span id={`question-${question.id}-title`} className="text-sm text-muted-foreground">
            Pytanie
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {mode === "view" ? (
          <p className="text-base leading-relaxed">{question.content}</p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`question-${question.id}`}>
              Edytuj pytanie
              <span className="text-xs text-muted-foreground ml-2">(Esc - anuluj, Ctrl+Enter - zapisz)</span>
            </Label>
            <textarea
              ref={textareaRef}
              id={`question-${question.id}`}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isEditing}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Wpisz treść pytania..."
              aria-describedby={error ? `question-${question.id}-error` : undefined}
            />
            {error && (
              <p id={`question-${question.id}-error`} className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {mode === "view" ? (
          <>
            {question.status === "pending" && (
              <Button
                variant="default"
                size="sm"
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1 sm:flex-none"
                aria-label={`Zatwierdź pytanie ${index + 1}`}
              >
                {isAccepting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Zatwierdzanie...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                    Zatwierdź
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
              aria-label={`Edytuj pytanie ${index + 1}`}
            >
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              Edytuj
            </Button>
            {question.status === "pending" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 sm:flex-none"
                aria-label={`Odrzuć pytanie ${index + 1}`}
              >
                {isRejecting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Odrzucanie...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" aria-hidden="true" />
                    Odrzuć
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveEdit}
              disabled={isEditing || !editedContent.trim()}
              className="flex-1 sm:flex-none"
              aria-label="Zapisz zmiany"
            >
              {isEditing ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  Zapisz
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              disabled={isEditing}
              className="flex-1 sm:flex-none"
              aria-label="Anuluj edycję"
            >
              <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Anuluj
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
