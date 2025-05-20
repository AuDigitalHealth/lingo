import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  SnowstormError,
  snowstormErrorHandler,
  unavailableErrorHandler,
} from '../../types/ErrorHandler.ts';
import { useServiceStatus } from '../api/useServiceStatus.tsx';
import ConceptService from '../../api/ConceptService.ts';
import { AxiosError } from 'axios';
import { enqueueSnackbar } from 'notistack';
import {
  Concept,
  ConceptResponse,
  TickFlickRefsetConcept,
} from '../../types/concept.ts';
import { QUERY_REFERENCE_SET } from '../../pages/eclRefset/utils/constants.tsx';

const SNOWSTORM_LIMIT = 10000;

export function useConceptsByEcl(
  branch: string,
  ecl: string,
  options?: {
    limit?: number;
    offset?: number;
    term?: string;
    activeFilter?: boolean;
    termActive?: boolean;
  },
) {
  const { limit, offset, activeFilter, termActive } = options ?? {};
  let searchTerm = options?.term;
  const { serviceStatus } = useServiceStatus();
  if (searchTerm && searchTerm.length < 3) searchTerm = '';

  const shouldCall = () => {
    const validSearch = !!ecl?.length || !!searchTerm;

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }

    if (offset && limit && offset + limit > SNOWSTORM_LIMIT) {
      enqueueSnackbar(`Snowstorm: Offset limit exceeded`, {
        variant: 'error',
        autoHideDuration: 5000,
      });
      return false;
    }

    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const { isLoading, data, error, fetchStatus, isFetching } = useQuery({
    queryKey: [
      `concept-${branch}-${ecl}-${searchTerm ?? ''}-${limit}-${offset}-${activeFilter}-${termActive}`,
    ],
    queryFn: () => {
      return ConceptService.getEclConcepts(branch, ecl, {
        limit,
        offset,
        term: searchTerm,
        activeFilter,
        termActive,
      });
    },
    staleTime: 20 * (60 * 1000),
    retry: 0,
    enabled: shouldCall(),
  });

  useEffect(() => {
    if (error) {
      const err = error as AxiosError<SnowstormError>;
      if (err.response?.status !== 400) {
        snowstormErrorHandler(error, 'Search Failed', serviceStatus);
      }
    }
  }, [error, serviceStatus]);
  return { isLoading, data, error, fetchStatus, searchTerm, isFetching };
}

export function useConceptsByEclSnodine(
  branch: string,
  ecl: string,
  options?: {
    limit?: number;
    offset?: number;
    term?: string;
    activeFilter?: boolean;
    termActive?: boolean;
  },
  showInactives?: boolean,
) {
  const { limit, offset, activeFilter, termActive } = options ?? {};
  let searchTerm = options?.term;
  const { serviceStatus } = useServiceStatus();
  if (searchTerm && searchTerm.length < 3) searchTerm = '';

  const shouldCall = () => {
    if (showInactives) return false;
    const validSearch = !!ecl?.length || !!searchTerm;

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }

    if (offset && limit && offset + limit > SNOWSTORM_LIMIT) {
      enqueueSnackbar(`Snowstorm: Offset limit exceeded`, {
        variant: 'error',
        autoHideDuration: 5000,
      });
      return false;
    }

    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const { isLoading, data, error, fetchStatus, isFetching } = useQuery({
    queryKey: [
      `concept-${branch}-${ecl}-${searchTerm ?? ''}-${limit}-${offset}-${activeFilter}-${termActive}`,
    ],
    queryFn: () => {
      return ConceptService.getEclConcepts(branch, ecl, {
        limit,
        offset,
        term: searchTerm,
        activeFilter,
        termActive,
      });
    },
    staleTime: 20 * (60 * 1000),
    retry: 0,
    enabled: shouldCall(),
  });

  useEffect(() => {
    if (error) {
      const err = error as AxiosError<SnowstormError>;
      if (err.response?.status !== 400) {
        snowstormErrorHandler(error, 'Search Failed', serviceStatus);
      }
    }
  }, [error, serviceStatus]);
  return { isLoading, data, error, fetchStatus, searchTerm, isFetching };
}

