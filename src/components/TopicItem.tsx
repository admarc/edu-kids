/**
 * TopicItem Component
 *
 * Individual topic item in the list
 * Combines TopicDisplay and TopicActions
 */

import { Card, CardContent } from "./ui/card";
import { TopicDisplay } from "./TopicDisplay";
import { TopicActions } from "./TopicActions";
import type { TopicDto } from "../types";

interface TopicItemProps {
  topic: TopicDto;
  onEdit: (topic: TopicDto) => void;
  onDelete: (topic: TopicDto) => void;
}

export function TopicItem({ topic, onEdit, onDelete }: TopicItemProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md animate-in fade-in slide-in-from-bottom-2">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <TopicDisplay topic={topic} />
        <TopicActions onEdit={() => onEdit(topic)} onDelete={() => onDelete(topic)} />
      </CardContent>
    </Card>
  );
}
