import {
  ProductDescriptionUpdateRequest,
  ProductNonDefiningPropertyUpdateRequest
} from '../../../types/product.ts';
import { useMutation } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';
import productService from '../../../api/ProductService.ts';

interface useUpdateProductDescriptionArguments {
  productDescriptionUpdateRequest: ProductDescriptionUpdateRequest;
  productId: string;
  branch: string;
}

export function useUpdateProductDescription() {
  const mutation = useMutation({
    mutationFn: ({
      productDescriptionUpdateRequest,
      productId,
      branch,
    }: useUpdateProductDescriptionArguments) => {
      return productService.editProductDescriptions(
        productDescriptionUpdateRequest,
        productId,
        branch,
      );
    },
    onError: (error: AxiosError) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      enqueueSnackbar(`Error Editing Product:${error.response?.data.detail}`, {
        variant: 'error',
      });
    },
    onSuccess: () => {
      enqueueSnackbar('Product edited successfully.', { variant: 'success' });
    },
  });

  return mutation;
}

interface useUpdateProductNonDefiningPropertyArguments {
  propertyUpdate: ProductNonDefiningPropertyUpdateRequest;
  productId: string;
  branch: string;
}

export function useUpdateProductNonDefiningProperties() {
  const mutation = useMutation({
    mutationFn: ({
      propertyUpdate,
      productId,
      branch,
    }: useUpdateProductNonDefiningPropertyArguments) => {
      return productService.editProductNonDefiningProperties(
        propertyUpdate,
        productId,
        branch,
      );
    },
    onError: (error: AxiosError) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      enqueueSnackbar(
        `Error Editing Product properties Ids:${error.response?.data.detail}`,
        {
          variant: 'error',
        },
      );
    },
    onSuccess: () => {
      enqueueSnackbar('Product properties edited successfully.', {
        variant: 'success',
      });
    },
  });

  return mutation;
}
