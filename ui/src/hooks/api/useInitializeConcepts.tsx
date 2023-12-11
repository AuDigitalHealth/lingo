import { useEffect, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import useConceptStore from '../../stores/ConceptStore.ts';
import ConceptService from '../../api/ConceptService.ts';
import { ConceptSearchType } from '../../types/conceptSearch.ts';
import { getECLForSearch } from '../../utils/helpers/conceptUtils.ts';
import { Concept } from '../../types/concept.ts';
import { errorHandler } from '../../types/ErrorHandler.ts';

export default function useInitializeConcepts(branch: string | undefined) {
  if (branch === undefined) {
    branch = ''; //TODO handle error
  }
  const { unitsIsLoading } = useInitializeUnits(branch);
  const { containerTypesIsLoading } = useInitializeContainerTypes(branch);

  const { medicationDeviceTypeIsLoading } =
    useInitializeMedicationDeviceTypes(branch);

  return {
    conceptsLoading:
      unitsIsLoading ||
      containerTypesIsLoading ||
      medicationDeviceTypeIsLoading,
  };
}

export function useInitializeUnits(branch: string) {
  const { setUnits } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['units'],
    () => ConceptService.getAllUnits(branch),
    { staleTime: 60 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      setUnits(data);
    }
  }, [data, setUnits]);

  const unitsIsLoading: boolean = isLoading;
  const unitsData = data;

  return { unitsIsLoading, unitsData };
}
export function useInitializeContainerTypes(branch: string) {
  const { setContainerTypes } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['containerTypes'],
    () => ConceptService.getAllContainerTypes(branch),
    { staleTime: 60 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      setContainerTypes(data);
    }
  }, [data, setContainerTypes]);

  const containerTypesIsLoading: boolean = isLoading;
  const containerTypes = data;

  return { containerTypesIsLoading, containerTypes };
}

export function useInitializeMedicationDeviceTypes(branch: string) {
  const { setMedicationDeviceTypes } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['MedicationDeviceTypes'],
    () => ConceptService.getMedicationDeviceTypes(branch),
    { staleTime: 60 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      setMedicationDeviceTypes(data);
    }
  }, [data, setMedicationDeviceTypes]);

  const medicationDeviceTypeIsLoading: boolean = isLoading;
  const medicationDeviceTypes = data;

  return { medicationDeviceTypeIsLoading, medicationDeviceTypes };
}

export function useSearchConcepts(
  searchString: string,
  searchType: ConceptSearchType,
  branch: string,
  concept?: Concept,
  ecl?: string,
) {
  const eclSearch = ecl ? ecl : getECLForSearch(searchType);

  const { isLoading, data, error } = useQuery(
    [`search-products-${searchType}-${searchString}`],
    () => {
      if (concept && concept.conceptId) {
        return ConceptService.searchConceptByIds([concept.conceptId], branch);
      }

      return ConceptService.searchConcept(searchString, branch, eclSearch);
    },
    {
      staleTime: 20 * (60 * 1000),
      enabled: searchString !== undefined && searchString.length > 2,
    },
  );
  useEffect(() => {
    if (error) {
      errorHandler(error, 'Search Failed');
    }
  }, [error]);

  return { isLoading, data };
}
export function useChildConceptSearchUsingEcl(
  searchString: string,
  ecl: string | undefined,
  branch: string,
) {
  const { isLoading, data, error } = useQuery(
    [`search-child-concepts-${searchString}`],
    () => {
      return ConceptService.searchConceptByEcl(
        ecl as string,
        branch,
        50,
        searchString,
      );
    },
    {
      staleTime: 0.5 * (60 * 1000),
      enabled:
        ecl !== undefined &&
        searchString !== undefined &&
        searchString.length > 2,
    },
  );
  useEffect(() => {
    if (error) {
      errorHandler(error, 'Search Failed');
    }
  }, [error]);

  return { isLoading, data };
}
