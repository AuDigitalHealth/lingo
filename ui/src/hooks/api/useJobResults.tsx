import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import JobResultsService from '../../api/JobResultsService';
import { useMemo } from 'react';
import {
  JobResult,
  Result,
  ResultNotificationType,
  getSeverityRank,
} from '../../types/tickets/jobs';

export const useJobResultsOptions = () => {
  const queryKey = ['job-results'];
  return queryOptions({
    queryKey,
    retry: false,
    refetchInterval: 2 * 60 * 1000,
    queryFn: () => {
      return JobResultsService.getJobResults();
    },
  });
};

export function useJobResults() {
  const { isLoading, data } = useQuery({
    ...useJobResultsOptions(),
  });

  const actualData = useMemo(() => {
    let index = 0;

    const createResultWithNestedNotifications = (result: Result): Result => {
      const temp = { ...result };
      let highestSeverity: ResultNotificationType | null = null;
      let combinedDescription = '';

      temp.results?.forEach(result => {
        if (result.notification) {
          // Combine descriptions
          combinedDescription +=
            (combinedDescription ? '\n' : '') + result.notification.description;

          // Determine highest severity
          if (
            !highestSeverity ||
            getSeverityRank(result.notification.type) >
              getSeverityRank(highestSeverity)
          ) {
            highestSeverity = result.notification.type;
          }
        }
      });

      if (highestSeverity) {
        temp.notification = {
          type: highestSeverity,
          description: combinedDescription,
        };
      }

      return temp;
    };

    // Recursive function to handle nested results
    const assignIdsAndRaiseErrors = (results: Result[]): Result[] => {
      return results.map(result => {
        const newResult = {
          ...result,
          id: index++,
        };

        if (newResult.results && Array.isArray(newResult.results)) {
          newResult.results = assignIdsAndRaiseErrors(newResult.results);
        }

        return createResultWithNestedNotifications(newResult);
      });
    };

    const returnVal = data?.map(item => ({
      ...item,
      results: assignIdsAndRaiseErrors(item.results),
    }));

    return returnVal;
  }, [data]);

  return { data: actualData, isLoading };
}

export function useUpdateJobResult() {
  const queryClient = useQueryClient();
  const queryKey = useJobResultsOptions().queryKey;
  const mutation = useMutation({
    mutationFn: (jobResult: JobResult) => {
      return JobResultsService.acknowledgeJobResult(jobResult);
    },
    onSuccess: updatedJobResult => {
      queryClient.setQueryData(queryKey, (oldData: JobResult[] | undefined) => {
        if (!oldData) return [updatedJobResult];
        return oldData.map(jobResult =>
          jobResult?.id === updatedJobResult?.id ? updatedJobResult : jobResult,
        );
      });
    },
  });

  return mutation;
}
