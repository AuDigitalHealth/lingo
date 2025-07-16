import { useMemo } from 'react';
import { useTaskActivities } from './useTaskActivities';
import {
  useConceptsByIds,
  useConceptsByIdsPost,
} from '../../eclRefset/useConceptsById';
import { ConceptReview } from '../../../types/ConceptReview';
import { useQuery } from '@tanstack/react-query';
import useTaskByKey from '../../useTaskByKey';
import TasksServices from '../../../api/TasksService';
import { useConceptsThatHaveBeenReviewed } from './useConceptsThatHaveBeenReviewed';
import {
  UseReviewProps,
  useIsReviewEnabled,
  useShowReviewControls,
} from './useReviews';

export function useConceptsForReview(branchPath: string | undefined) {
  const task = useTaskByKey(); // Gives projectKey and taskKey
  const showReviewControls = useShowReviewControls({ task });
  const projectKey = task?.projectKey;
  const taskKey = task?.key;

  const {
    activities,
    activitiesIsLoading,
    isError: activitiesError,
  } = useTaskActivities(task?.branchPath, showReviewControls);

  const { conceptsReviewed } = useConceptsThatHaveBeenReviewed(
    task?.projectKey,
    task?.key,
    showReviewControls,
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
  } = useConceptsByIdsPost(branchPath || '', conceptIds);

  // Fetch concept reviews/messages
  const {
    data: conceptFeedbacks,
    isLoading: reviewsIsLoading,
    error: reviewsError,
  } = useQuery({
    queryKey: ['concept-reviews', projectKey, taskKey],
    queryFn: () => TasksServices.getConceptReviewsForTask(projectKey, taskKey),
    enabled: !!projectKey && !!taskKey && showReviewControls,
  });

  // Fetch unread concept IDs
  const { unreadConceptIds, unreadIsLoading, unreadError } = useFeedbackUnread(
    projectKey,
    taskKey,
    showReviewControls,
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
  enabled: boolean,
) {
  const {
    data: unreadConceptIds,
    isLoading: unreadIsLoading,
    error: unreadError,
  } = useQuery({
    queryKey: ['feedback-unread', projectKey, taskKey],
    queryFn: () => TasksServices.getFeedbackUnread(projectKey, taskKey),
    enabled: !!projectKey && !!taskKey && enabled,
  });

  return { unreadConceptIds, unreadIsLoading, unreadError };
}

export function useCanCompleteReview({ task, branch }: UseReviewProps) {
  const isReviewEnabled = useIsReviewEnabled({ task });
  const { conceptReviews, isLoadingConceptReviews } =
    useConceptsForReview(branch);

  const allApproved =
    conceptReviews.find(conceptReview => {
      return conceptReview.approved === false;
    }) === undefined;

  return isReviewEnabled && allApproved;
}
