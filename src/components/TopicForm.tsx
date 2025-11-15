/**
 * TopicForm Component
 *
 * Reusable form for creating and editing topics
 * Handles validation, character counting, and loading states
 */

import { useState, useEffect, type FormEvent } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { ValidationRules } from "../types";

interface TopicFormProps {
  initialValue?: string;
  onSubmit: (data: { name: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

export function TopicForm({
  initialValue = "",
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Dodaj",
}: TopicFormProps) {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState<string | undefined>();

  // Update name when initialValue changes (for edit mode)
  useEffect(() => {
    setName(initialValue);
  }, [initialValue]);

  // Real-time validation
  const validateName = (value: string): string | undefined => {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return "Nazwa tematu jest wymagana";
    }

    if (trimmedValue.length > ValidationRules.topic.nameMaxLength) {
      return `Nazwa tematu może mieć maksymalnie ${ValidationRules.topic.nameMaxLength} znaków`;
    }

    return undefined;
  };

  // Handle input change with validation
  const handleChange = (value: string) => {
    setName(value);
    setError(validateName(value));
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Final validation before submit
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit({ name: name.trim() });
  };

  const isValid = !error && name.trim().length > 0;
  const charCount = name.length;
  const isOverLimit = charCount > ValidationRules.topic.nameMaxLength;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="topic-name">Nazwa tematu</Label>
        <Input
          id="topic-name"
          type="text"
          value={name}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isSubmitting}
          placeholder="np. Matematyka, Przyroda..."
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          className={error ? "border-destructive" : ""}
        />
        <div className="flex items-center justify-between">
          <div className="min-h-5">{error && <p className="text-sm text-destructive">{error}</p>}</div>
          <p className={`text-sm ${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {charCount} / {ValidationRules.topic.nameMaxLength}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Anuluj
        </Button>
        <Button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? "Zapisywanie..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
