import { queryOptions, useQuery } from '@tanstack/react-query';

import TasksServices from '../../../api/TasksService';

export const useConceptsThatHaveBeenReviewedOptions = (
  projectKey: string | undefined,
  taskKey: string | undefined,
) => {
  const queryKey = [`concepts-reviewed-${projectKey}-${taskKey}`];
  return queryOptions({
    queryKey,
    queryFn: () => TasksServices.getReviewedList(projectKey, taskKey),
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
    enabled: !!projectKey && !!taskKey,
  });
};

export function useConceptsThatHaveBeenReviewed(
  projectKey: string | undefined,
  taskKey: string | undefined,
) {
  const { isLoading, data, isError } = useQuery({
    ...useConceptsThatHaveBeenReviewedOptions(projectKey, taskKey),
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
  });

  const conceptsReviewedIsLoading: boolean = isLoading;
  const conceptsReviewed = data;

  return { conceptsReviewedIsLoading, conceptsReviewed, isError };
}
