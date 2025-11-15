/**
 * TopicSelect Component
 *
 * Dropdown for selecting a topic from user's topics list
 * Handles empty state when user has no topics
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { TopicDto } from "../types";

interface TopicSelectProps {
  topics: TopicDto[];
  value: number | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function TopicSelect({ topics, value, onChange, disabled }: TopicSelectProps) {
  const handleValueChange = (stringValue: string) => {
    const numericValue = parseInt(stringValue, 10);
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  const isEmpty = topics.length === 0;

  return (
    <Select value={value?.toString()} onValueChange={handleValueChange} disabled={disabled || isEmpty}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isEmpty ? "Brak dostępnych tematów" : "Wybierz temat"} />
      </SelectTrigger>
      <SelectContent>
        {topics.map((topic) => (
          <SelectItem key={topic.id} value={topic.id.toString()}>
            {topic.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
