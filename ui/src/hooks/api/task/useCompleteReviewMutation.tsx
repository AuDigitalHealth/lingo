import {
  dataTagErrorSymbol,
  dataTagSymbol,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { ServiceStatus } from '../../../types/applicationConfig';
import { unavailableErrorHandler } from '../../../types/ErrorHandler';
import TasksServices from '../../../api/TasksService';
import { Task } from '../../../types/task';
import { updateTaskCache } from './useAllTasks';

export const useCompleteReviewMutation = (
  task: Task | null | undefined,
  serviceStatus: ServiceStatus | undefined,
  queryKey: string[] & {
    [dataTagSymbol]: Task[];
    [dataTagErrorSymbol]: Error;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!serviceStatus?.authoringPlatform.running) {
        unavailableErrorHandler('', 'Authoring Platform');
        throw new Error('Authoring Platform is not running');
      }

      const returnedTask = await TasksServices.completeReview(
        task?.projectKey,
        task?.key,
        [],
      );

      return returnedTask;
    },
    onSuccess: returnedTask => {
      updateTaskCache(queryClient, queryKey, returnedTask);
    },
    onError: error => {
      console.error('Failed to complete review:', error);
      // Add any additional error handling here
    },
  });
};
