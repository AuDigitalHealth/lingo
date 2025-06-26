import { queryOptions, useQuery } from '@tanstack/react-query';

import TasksServices from '../../../api/TasksService';

export const useConceptsThatHaveBeenReviewedOptions = (
  projectKey: string | undefined,
  taskKey: string | undefined,
  enabled: boolean,
) => {
  const queryKey = [`concepts-reviewed-${projectKey}-${taskKey}`];
  return queryOptions({
    queryKey,
    queryFn: () => TasksServices.getReviewedList(projectKey, taskKey),
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
    enabled: !!projectKey && !!taskKey && enabled,
  });
};

export function useConceptsThatHaveBeenReviewed(
  projectKey: string | undefined,
  taskKey: string | undefined,
  enabled: boolean,
) {
  const { isLoading, data, isError } = useQuery({
    ...useConceptsThatHaveBeenReviewedOptions(projectKey, taskKey, enabled),
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
  });

  const conceptsReviewedIsLoading: boolean = isLoading;
  const conceptsReviewed = data;

  return { conceptsReviewedIsLoading, conceptsReviewed, isError };
}
