import { useQueries } from '@tanstack/react-query';
import { snowstormErrorHandler } from '../../types/ErrorHandler';
import { useServiceStatus } from '../api/useServiceStatus';
import ConceptService from '../../api/ConceptService';
import { useEffect } from 'react';
import { Concept } from '../../types/concept';

export function useRefsetHasInactives(
  branch: string,
  refsetConcepts: Concept[],
  showInactives: boolean,
) {
  const { serviceStatus } = useServiceStatus();

  const { data, error, isLoading } = useQueries({
    queries: refsetConcepts.map(refset => ({
      enabled: showInactives,
      queryKey: [`concept-${branch}-^ ${refset.conceptId}-inactives`],
      queryFn: async () => {
        if (!refset.conceptId) return false;
        const concepts = await ConceptService.getEclConcepts(
          branch,
          `^ ${refset.conceptId} {{ C active = 0 }}`,
          {
            limit: 1,
          },
        );
        return !!concepts.total;
      },
    })),
    combine: results => {
      return {
        data: results.map(result =>
          result.isLoading ? 'loading' : result.data,
        ),
        error: results.find(result => result.error)?.error,
        isLoading: results.some(result => result.isLoading),
      };
    },
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);
  return { data, error, isLoading };
}
