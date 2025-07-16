import { useMutation, useQueryClient } from '@tanstack/react-query';
import TasksServices from '../../../api/TasksService';
import { ReviewMessagePost } from '../../../types/ConceptReview';

interface PostReviewMessageMutationVariables {
  projectKey: string;
  taskKey: string;
  message: ReviewMessagePost;
}

export function usePostReviewMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectKey,
      taskKey,
      message,
    }: PostReviewMessageMutationVariables) => {
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

      const queryKeyUnread = [
        'feedback-unread',
        variables.projectKey,
        variables.taskKey,
      ];
      void queryClient.invalidateQueries({ queryKey: queryKeyUnread });
    },
    onError: error => {
      console.error('Failed to post review message:', error);
    },
  });
}
