import React, {useCallback, useState} from 'react';
import {ActionType} from '../../../types/product.ts';
import {Alert, AlertTitle, Box, Button, Grid} from '@mui/material';

import {Concept} from '../../../types/concept.ts';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';

import {Ticket} from '../../../types/tickets/ticket.ts';
import {isFsnToggleOn} from '../../../utils/helpers/conceptUtils.ts';
import {useConceptModel} from '../../../hooks/api/products/useConceptModel.tsx';
import Loading from '../../../components/Loading.tsx';
import ProductPreviewEditMode from '../ProductPreviewEditMode.tsx';

export interface EditProductProps {
  selectedProduct: Concept | null;
  handleClearForm: () => void;
  isFormEdited: boolean;

  branch: string;
  ticket: Ticket;
  actionType: ActionType;
}

function EditProduct(productprops: EditProductProps) {
  const {
    selectedProduct,
    handleClearForm,
    isFormEdited,

    branch,
    ticket,
  } = productprops;

  const [, setFsnToggle] = useState<boolean>(isFsnToggleOn);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const reloadStateElements = useCallback(() => {
    setFsnToggle(isFsnToggleOn);
  }, [setFsnToggle]);

  const { isLoading, data } = useConceptModel(
    selectedProduct && selectedProduct.conceptId
      ? selectedProduct.conceptId
      : undefined,
    reloadStateElements,
    branch,
  );

  if (isLoading) {
    return (
      <Loading
        message={`Loading box model for ${selectedProduct?.conceptId}`}
      />
    );
  }
  if (!selectedProduct || !data) {
    return (
      <Alert severity="info">
        <AlertTitle>Info</AlertTitle>
        Search and select a product to edit.
      </Alert>
    );
  }

  if (data && selectedProduct) {
    return (
      <Box sx={{ width: '100%' }}>
        <Grid container data-testid={'product-edit-grid'}>
          <ConfirmationModal
            open={resetModalOpen}
            content={`This will remove all details that have been entered into this form`}
            handleClose={() => {
              setResetModalOpen(false);
            }}
            title={'Confirm Clear'}
            disabled={!isFormEdited}
            action={'Proceed with clear'}
            handleAction={() => {
              handleClearForm();
              setResetModalOpen(false);
            }}
          />
          <Grid container justifyContent="flex-end">
            <Button
              type="reset"
              onClick={() => {
                setResetModalOpen(true);
              }}
              disabled={!isFormEdited}
              variant="contained"
              color="error"
              data-testid={'product-clear-btn'}
            >
              Clear
            </Button>
          </Grid>
          <Box sx={{ paddingTop: '15px' }}>
            <ProductPreviewEditMode
              branch={branch}
              productModel={data}
              ticket={ticket}
            />
          </Box>
        </Grid>
      </Box>
    );
  }
  return <></>;
}

export default EditProduct;