export function useConceptsByEclAllPages(
  branch: string,
  ecls: string,
  options?: {
    limit?: number;
    offset?: number;
    term?: string;
    activeFilter?: boolean;
    termActive?: boolean;
  },
) {
  const { limit = 50, offset = 0, activeFilter, termActive } = options ?? {};
  let searchTerm = options?.term;
  const { serviceStatus } = useServiceStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [combinedData, setCombinedData] = useState<{
    items: TickFlickRefsetConcept[];
    total: number;
    limit: number;
    offset: number;
    searchAfter: string;
    searchAfterArray: string[];
  } | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<
    'idle' | 'fetching' | 'error' | 'success'
  >('idle');

  if (searchTerm && searchTerm.length < 3) searchTerm = '';

  const shouldCall = () => {
    const validSearch = !!ecls?.length || !!searchTerm;

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }

    if (offset && limit && offset + limit > SNOWSTORM_LIMIT) {
      enqueueSnackbar(`Snowstorm: Offset limit exceeded`, {
        variant: 'error',
        autoHideDuration: 5000,
      });
      return false;
    }

    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const fetchAllPagesForEcl = async (
    ecl: string,
  ): Promise<TickFlickRefsetConcept[]> => {
    let allItems: TickFlickRefsetConcept[] = [];
    let currentSearchAfter: string | undefined;
    let continueLoop = true;
    let firstResponse: ConceptResponse | null = null;

    while (continueLoop) {
      const fetchOptions = {
        limit,
        offset: offset,
        term: searchTerm,
        activeFilter,
        termActive,
        searchAfter: currentSearchAfter,
      };

      const response = await ConceptService.getEclConcepts(
        branch,
        ecl,
        fetchOptions,
      );

      if (!firstResponse) {
        firstResponse = response;
      }

      const tempResponse = response.items.map(item => {
        const tempItem = item as TickFlickRefsetConcept;
        tempItem.isQuerySpec = ecl === `^ ${QUERY_REFERENCE_SET}`;
        return tempItem;
      });
      allItems = [...allItems, ...tempResponse];

      // If there's no more data to fetch, break the loop
      if (!response.searchAfter || response.items.length === 0) {
        continueLoop = false;
      }

      // Prepare for next page
      currentSearchAfter = response.searchAfter;
    }

    return allItems;
  };

  const fetchAllData = async () => {
    if (!shouldCall()) {
      return;
    }

    setIsLoading(true);
    setIsFetching(true);
    setFetchStatus('fetching');

    try {
      let allResults: TickFlickRefsetConcept[] = [];
      let totalItems = 0;

      // Fetch results for each ECL query

      const result = await fetchAllPagesForEcl(ecls);
      allResults = [...allResults, ...result];
      totalItems += result.length;

      // Create a combined response with all items from all ECLs
      const mergedResponse = {
        items: allResults,
        total: totalItems,
        limit,
        offset,
        searchAfter: '',
        searchAfterArray: [],
      };

      setCombinedData(mergedResponse);
      setFetchStatus('success');
    } catch (err) {
      setError(err);
      setFetchStatus('error');

      const axiosError = err as AxiosError<SnowstormError>;
      if (axiosError.response?.status !== 400) {
        snowstormErrorHandler(err, 'Search Failed', serviceStatus);
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    void fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    branch,
    ecls,
    searchTerm,
    limit,
    offset,
    activeFilter,
    termActive,
    serviceStatus?.snowstorm.running,
  ]);

  return {
    isLoading,
    data: combinedData,
    error,
    fetchStatus,
    searchTerm,
    isFetching,
    refetch: fetchAllData,
  };
}

export function useConceptsByEclSnodineAllPagesWithInactives(
  branch: string,
  ecls: string[],
  options?: {
    limit?: number;
    offset?: number;
    term?: string;
    activeFilter?: boolean;
    termActive?: boolean;
  },
  showInactives?: boolean,
) {
  const { limit = 50, offset = 0, activeFilter, termActive } = options ?? {};
  let searchTerm = options?.term;
  const { serviceStatus } = useServiceStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [combinedData, setCombinedData] = useState<{
    items: TickFlickRefsetConcept[];
    total: number;
    limit: number;
    offset: number;
    searchAfter: string;
    searchAfterArray: string[];
  } | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<
    'idle' | 'fetching' | 'error' | 'success'
  >('idle');

  if (searchTerm && searchTerm.length < 3) searchTerm = '';

  const shouldCall = () => {
    if (!showInactives) {
      return false;
    }
    const validSearch = !!ecls?.length || !!searchTerm;

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }

    if (offset && limit && offset + limit > SNOWSTORM_LIMIT) {
      enqueueSnackbar(`Snowstorm: Offset limit exceeded`, {
        variant: 'error',
        autoHideDuration: 5000,
      });
      return false;
    }

    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const fetchAllPagesForEcl = async (
    ecl: string,
  ): Promise<TickFlickRefsetConcept[]> => {
    let allItems: TickFlickRefsetConcept[] = [];
    let currentSearchAfter: string | undefined;
    let currentOffset = offset;
    let firstResponse: ConceptResponse | null = null;
    let continueLoop = true;
    while (continueLoop) {
      const fetchOptions = {
        limit,
        offset: currentOffset,
        term: searchTerm,
        activeFilter,
        termActive,
        searchAfter: currentSearchAfter,
      };

      const response = await ConceptService.getEclConcepts(
        branch,
        ecl,
        fetchOptions,
      );

      if (!firstResponse) {
        firstResponse = response;
      }

      const tempResponse = response.items.map(item => {
        const tempItem = item as TickFlickRefsetConcept;
        tempItem.isQuerySpec = ecl === `^ ${QUERY_REFERENCE_SET}`;
        return tempItem;
      });
      allItems = [...allItems, ...tempResponse];

      // If there's no more data to fetch, break the loop
      if (!response.searchAfter || response.items.length === 0) {
        continueLoop = false;
      }

      // Prepare for next page
      currentSearchAfter = response.searchAfter;
      currentOffset += limit;
    }

    return allItems;
  };

  // Check if refset has inactive members
  const checkRefsetHasInactives = async (
    concept: Concept,
  ): Promise<boolean> => {
    try {
      if (!concept.conceptId) return false;
      const concepts = await ConceptService.getEclConcepts(
        branch,
        `^ ${concept.conceptId} {{ C active = 0 }}`,
        { limit: 1 },
      );
      return !!concepts.total;
    } catch (err) {
      console.error(
        `Failed to check inactives for concept ${concept.conceptId}:`,
        err,
      );
      return false;
    }
  };

  const processBatchesForInactives = async (
    concepts: TickFlickRefsetConcept[],
  ) => {
    const concurrentLimit = 10;
    const totalConcepts = concepts.length;
    let processedCount = 0;

    // Function to process a single concept
    const processConcept = async (index: number) => {
      if (index >= totalConcepts) return;

      const concept = concepts[index];
      const hasInactives = await checkRefsetHasInactives(concept);

      // Update the specific concept in the state
      setCombinedData(prevData => {
        if (!prevData) return null;

        const updatedItems = [...prevData.items];
        updatedItems[index] = {
          ...updatedItems[index],
          hasInactives,
        };

        return {
          ...prevData,
          items: updatedItems,
        };
      });

      // Process the next concept when this one finishes
      processedCount++;

      // Start processing the next concept
      await processConcept(processedCount + concurrentLimit - 1);
    };

    // Initialize the first batch of concurrent requests
    const initialPromises = [];
    for (let i = 0; i < Math.min(concurrentLimit, totalConcepts); i++) {
      initialPromises.push(processConcept(i));
    }

    // Wait for all processing to complete
    await Promise.all(initialPromises);
  };

  const fetchAllData = async () => {
    if (!shouldCall()) {
      return;
    }

    setIsLoading(true);
    setIsFetching(true);
    setFetchStatus('fetching');

    try {
      let allResults: TickFlickRefsetConcept[] = [];
      let totalItems = 0;

      // Fetch results for each ECL query
      for (const ecl of ecls) {
        const result = await fetchAllPagesForEcl(ecl);
        allResults = [...allResults, ...result];
        totalItems += result.length;
      }

      // Create enhanced concepts with initial loading state for hasInactives
      const enhancedConcepts: TickFlickRefsetConcept[] = allResults.map(
        concept => ({
          ...concept,
          hasInactives: 'loading',
        }),
      );

      // Create a combined response with all items from all ECLs
      const mergedResponse = {
        items: enhancedConcepts,
        total: totalItems,
        limit,
        offset,
        searchAfter: '',
        searchAfterArray: [],
      };

      // First set the data with loading state for inactives
      setCombinedData(mergedResponse);

      // Process concepts in batches to check for inactives
      await processBatchesForInactives(enhancedConcepts);

      setFetchStatus('success');
    } catch (err) {
      setError(err);
      setFetchStatus('error');

      const axiosError = err as AxiosError<SnowstormError>;
      if (axiosError.response?.status !== 400) {
        snowstormErrorHandler(err, 'Search Failed', serviceStatus);
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    void fetchAllData();
    // eslint-disable-next-line
  }, [
    branch,
    // eslint-disable-next-line
    JSON.stringify(ecls),
    searchTerm,
    limit,
    offset,
    activeFilter,
    termActive,
    showInactives,
    serviceStatus?.snowstorm.running,
  ]);

  return {
    isLoading,
    data: combinedData,
    error,
    fetchStatus,
    searchTerm,
    isFetching,
    refetch: fetchAllData,
  };
}
