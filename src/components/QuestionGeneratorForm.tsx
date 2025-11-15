/**
 * QuestionGeneratorForm Component
 *
 * Main form for configuring and generating questions
 * Combines all form inputs: age group, topic, and question count
 */

import { type FormEvent } from "react";
import { AgeGroupSelect } from "./AgeGroupSelect";
import { TopicSelect } from "./TopicSelect";
import { QuestionCountInput } from "./QuestionCountInput";
import { GenerateButton } from "./GenerateButton";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import type { TopicDto, GenerateQuestionsFormData } from "../types";

interface QuestionGeneratorFormProps {
  topics: TopicDto[];
  formData: GenerateQuestionsFormData;
  isLoading: boolean;
  onSubmit: () => Promise<void>;
  onFormDataChange: (field: keyof GenerateQuestionsFormData, value: number | undefined) => void;
}

export function QuestionGeneratorForm({
  topics,
  formData,
  isLoading,
  onSubmit,
  onFormDataChange,
}: QuestionGeneratorFormProps) {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  // Check if form is valid
  const isFormValid =
    formData.age_group !== undefined && formData.topic_id !== undefined && formData.count >= 1 && formData.count <= 10;

  const hasTopics = topics.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generuj pytania AI</CardTitle>
        <CardDescription id="form-description">
          Wybierz grupę wiekową, temat i liczbę pytań, a AI wygeneruje dla Ciebie propozycje pytań
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasTopics ? (
          <div className="text-center py-8" role="status">
            <p className="text-muted-foreground mb-4">Aby generować pytania, musisz najpierw utworzyć temat.</p>
            <a
              href="/topics"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Utwórz pierwszy temat
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" aria-describedby="form-description">
            {/* Age Group Selection */}
            <div className="space-y-2">
              <Label htmlFor="age-group">Grupa wiekowa</Label>
              <AgeGroupSelect
                value={formData.age_group}
                onChange={(value) => onFormDataChange("age_group", value)}
                disabled={isLoading}
              />
            </div>

            {/* Topic Selection */}
            <div className="space-y-2">
              <Label htmlFor="topic">Temat</Label>
              <TopicSelect
                topics={topics}
                value={formData.topic_id}
                onChange={(value) => onFormDataChange("topic_id", value)}
                disabled={isLoading}
              />
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <Label htmlFor="question-count">Liczba pytań</Label>
              <QuestionCountInput
                value={formData.count}
                onChange={(value) => onFormDataChange("count", value)}
                disabled={isLoading}
                min={1}
                max={10}
              />
            </div>

            {/* Submit Button */}
            <GenerateButton isLoading={isLoading} disabled={!isFormValid || isLoading} />
          </form>
        )}
      </CardContent>
    </Card>
  );
}
