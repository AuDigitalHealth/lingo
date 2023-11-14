import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { isSctId } from '../../../utils/helpers/conceptUtils';
import { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';
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
        return ConceptService.searchConceptById(
          searchTerm,
          branch,
          providedEcl,
        );
      } else {
        return ConceptService.searchConceptByArtgId(searchTerm, branch);
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
      const err = error as AxiosError<SnowstormError>;
      enqueueSnackbar(
        `Search Failed with error: ${err.response?.data.message}`,
        {
          variant: 'error',
        },
      );
    }
  }, [error]);
  return { isLoading, data, error };
}
