import { BrandCreationDetails } from '../../../types/product.ts';
import { useMutation } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';
import QualifierService from '../../../api/QualifierService.ts';

interface useCreateBrandArguments {
  brandCreationDetails: BrandCreationDetails;
  branch: string;
}

export function useCreateBrand() {
  const mutation = useMutation({
    mutationFn: ({ brandCreationDetails, branch }: useCreateBrandArguments) => {
      return QualifierService.createBrand(brandCreationDetails, branch);
    },
    onError: (error: AxiosError) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      enqueueSnackbar(`Error Creating Brand:${error.response?.data.detail}`, {
        variant: 'error',
      });
    },
    onSuccess: () => {
      enqueueSnackbar('Brand created successfully.', { variant: 'success' });
    },
  });

  return mutation;
}
