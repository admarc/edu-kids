/**
 * TopicsList Component
 *
 * Displays a list of all user topics
 */

import { TopicItem } from "./TopicItem";
import type { TopicDto } from "../types";

interface TopicsListProps {
  topics: TopicDto[];
  onEdit: (topic: TopicDto) => void;
  onDelete: (topic: TopicDto) => void;
}

export function TopicsList({ topics, onEdit, onDelete }: TopicsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-muted-foreground">Twoje tematy ({topics.length})</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {topics.map((topic) => (
          <TopicItem key={topic.id} topic={topic} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
