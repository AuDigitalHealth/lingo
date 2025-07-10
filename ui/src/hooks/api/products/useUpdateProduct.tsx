import {
  ProductExternalRequesterUpdateRequest,
  ProductUpdateRequest,
} from '../../../types/product.ts';
import { useMutation } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';
import productService from '../../../api/ProductService.ts';

interface useUpdateProductDescriptionArguments {
  productUpdateRequest: ProductUpdateRequest;
  productId: string;
  branch: string;
}

export function useUpdateProduct() {
  const mutation = useMutation({
    mutationFn: ({
      productUpdateRequest,
      productId,
      branch,
    }: useUpdateProductDescriptionArguments) => {
      return productService.editProduct(
        productUpdateRequest,
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
