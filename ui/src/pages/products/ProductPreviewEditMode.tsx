import { Box } from '@mui/material';
import React from 'react';
import { ProductSummary } from '../../types/concept.ts';

import { useForm } from 'react-hook-form';

import { Ticket } from '../../types/tickets/ticket.ts';

import useAuthoringStore from '../../stores/AuthoringStore.ts';
import ProductPreviewBody from './components/ProductPreviewBody.tsx';

interface ProductPreviewEditModeProps {
  productModel: ProductSummary;
  branch: string;
  ticket: Ticket;
}

function ProductPreviewEditMode({
  branch,
  productModel,
  ticket,
}: ProductPreviewEditModeProps) {
  const defaultValues: ProductSummary = {
    nodes: [],
    edges: [],
    subjects: [],
  };
  const { register, control, getValues, setValue, watch } =
    useForm<ProductSummary>({
      defaultValues,
    });

  const { handlePreviewToggleModal } = useAuthoringStore();

  return (
    <>
      <Box width={'100%'}>
        <ProductPreviewBody
          productModel={productModel}
          control={control}
          register={register}
          watch={watch}
          getValues={getValues}
          readOnlyMode={false}
          editProduct={true}
          newConceptFound={false}
          branch={branch}
          handleClose={handlePreviewToggleModal}
          setValue={setValue}
          ticket={ticket}
        />
      </Box>
    </>
  );
}

export default ProductPreviewEditMode;
