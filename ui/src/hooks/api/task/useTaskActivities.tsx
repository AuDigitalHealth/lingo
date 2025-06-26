import { queryOptions, useQuery } from '@tanstack/react-query';

import AuthoringTraceabilityServices from '../../../api/AuthoringTraceabilityService';

export const useTaskActivitiesOptions = (
  branchPath: string | undefined,
  enabled: boolean,
) => {
  const queryKey = [`task-activities-${branchPath}`];
  return queryOptions({
    queryKey,
    queryFn: () => AuthoringTraceabilityServices.getTaskActivities(branchPath),
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
    enabled: !!branchPath && enabled,
  });
};

export function useTaskActivities(
  branchPath: string | undefined,
  enabled: boolean,
) {
  const { isLoading, data, isError } = useQuery({
    ...useTaskActivitiesOptions(branchPath, enabled),
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
  });

  const activitiesIsLoading: boolean = isLoading;
  const activities = data;

  return { activitiesIsLoading, activities, isError };
}
