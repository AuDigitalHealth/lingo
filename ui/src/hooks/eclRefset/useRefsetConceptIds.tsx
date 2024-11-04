import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServiceStatus } from '../api/useServiceStatus';
import { snowstormErrorHandler } from '../../types/ErrorHandler';
import ConceptService from '../../api/ConceptService';

export function useRefsetConceptIds(branch: string, referenceSet: string) {
  const { serviceStatus } = useServiceStatus();
  const [progress, setProgress] = useState({
    retrieved: 0,
    total: 0,
  });

  const { isLoading, data, error, fetchStatus, isFetching } = useQuery({
    queryKey: [`concept-${branch}-^ ${referenceSet}-all-ids`],
    queryFn: async () => {
      if (!referenceSet) return null;
      let searchAfter;
      let total;
      const currConceptIds = Array<string>();
      setProgress({
        retrieved: 0,
        total: 0,
      });

      while (total === undefined || currConceptIds.length < total) {
        // Get batched concept IDs of current members
        const rsp = await ConceptService.searchConceptIdsBulkFilters(branch, {
          limit: 10000,
          eclFilter: `^ ${referenceSet}`,
          searchAfter,
        });

        total = rsp.total;
        searchAfter = rsp.searchAfter;
        currConceptIds.push(...rsp.items);
        setProgress({
          retrieved: currConceptIds.length,
          total: total,
        });
      }
      return currConceptIds;
    },
    staleTime: 20 * (60 * 1000),
    retry: 0,
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);
  return { isLoading, data, error, fetchStatus, isFetching, progress };
}
