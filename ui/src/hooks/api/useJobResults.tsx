import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import JobResultsService from '../../api/JobResultsService';
import { useMemo } from 'react';
import { JobResult } from '../../types/tickets/jobs';

export const useJobResultsOptions = () => {
  const queryKey = ['job-results'];
  return queryOptions({
    queryKey,
    retry: false,
    staleTime: 1 * 60 * 1000,
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
    const returnVal = data?.map(item => ({
      ...item,
      results: item.results.map(result => ({
        ...result,
        id: index++,
      })),
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
