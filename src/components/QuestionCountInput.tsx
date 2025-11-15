/**
 * QuestionCountInput Component
 *
 * Slider for selecting the number of questions to generate (1-10)
 * Displays current value alongside the slider
 */

import { Slider } from "./ui/slider";

interface QuestionCountInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export function QuestionCountInput({ value, onChange, disabled, min = 1, max = 10 }: QuestionCountInputProps) {
  const handleValueChange = (values: number[]) => {
    const newValue = values[0];
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Liczba pytań: {value}</span>
        <span className="text-sm text-muted-foreground">
          {min}-{max}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={1}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
}
