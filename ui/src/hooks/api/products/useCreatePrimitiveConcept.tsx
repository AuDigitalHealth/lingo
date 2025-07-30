import { PrimitiveConceptCreationDetails } from '../../../types/product.ts';
import { useMutation } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';
import QualifierService from '../../../api/QualifierService.ts';

interface useCreatePrimitiveConceptArguments {
  primitiveCreationDetails: PrimitiveConceptCreationDetails;
  branch: string;
}

export function useCreatePrimitiveConcept() {
  const mutation = useMutation({
    mutationFn: ({
      primitiveCreationDetails: brandCreationDetails,
      branch,
    }: useCreatePrimitiveConceptArguments) => {
      return QualifierService.createPrimitiveConcept(
        brandCreationDetails,
        branch,
      );
    },
    onError: (error: AxiosError) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      enqueueSnackbar(
        `Error Creating Primitive:${error.response?.data.detail}`,
        {
          variant: 'error',
        },
      );
    },
    onSuccess: () => {
      enqueueSnackbar('Primitive created successfully.', {
        variant: 'success',
        autoHideDuration: 5000,
      });
    },
  });

  return mutation;
}
