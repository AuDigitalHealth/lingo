import { queryOptions, useQuery } from '@tanstack/react-query';
import { Concept } from '../../../types/concept.ts';
import { useServiceStatus } from '../useServiceStatus.tsx';
import { useEffect } from 'react';
import { snowstormErrorHandler } from '../../../types/ErrorHandler.ts';
import {
  bulkAuthorBrands,
  bulkAuthorPackSizes,
} from '../../../types/queryKeys.ts';
import productService from '../../../api/ProductService.ts';

export const getBulkAuthorPackSizeOptions = (
  id: string | undefined,
  branch: string,
) => {
  const queryKey = [bulkAuthorPackSizes, id];
  return queryOptions({
    queryKey,
    queryFn: () =>
      productService.getMedicationProductPackSizes(id as string, branch),
    retry: false,
    enabled: !!id,
    staleTime: 20 * 60 * 1000,
  });
};
export const useFetchBulkAuthorPackSizes = (
  selectedProduct: Concept | null,
  branch: string,
) => {
  const { serviceStatus } = useServiceStatus();
  const { data, error, isError, isFetching } = useQuery({
    ...getBulkAuthorPackSizeOptions(selectedProduct?.conceptId, branch),
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Pack size loading Failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return { data, error, isError, isFetching };
};

export const getBulkAuthorBrandOptions = (
  id: string | undefined,
  branch: string,
) => {
  const queryKey = [bulkAuthorBrands, id];
  return queryOptions({
    queryKey,
    queryFn: () =>
      productService.getMedicationProductBrands(id as string, branch),
    retry: false,
    enabled: !!id,
    staleTime: 20 * 60 * 1000,
  });
};

export const useFetchBulkAuthorBrands = (
  selectedProduct: Concept | null,
  branch: string,
) => {
  const { serviceStatus } = useServiceStatus();
  const { data, error, isError, isFetching } = useQuery({
    ...getBulkAuthorBrandOptions(selectedProduct?.conceptId, branch),
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Brand loading Failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return { data, error, isError, isFetching };
};
