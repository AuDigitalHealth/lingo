import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import { useServiceStatus } from '../api/useServiceStatus.tsx';
import ConceptService from '../../api/ConceptService.ts';

export function useConceptById(branch: string, conceptId: string | undefined) {
  const { serviceStatus } = useServiceStatus();

  const { data, error, refetch, isFetching } = useQuery({
    queryKey: [`concept-${branch}-${conceptId}`],
    queryFn: () => {
      if (conceptId !== undefined)
        return ConceptService.getConceptById(conceptId, branch);
      return null;
    },
    staleTime: 20 * (60 * 1000),
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return {
    isConceptFetching: isFetching,
    conceptData: data,
    conceptError: error,
    refetchConcept: refetch,
  };
}
