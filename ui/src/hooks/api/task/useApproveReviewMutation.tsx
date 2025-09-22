import { useMutation, useQueryClient } from '@tanstack/react-query';
import TasksServices from '../../../api/TasksService';
import { ReviewedList } from '../../../types/ConceptReview';

interface ApproveReviewMutationVariables {
  projectKey: string;
  taskKey: string;
  reviewedList: ReviewedList;
}

export function useApproveReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectKey,
      taskKey,
      reviewedList,
    }: ApproveReviewMutationVariables) => {
      return TasksServices.updateReviewedList(
        projectKey,
        taskKey,
        reviewedList,
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the concepts reviewed query
      const queryKey = [
        `concepts-reviewed-${variables.projectKey}-${variables.taskKey}`,
      ];
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: error => {
      console.error('Failed to update reviewed list:', error);
    },
  });
}
