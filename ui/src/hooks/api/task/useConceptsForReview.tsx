import { useMemo } from 'react';
import { useTaskActivities } from './useTaskActivities';
import { useConceptsByIds } from '../../eclRefset/useConceptsById';
import { ConceptReview } from '../../../types/ConceptReview';
import { useQuery } from '@tanstack/react-query';
import useTaskById from '../../useTaskById';
import TasksServices from '../../../api/TasksService';
import { useConceptsThatHaveBeenReviewed } from './useConceptsThatHaveBeenReviewed';

export function useConceptsForReview(branchPath: string | undefined) {
  const task = useTaskById(); // Gives projectKey and taskKey
  const projectKey = task?.projectKey;
  const taskKey = task?.key;

  const {
    activities,
    activitiesIsLoading,
    isError: activitiesError,
  } = useTaskActivities(task?.branchPath);

  const { conceptsReviewed } = useConceptsThatHaveBeenReviewed(
    task?.projectKey,
    task?.key,
  );

  // Extract concept IDs
  const conceptIds = useMemo(() => {
    if (!activities) return [];
    const ids = activities.flatMap(
      activity =>
        activity.conceptChanges?.map(change => change.conceptId) || [],
    );
    return Array.from(new Set(ids));
  }, [activities]);

  // Fetch concept details
  const {
    data: concepts,
    isLoading: conceptsIsLoading,
    error: conceptsError,
  } = useConceptsByIds(branchPath || '', conceptIds);

  // Fetch concept reviews/messages
  const {
    data: conceptFeedbacks,
    isLoading: reviewsIsLoading,
    error: reviewsError,
  } = useQuery({
    queryKey: ['concept-reviews', projectKey, taskKey],
    queryFn: () => TasksServices.getConceptReviewsForTask(projectKey, taskKey),
    enabled: !!projectKey && !!taskKey,
  });

  // Fetch unread concept IDs
  const { unreadConceptIds, unreadIsLoading, unreadError } = useFeedbackUnread(
    projectKey,
    taskKey,
  );

  // Compose full ConceptReview array
  const conceptReviews: ConceptReview[] = useMemo(() => {
    if (!concepts) return [];

    return concepts.map(concept => {
      const feedbackEntry = conceptFeedbacks?.find(
        f => f.id === concept.conceptId,
      );
      const isUnread =
        unreadConceptIds?.includes(
          concept?.conceptId ? concept.conceptId : '',
        ) ?? false;
      const approved = conceptsReviewed?.conceptIds?.find(val => {
        return concept.conceptId === val;
      });
      return {
        conceptId: concept.conceptId,
        concept,
        reviews: feedbackEntry,
        unread: isUnread,
        approved: approved !== undefined,
      };
    });
  }, [concepts, conceptFeedbacks, unreadConceptIds, conceptsReviewed]);

  return {
    conceptReviews,
    isLoadingConceptReviews:
      activitiesIsLoading ||
      conceptsIsLoading ||
      reviewsIsLoading ||
      unreadIsLoading,
    isError:
      activitiesError || !!conceptsError || !!reviewsError || !!unreadError,
  };
}

export function useFeedbackUnread(
  projectKey: string | undefined,
  taskKey: string | undefined,
) {
  const {
    data: unreadConceptIds,
    isLoading: unreadIsLoading,
    error: unreadError,
  } = useQuery({
    queryKey: ['feedback-unread', projectKey, taskKey],
    queryFn: () => TasksServices.getFeedbackUnread(projectKey, taskKey),
    enabled: !!projectKey && !!taskKey,
  });

  return { unreadConceptIds, unreadIsLoading, unreadError };
}
