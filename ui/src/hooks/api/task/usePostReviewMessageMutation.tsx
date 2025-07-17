import { useMutation, useQueryClient } from '@tanstack/react-query';
import TasksServices from '../../../api/TasksService';
import { ReviewMessagePost } from '../../../types/ConceptReview';
import { useFeedbackUnreadMutation } from './useFeedbackUnreadMutation';
import { useFeedbackUnread } from './useConceptsForReview';
import useTaskByKey from '../../useTaskByKey';

interface PostReviewMessageMutationVariables {
  projectKey: string;
  taskKey: string;
  message?: ReviewMessagePost;
}

interface PostReviewMessageMutationVariablesPost extends PostReviewMessageMutationVariables {
  message: ReviewMessagePost;
  conceptId: string;
}

export function usePostReviewMessageMutation({projectKey, taskKey} : PostReviewMessageMutationVariables) {
  const { data: unreadConceptIds } = useFeedbackUnread(projectKey, taskKey, true);
  const queryClient = useQueryClient();
  const mutation = useFeedbackUnreadMutation();
  return useMutation({
    mutationFn: async ({
      projectKey,
      taskKey,
      message,
      conceptId
    }: PostReviewMessageMutationVariablesPost) => {
      return TasksServices.postConceptReviewsMessageForTask(
        projectKey,
        taskKey,
        message,
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the concept reviews query
      const queryKeyReviews = [
        'concept-reviews',
        variables.projectKey,
        variables.taskKey,
      ];
      void queryClient.invalidateQueries({ queryKey: queryKeyReviews });
      const updatedUnreadConceptIds = unreadConceptIds ? [...unreadConceptIds, variables.conceptId] : [variables.conceptId];
      mutation.mutate({projectKey: projectKey, taskKey: taskKey, conceptIds: updatedUnreadConceptIds})
      // const queryKeyUnread = [
      //   'feedback-unread',
      //   variables.projectKey,
      //   variables.taskKey,
      // ];
      // void queryClient.invalidateQueries({ queryKey: queryKeyUnread });
    },
    onError: error => {
      console.error('Failed to post review message:', error);
    },
  });
}
