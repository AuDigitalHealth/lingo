import { useQuery } from '@tanstack/react-query';
import productService from '../../../api/ProductService.ts';

export function useExternalIdentifiers(
  productId: string | undefined,
  branch: string | undefined,
) {
  const query = useQuery({
    queryKey: [`external-identifier-${productId}-${branch}`],
    queryFn: () =>
      productService.getExternalIdentifiers(
        productId as string,
        branch as string,
      ),
    enabled: productId !== undefined && branch !== undefined,
    staleTime: 0,
  });

  return query;
}
