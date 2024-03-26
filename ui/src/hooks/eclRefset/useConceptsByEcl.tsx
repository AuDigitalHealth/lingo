import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  SnowstormError,
  snowstormErrorHandler,
  unavailableErrorHandler,
} from '../../types/ErrorHandler.ts';
import { useServiceStatus } from '../api/useServiceStatus.tsx';
import ConceptService from '../../api/ConceptService.ts';
import { AxiosError } from 'axios';

export function useConceptsByEcl(
  branch: string,
  ecl: string,
  limit?: number,
  offset?: number,
  searchTerm?: string
) {
  const { serviceStatus } = useServiceStatus();  
  if (searchTerm && searchTerm.length < 3) searchTerm = '';

  const shouldCall = () => {
    const validSearch = !!ecl.length;

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }
    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const { isLoading, data, error, fetchStatus } = useQuery(
    [`concept-${branch}-${ecl}-${searchTerm ?? ""}-${limit}-${offset}`],
    () => {
      return ConceptService.getEclConcepts(branch, ecl, limit, offset, searchTerm);
    },
    {
      cacheTime: 0,
      staleTime: 20 * (60 * 1000),
      retry: 0,
      enabled: shouldCall(),
    },
  );

  useEffect(() => {
    if (error) {
      const err = error as AxiosError<SnowstormError>;
      if (err.response?.status !== 400) {
        snowstormErrorHandler(error, 'Search Failed', serviceStatus);
      }
    }
  }, [error, serviceStatus]);
  return { isLoading, data, error, fetchStatus, searchTerm };
}
