import { useMutation, useQueryClient } from '@tanstack/react-query';
import TasksServices from '../../../api/TasksService';

interface FeedbackUnreadMutationVariables {
  projectKey: string;
  taskKey: string;
  conceptIds: string[];
}

export function useFeedbackUnreadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectKey,
      taskKey,
      conceptIds,
    }: FeedbackUnreadMutationVariables) => {
      return TasksServices.postFeedbackUnread(projectKey, taskKey, conceptIds);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      const queryKey = [
        'feedback-unread',
        variables.projectKey,
        variables.taskKey,
      ];
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: error => {
      console.error('Failed to update feedback unread:', error);
    },
  });
}
