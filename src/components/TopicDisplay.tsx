/**
 * TopicDisplay Component
 *
 * Displays topic information (name and creation date)
 */

import type { TopicDto } from "../types";

interface TopicDisplayProps {
  topic: TopicDto;
}

/**
 * Formats a date string to a relative time format (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "przed chwilą";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minutę" : "minut"} temu`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "godzinę" : "godzin"} temu`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? "dzień" : "dni"} temu`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "miesiąc" : "miesięcy"} temu`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${diffInYears === 1 ? "rok" : "lat"} temu`;
}

export function TopicDisplay({ topic }: TopicDisplayProps) {
  const relativeTime = formatRelativeTime(topic.created_at);

  return (
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-lg truncate">{topic.name}</h3>
      <p className="text-sm text-muted-foreground">Utworzono {relativeTime}</p>
    </div>
  );
}
