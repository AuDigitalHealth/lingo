import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import { useServiceStatus } from '../api/useServiceStatus.tsx';
import ConceptService from '../../api/ConceptService.ts';

export function useConceptById(
  branch: string,
  conceptId: string | undefined,
  enabled: boolean,
) {
  const { serviceStatus } = useServiceStatus();

  const { data, error, refetch, isFetching } = useQuery({
    queryKey: [`concept-${branch}-${conceptId}`],
    queryFn: () => {
      if (conceptId !== undefined)
        return ConceptService.getConceptById(conceptId, branch);
      return null;
    },
    staleTime: 20 * (60 * 1000),
    enabled: enabled,
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

export function useConceptsByIds(branch: string, conceptIds: string[]) {
  const { serviceStatus } = useServiceStatus();

  const { data, error, isLoading } = useQuery({
    queryKey: [`concept-${branch}`, conceptIds],
    queryFn: () => {
      if (conceptIds.length) {
        return ConceptService.searchConceptsByIds(conceptIds, branch);
      }
      return null;
    },
    staleTime: 20 * (60 * 1000),
    enabled: !!conceptIds.length,
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return {
    data,
    error,
    isLoading,
  };
}

export function useConceptsByIdsPost(branch: string, conceptIds: string[]) {
  const { serviceStatus } = useServiceStatus();

  const { data, error, isLoading } = useQuery({
    queryKey: [`concept-${branch}-post`, conceptIds],
    queryFn: () => {
      if (conceptIds.length) {
        return ConceptService.searchConceptsByIdsPost(branch, {
          conceptIds: conceptIds,
          limit: 500,
          offset: 0,
        });
      }
      return null;
    },
    staleTime: 20 * (60 * 1000),
    enabled: !!conceptIds.length,
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return {
    data,
    error,
    isLoading,
  };
}
export function useActiveConceptIdsByIds(branch: string, conceptIds: string[]) {
  const { serviceStatus } = useServiceStatus();

  const { data, error, isLoading } = useQuery({
    queryKey: [`concept-ids-${branch}`, conceptIds],
    queryFn: () => {
      if (conceptIds.length)
        return ConceptService.searchConceptIdsByIds(conceptIds, branch);
      return null;
    },
    staleTime: 20 * (60 * 1000),
    enabled: !!conceptIds.length,
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return {
    activeConceptIds: data,
    activeConceptsError: error,
    activeConceptsLoading: isLoading,
  };
}
