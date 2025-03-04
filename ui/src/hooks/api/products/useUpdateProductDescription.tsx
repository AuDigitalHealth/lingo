import {
  ProductDescriptionUpdateRequest,
  ProductExternalRequesterUpdateRequest,
} from '../../../types/product.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';
import productService from '../../../api/ProductService.ts';

interface useUpdateProductDescriptionArguments {
  productDescriptionUpdateRequest: ProductDescriptionUpdateRequest;
  productId: string;
  branch: string;
}

export function useUpdateProductDescription() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      productDescriptionUpdateRequest,
      productId,
      branch,
    }: useUpdateProductDescriptionArguments) => {
      // debugger;
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
    onSuccess: (_res, _args) => {
      console.log(`concept-model-${_args.branch}-${_args.productId}`);
      void queryClient.invalidateQueries({
        queryKey: [`concept-model-${_args.branch}-${_args.productId}`],
      });
      enqueueSnackbar('Product edited successfully.', { variant: 'success' });
    },
  });

  return mutation;
}

interface useUpdateProductExternalIdentifiersArguments {
  externalRequesterUpdate: ProductExternalRequesterUpdateRequest;
  productId: string;
  branch: string;
}

export function useUpdateProductExternalIdentifiers() {
  const mutation = useMutation({
    mutationFn: ({
      externalRequesterUpdate,
      productId,
      branch,
    }: useUpdateProductExternalIdentifiersArguments) => {
      return productService.editProductExternalIdentifiers(
        externalRequesterUpdate,
        productId,
        branch,
      );
    },
    onError: (error: AxiosError) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      enqueueSnackbar(
        `Error Editing Product Artg Ids:${error.response?.data.detail}`,
        {
          variant: 'error',
        },
      );
    },
    onSuccess: () => {
      enqueueSnackbar('Product Artg Ids edited successfully.', {
        variant: 'success',
      });
    },
  });

  return mutation;
}
