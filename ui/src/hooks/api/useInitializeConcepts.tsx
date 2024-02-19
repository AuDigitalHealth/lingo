import { useEffect, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import useConceptStore from '../../stores/ConceptStore.ts';
import ConceptService from '../../api/ConceptService.ts';
import { UnitEachId, UnitPackId } from '../../utils/helpers/conceptUtils.ts';
import { Concept } from '../../types/concept.ts';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import { useServiceStatus } from './useServiceStatus.tsx';

export default function useInitializeConcepts(branch: string | undefined) {
  if (branch === undefined) {
    branch = ''; //TODO handle error
  }

  const { defaultUnitIsLoading } = useInitializeDefaultUnit(branch);
  const { unitPackIsLoading } = useInitializeUnitPack(branch);

  return {
    conceptsLoading: defaultUnitIsLoading || unitPackIsLoading,
  };
}

export function useInitializeDefaultUnit(branch: string) {
  const { setDefaultUnit } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['defaultUnit'],
    () => ConceptService.searchConceptByIds([UnitEachId], branch),
    { staleTime: Infinity },
  );
  useMemo(() => {
    if (data) {
      setDefaultUnit(data.items[0]);
    }
  }, [data, setDefaultUnit]);

  const defaultUnitIsLoading: boolean = isLoading;
  const defaultUnit =
    data && data?.items.length > 0 ? data.items[0] : undefined;

  return { defaultUnitIsLoading, defaultUnit };
}
export function useInitializeUnitPack(branch: string) {
  const { setUnitPack } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['unitPack'],
    () => ConceptService.searchConceptByIds([UnitPackId], branch),
    { staleTime: Infinity },
  );
  useMemo(() => {
    if (data) {
      setUnitPack(data.items[0]);
    }
  }, [data, setUnitPack]);

  const unitPackIsLoading: boolean = isLoading;
  const unitPack = data && data?.items.length > 0 ? data.items[0] : undefined;

  return { unitPackIsLoading, unitPack };
}

export function useSearchConceptsByEcl(
  searchString: string,
  ecl: string | undefined,
  branch: string,
  showDefaultOptions: boolean,
  concept?: Concept,
) {
  const { serviceStatus } = useServiceStatus();
  const { isLoading, data, error } = useQuery(
    [`search-products-${ecl}-${searchString}-${showDefaultOptions}`],
    () => {
      if (concept && concept.conceptId) {
        return ConceptService.searchConceptByIds([concept.conceptId], branch);
      }
      if (showDefaultOptions) {
        return ConceptService.searchConceptByEcl(
          encodeURIComponent(ecl as string),
          branch,
        );
      }
      console.log(ecl);
      return ConceptService.searchConcept(
        searchString,
        branch,
        encodeURIComponent(ecl as string),
      );
    },
    {
      staleTime: 20 * (60 * 1000),
      enabled: isValidEclSearch(searchString, ecl, showDefaultOptions),
    },
  );
  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error]);

  return { isLoading, data };
}
function isValidEclSearch(
  searchString: string,
  ecl: string | undefined,
  showDefaultOptions: boolean,
) {
  if (!ecl) {
    return false;
  }
  return (
    showDefaultOptions ||
    (searchString !== undefined && searchString.length > 2)
  );
}
