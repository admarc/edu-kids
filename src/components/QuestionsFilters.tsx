/**
 * QuestionsFilters Component
 *
 * Provides filtering controls for questions browsing
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Filter, X } from "lucide-react";
import type { BrowseQuestionsFilters } from "../lib/hooks/useBrowseQuestions";
import type { TopicDto } from "../types";
import { AGE_GROUPS } from "../types";

interface QuestionsFiltersProps {
  filters: BrowseQuestionsFilters;
  onFiltersChange: (newFilters: Partial<BrowseQuestionsFilters>) => void;
}

export function QuestionsFilters({ filters, onFiltersChange }: QuestionsFiltersProps) {
  const [topics, setTopics] = useState<TopicDto[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load topics for filter dropdown
  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setIsLoadingTopics(true);
    try {
      const response = await fetch("/api/topics");
      if (response.ok) {
        const data = await response.json();
        setTopics(data.data || []);
      }
    } catch {
      // Silently fail - topics filter will be disabled
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleStatusChange = (status: "pending" | "accepted" | "rejected", checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked ? [...currentStatuses, status] : currentStatuses.filter((s) => s !== status);

    onFiltersChange({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleAgeGroupChange = (ageGroup: number | "all") => {
    onFiltersChange({
      age_group: ageGroup === "all" ? undefined : ageGroup,
    });
  };

  const handleTopicChange = (topicId: number | "all") => {
    onFiltersChange({
      topic_id: topicId === "all" ? undefined : topicId,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: undefined,
      age_group: undefined,
      topic_id: undefined,
    });
  };

  const hasActiveFilters = filters.status || filters.age_group || filters.topic_id;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtry
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
                <X className="h-3 w-3 mr-1" />
                Wyczyść
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? "Ukryj" : "Pokaż"} filtry
            </Button>
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent className="space-y-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status pytania</Label>
            <div className="flex flex-wrap gap-4">
              {[
                { value: "pending", label: "Oczekujące" },
                { value: "accepted", label: "Zaakceptowane" },
                { value: "rejected", label: "Odrzucone" },
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${value}`}
                    checked={(filters.status || []).includes(value as "pending" | "accepted" | "rejected")}
                    onCheckedChange={(checked) =>
                      handleStatusChange(value as "pending" | "accepted" | "rejected", checked as boolean)
                    }
                  />
                  <Label htmlFor={`status-${value}`} className="text-sm font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Age Group Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Grupa wiekowa</Label>
            <Select
              value={filters.age_group?.toString() || "all"}
              onValueChange={(value) => handleAgeGroupChange(value === "all" ? "all" : parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Wszystkie grupy wiekowe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie grupy wiekowe</SelectItem>
                {AGE_GROUPS.map((group) => (
                  <SelectItem key={group.value} value={group.value.toString()}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Temat</Label>
            <Select
              value={filters.topic_id?.toString() || "all"}
              onValueChange={(value) => handleTopicChange(value === "all" ? "all" : parseInt(value))}
              disabled={isLoadingTopics}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={isLoadingTopics ? "Ładowanie..." : "Wszystkie tematy"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie tematy</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id.toString()}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
