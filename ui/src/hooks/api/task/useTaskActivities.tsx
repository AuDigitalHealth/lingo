import { queryOptions, useQuery } from '@tanstack/react-query';

import AuthoringTraceabilityServices from '../../../api/AuthoringTraceabilityService';

export const useTaskActivitiesOptions = (branchPath: string | undefined) => {
  const queryKey = [`task-activities-${branchPath}`];
  return queryOptions({
    queryKey,
    queryFn: () => AuthoringTraceabilityServices.getTaskActivities(branchPath),
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
    enabled: !!branchPath,
  });
};

export function useTaskActivities(branchPath: string | undefined) {
  const { isLoading, data, isError } = useQuery({
    ...useTaskActivitiesOptions(branchPath),
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
  });

  const activitiesIsLoading: boolean = isLoading;
  const activities = data;

  return { activitiesIsLoading, activities, isError };
}
