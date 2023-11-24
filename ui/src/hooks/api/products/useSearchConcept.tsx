import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { isSctId } from '../../../utils/helpers/conceptUtils';
import { useEffect } from 'react';
import { errorHandler } from '../../../types/ErrorHandler.ts';

export function useSearchConcept(
  searchFilter: string | undefined,
  searchTerm: string,
  checkItemAlreadyExists: (search: string) => boolean,
  branch: string,
  providedEcl?: string,
) {
  const { isLoading, data, error } = useQuery(
    [`concept-${searchTerm}`],
    () => {
      if (searchFilter === 'Term') {
        return ConceptService.searchConcept(searchTerm, branch, providedEcl);
      } else if (searchFilter === 'Sct Id' && isSctId(searchTerm)) {
        return ConceptService.searchConceptByIds(
          [searchTerm],
          branch,
          providedEcl,
        );
      } else if (searchFilter === 'Artg Id') {
        return ConceptService.searchConceptByArtgId(searchTerm, branch);
      } else {
        return [];
      }
    },
    {
      cacheTime: 0,
      staleTime: 20 * (60 * 1000),
      enabled:
        searchTerm !== undefined &&
        searchTerm.length > 2 &&
        !checkItemAlreadyExists(searchTerm),
    },
  );
  useEffect(() => {
    if (error) {
      errorHandler(error, 'Search Failed');
    }
  }, [error]);
  return { isLoading, data, error };
}
