/**
 * TopicsView Component
 *
 * Main component for the topics page
 * Manages all CRUD operations and UI state for topics
 */

import { useTopics } from "../lib/hooks/useTopics";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";
import { PageHeader } from "./PageHeader";
import { TopicsList } from "./TopicsList";
import { AddTopicDialog } from "./AddTopicDialog";
import { EditTopicDialog } from "./EditTopicDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";

export function TopicsView() {
  const {
    topics,
    isLoading,
    error,
    addDialog,
    editDialog,
    deleteDialog,
    openAddDialog,
    closeAddDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,
    createTopic,
    updateTopic,
    deleteTopic,
    refreshTopics,
    clearError,
  } = useTopics();

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Ładowanie tematów..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="py-12">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h3 className="text-lg font-semibold text-destructive mb-2">Wystąpił błąd</h3>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={refreshTopics}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Spróbuj ponownie
            </button>
            <button
              onClick={clearError}
              className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main content */}
      <div>
        {topics.length === 0 ? (
          <EmptyState onAddClick={openAddDialog} />
        ) : (
          <>
            <PageHeader onAddClick={openAddDialog} />
            <TopicsList topics={topics} onEdit={openEditDialog} onDelete={openDeleteDialog} />
          </>
        )}
      </div>

      {/* Dialogs */}
      <AddTopicDialog
        isOpen={addDialog.isOpen}
        onClose={closeAddDialog}
        onSubmit={createTopic}
        isSubmitting={addDialog.isSubmitting}
      />

      <EditTopicDialog
        isOpen={editDialog.isOpen}
        topic={editDialog.topic}
        onClose={closeEditDialog}
        onSubmit={updateTopic}
        isSubmitting={editDialog.isSubmitting}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        topic={deleteDialog.topic}
        onConfirm={deleteTopic}
        onCancel={closeDeleteDialog}
        isDeleting={deleteDialog.isDeleting}
      />
    </>
  );
}
