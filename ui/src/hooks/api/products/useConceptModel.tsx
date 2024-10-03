import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductSummary } from '../../../types/concept';
import { snowstormErrorHandler } from '../../../types/ErrorHandler.ts';
import { useServiceStatus } from '../useServiceStatus.tsx';
import ProductService from '../../../api/ProductService.ts';

export function useConceptModel(
  id: string | undefined,
  reloadStateElements: () => void,
  setProductModel: (data: ProductSummary) => void,
  branch: string,
) {
  const { serviceStatus } = useServiceStatus();
  const { isLoading, data, error } = useQuery({
    queryKey: [`concept-model-${id}`],
    queryFn: () => {
      return ProductService.getProductModel(id as string, branch);
    },
    staleTime: 20 * (60 * 1000),
  });

  useMemo(() => {
    if (data) {
      reloadStateElements();
      setProductModel(data);
    }
  }, [data]);
  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Loading concept failed', serviceStatus);
    }
  }, [error]);

  return { isLoading, data };
}
