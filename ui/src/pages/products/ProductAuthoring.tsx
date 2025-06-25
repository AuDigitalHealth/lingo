import React, { useEffect } from 'react';
import SearchProduct from './components/SearchProduct.tsx';

import { Card, Grid } from '@mui/material';

import { Box, Stack } from '@mui/system';
import useInitializeConcepts from '../../hooks/api/useInitializeConcepts.tsx';
import Loading from '../../components/Loading.tsx';

import { Ticket } from '../../types/tickets/ticket.ts';
import { Task } from '../../types/task.ts';
import { useFieldBindings } from '../../hooks/api/useInitializeConfig.tsx';
import { useNavigate } from 'react-router-dom';
import useAuthoringStore from '../../stores/AuthoringStore.ts';
import { ActionType, ProductType } from '../../types/product.ts';
import { isValueSetExpansionContains } from '../../types/predicates/isValueSetExpansionContains.ts';

import EditProduct from './components/EditProduct.tsx';
import MedicationAuthoring from './rjsf/MedicationAuthoring.tsx';
import DeviceAuthoring from './rjsf/DeviceAuthoring.tsx';
import BrandAuthoring from './rjsf/BrandAuthoring.tsx';
import PackSizeAuthoring from './rjsf/PackSizeAuthoring.tsx';

interface ProductAuthoringProps {
  ticket: Ticket;
  task: Task;
  productName?: string;
  productId?: string;
  productType?: ProductType;
  actionType?: ActionType;
}
function ProductAuthoring({
  ticket,
  task,
  productName,
  productId,
  productType,
  actionType,
}: ProductAuthoringProps) {
  const { fieldBindingIsLoading, fieldBindings } = useFieldBindings(
    task.branchPath,
  );

  useInitializeConcepts(task.branchPath);

  const {
    selectedProduct,
    selectedProductType,
    selectedActionType,
    setSelectedProductType,
    setSelectedActionType,
    isLoadingProduct,
    setIsLoadingProduct,
    searchInputValue,
    setSearchInputValue,
    formContainsData,
    setFormContainsData,
    handleSelectedProductChange,
    handleClearForm,
  } = useAuthoringStore();

  useEffect(() => {
    if (productType) {
      setSelectedProductType(productType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType]);

  useEffect(() => {
    if (actionType) {
      setSelectedActionType(actionType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionType]);

  useEffect(() => {
    return () => {
      handleClearForm();
    };
  }, [handleClearForm]);
  useEffect(() => {
    if (selectedProduct) {
      setIsLoadingProduct(false);
      setFormContainsData(true);
    }
  }, [selectedProduct, setIsLoadingProduct, setFormContainsData]);

  useEffect(() => {
    if (selectedProductType) {
      setIsLoadingProduct(false);
    }
  }, [selectedProductType, setIsLoadingProduct]);

  useEffect(() => {
    if (productName) {
      handleClearForm();
    }
  }, [productName, handleClearForm]);

  const navigate = useNavigate();
  const handleClearFormWrapper = () => {
    handleClearForm();

    if (productName) {
      navigate('../product');
    }
  };

  if (isLoadingProduct || fieldBindingIsLoading) {
    return (
      <Loading
        message={`Loading Product details for ${isValueSetExpansionContains(selectedProduct) ? selectedProduct.code : productName ? productName : selectedProduct?.conceptId}`}
      />
    );
  } else {
    return (
      <Grid>
        <h3>
          {getTitle(productName, getActionType(actionType, selectedActionType))}
        </h3>
        {!productName ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <Card sx={{ marginY: '1em', padding: '1em', width: '100%' }}>
              <Box display={'flex'} justifyContent={'space-between'}>
                <SearchProduct
                  disableLinkOpen={true}
                  handleChange={handleSelectedProductChange}
                  inputValue={searchInputValue}
                  setInputValue={setSearchInputValue}
                  showConfirmationModalOnChange={formContainsData}
                  showDeviceSearch={true}
                  branch={task.branchPath}
                  fieldBindings={fieldBindings}
                  hideAdvancedSearch={true}
                  actionType={getActionType(actionType, selectedActionType)}
                />
                {/*<Button color={"error"} variant={"contained"}>Clear</Button>*/}
              </Box>
            </Card>
          </Stack>
        ) : (
          <div />
        )}

        <Grid>
          {getActionType(actionType, selectedActionType) ===
          ActionType.newMedication ? (
            <MedicationAuthoring
              selectedProduct={selectedProduct}
              task={task}
              ticketProductId={productId}
              ticket={ticket}
              schemaType='medication'
            />
          ) : getActionType(actionType, selectedActionType) ===
            ActionType.newVaccine ? (
            <MedicationAuthoring
              selectedProduct={selectedProduct}
              task={task}
              ticketProductId={productId}
              ticket={ticket}
              schemaType='vaccine'
            />
          ) : getActionType(actionType, selectedActionType) ===
            ActionType.newNutritionalProduct ? (
            <MedicationAuthoring
              selectedProduct={selectedProduct}
              task={task}
              ticketProductId={productId}
              ticket={ticket}
              schemaType='nutritional'
            />
          ) : getActionType(actionType, selectedActionType) ===
            ActionType.newDevice ? (
            <DeviceAuthoring
              selectedProduct={selectedProduct}
              ticket={ticket}
              task={task}
              ticketProductId={productId}
            />
          ) : getActionType(actionType, selectedActionType) ===
            ActionType.newPackSize ? (
            <PackSizeAuthoring
              selectedProduct={selectedProduct}
              ticket={ticket}
              task={task}
              fieldBindings={fieldBindings}
            />
          ) : getActionType(actionType, selectedActionType) ===
            ActionType.newBrand ? (
            <BrandAuthoring
              selectedProduct={selectedProduct}
              ticket={ticket}
              task={task}
              fieldBindings={fieldBindings}
            />
          ) : getActionType(actionType, selectedActionType) ===
            ActionType.editProduct ? (
            <EditProduct
              selectedProduct={selectedProduct}
              handleClearForm={handleClearFormWrapper}
              isFormEdited={formContainsData}
              setIsFormEdited={setFormContainsData}
              branch={task.branchPath}
              ticket={ticket}
              fieldBindings={fieldBindings}
              ticketProductId={productName}
              actionType={selectedActionType}
            />
          ) : (
            <></>
          )}
        </Grid>
      </Grid>
    );
  }
}
const getTitle = (
  productName: string | undefined,
  actionType: ActionType | undefined,
) => {
  if (actionType === ActionType.editProduct) {
    return 'Edit Product';
  }

  return productName
    ? `Manage Product (Loaded from ${productName})`
    : 'Manage Product';
};
const getActionType = (
  actionType: ActionType | undefined,
  selectedActionType: ActionType,
) => {
  if (actionType) {
    return actionType;
  }
  return selectedActionType;
};
export default ProductAuthoring;
