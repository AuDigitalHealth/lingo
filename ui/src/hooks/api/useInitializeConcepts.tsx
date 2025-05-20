import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../api/ConceptService.ts';
import { UnitEachId, UnitPackId } from '../../utils/helpers/conceptUtils.ts';
import { Concept } from '../../types/concept.ts';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import { useServiceStatus } from './useServiceStatus.tsx';
import { useSearchConceptOntoserver } from './products/useSearchConcept.tsx';
import { ConceptSearchResult } from '../../pages/products/components/SearchProduct.tsx';

import { convertFromValueSetExpansionContainsListToSnowstormConceptMiniList } from '../../utils/helpers/getValueSetExpansionContainsPt.ts';
import {
  PUBLISHED_CONCEPTS,
  UNPUBLISHED_CONCEPTS,
} from '../../utils/statics/responses.ts';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore.ts';

export default function useInitializeConcepts(branch: string | undefined) {
  if (branch === undefined) {
    branch = ''; //TODO handle error
  }

  const { defaultUnitIsLoading } = useDefaultUnit(branch);
  const { unitPackIsLoading } = useUnitPack(branch);

  return {
    conceptsLoading: defaultUnitIsLoading || unitPackIsLoading,
  };
}

export function useDefaultUnit(branch: string) {
  const { isLoading, data } = useQuery({
    queryKey: ['defaultUnit'],
    queryFn: () =>
      ConceptService.searchUnpublishedConceptByIds([UnitEachId], branch),
    staleTime: Infinity,
  });

  const defaultUnitIsLoading: boolean = isLoading;
  const defaultUnit =
    data && data?.items.length > 0 ? data.items[0] : undefined;

  return { defaultUnitIsLoading, defaultUnit };
}
export function useUnitPack(branch: string) {
  const { isLoading, data } = useQuery({
    queryKey: ['unitPack'],
    queryFn: () =>
      ConceptService.searchUnpublishedConceptByIds([UnitPackId], branch),
    staleTime: Infinity,
  });

  const unitPackIsLoading: boolean = isLoading;
  const unitPack = data && data?.items.length > 0 ? data.items[0] : undefined;

  return { unitPackIsLoading, unitPack };
}

// Function to generate query options
export const getSearchConceptsByEclOptions = (
  searchString: string,
  ecl: string | undefined,
  branch: string,
  showDefaultOptions: boolean,
  concept?: Concept,
  turnOffPublishParam?: boolean,
) => {
  const queryKey = [
    `search-products-${ecl}-${turnOffPublishParam ? 'no-publish' : ''}-${branch}-${searchString}`,
  ];

  return {
    queryKey,
    queryFn: () => {
      if (concept && concept.conceptId) {
        return ConceptService.searchUnpublishedConceptByIds(
          [concept.conceptId],
          branch,
        );
      }
      if (showDefaultOptions) {
        return ConceptService.searchConceptByEcl(
          encodeURIComponent(ecl as string),
          branch,
          undefined,
          undefined,
          turnOffPublishParam,
        );
      }
      return ConceptService.searchConcept(
        searchString,
        branch,
        encodeURIComponent(ecl as string),
        turnOffPublishParam,
      );
    },

    staleTime: 60 * (60 * 1000),
    enabled: isValidEclSearch(searchString, ecl, showDefaultOptions),
  };
};

// Custom hook to fetch data using useQuery
export const useSearchConceptsByEcl = (
  searchString: string,
  ecl: string | undefined,
  branch: string,
  showDefaultOptions: boolean,
  concept?: Concept,
  turnOffPublishParam?: boolean,
) => {
  const { serviceStatus } = useServiceStatus();

  const { data, error, isError, isLoading, isFetching } = useQuery({
    ...getSearchConceptsByEclOptions(
      searchString,
      ecl,
      branch,
      showDefaultOptions,
      concept,
      turnOffPublishParam,
    ),
  });

  const { data: ontoResults, isFetching: isOntoFetching } =
    useSearchConceptOntoserver(
      encodeURIComponent(ecl as string),
      searchString,
      undefined,
      undefined,
      showDefaultOptions,
    );

  const [ontoData, setOntoData] = useState<Concept[]>([]);
  const [allData, setAllData] = useState<ConceptSearchResult[]>([]);

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  const { applicationConfig } = useApplicationConfigStore();

  useEffect(() => {
    if (ontoResults) {
      setOntoData(
        ontoResults.expansion?.contains !== undefined
          ? convertFromValueSetExpansionContainsListToSnowstormConceptMiniList(
              ontoResults.expansion?.contains,
              applicationConfig.fhirPreferredForLanguage,
            )
          : ([] as Concept[]),
      );
    }
  }, [ontoResults, applicationConfig.fhirPreferredForLanguage]);

  useEffect(() => {
    if (ontoData || data) {
      let tempAllData: ConceptSearchResult[] = [];
      if (ontoData) {
        tempAllData = ontoData.map(item => ({
          ...item,
          type: PUBLISHED_CONCEPTS,
        }));
      }
      if (data) {
        const tempArr = data?.items.map(item => ({
          ...item,
          type: UNPUBLISHED_CONCEPTS,
        }));
        tempAllData.push(...tempArr);
      }
      setAllData(tempAllData);
    }
  }, [data, ontoData]);

  return {
    data,
    allData,
    error,
    isError,
    isLoading,
    isFetching,
    isOntoFetching,
  };
};

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
    (searchString !== undefined && searchString?.length > 2)
  );
}
