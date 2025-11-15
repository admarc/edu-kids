/**
 * AgeGroupSelect Component
 *
 * Dropdown for selecting child's age group
 * Uses predefined age groups from types
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AGE_GROUPS } from "../types";

interface AgeGroupSelectProps {
  value: number | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function AgeGroupSelect({ value, onChange, disabled }: AgeGroupSelectProps) {
  const handleValueChange = (stringValue: string) => {
    const numericValue = parseInt(stringValue, 10);
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  return (
    <Select value={value?.toString()} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Wybierz grupę wiekową" />
      </SelectTrigger>
      <SelectContent>
        {AGE_GROUPS.map((group) => (
          <SelectItem key={group.value} value={group.value.toString()}>
            {group.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
