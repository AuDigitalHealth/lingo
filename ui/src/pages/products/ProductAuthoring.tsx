import React, { useEffect } from 'react';
import SearchProduct from './components/SearchProduct.tsx';
import useConceptStore from '../../stores/ConceptStore.ts';
import { Card, Grid } from '@mui/material';
import MedicationAuthoring from './components/MedicationAuthoring.tsx';
import { Box, Stack } from '@mui/system';
import useInitializeConcepts, {
  useDefaultUnit,
  useUnitPack,
} from '../../hooks/api/useInitializeConcepts.tsx';
import Loading from '../../components/Loading.tsx';
import { Concept } from '../../types/concept.ts';
import DeviceAuthoring from './components/DeviceAuthoring.tsx';
import { Ticket } from '../../types/tickets/ticket.ts';
import { Task } from '../../types/task.ts';
import { useFieldBindings } from '../../hooks/api/useInitializeConfig.tsx';
import { useNavigate } from 'react-router';
import useAuthoringStore from '../../stores/AuthoringStore.ts';
import { ActionType, ProductType } from '../../types/product.ts';
import { isValueSetExpansionContains } from '../../types/predicates/isValueSetExpansionContains.ts';
import PackSizeAuthoring from './components/PackSizeAuthoring.tsx';
import BrandAuthoring from './components/BrandAuthoring.tsx';

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
  const conceptStore = useConceptStore();
  const { defaultProductPackSizes, defaultProductBrands } = conceptStore;
  const { fieldBindingIsLoading, fieldBindings } = useFieldBindings(
    task.branchPath,
  );

  const { unitPack } = useUnitPack(task.branchPath);

  const { defaultUnit } = useDefaultUnit(task.branchPath);

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
  }, [productType]);

  useEffect(() => {
    if (actionType) {
      setSelectedActionType(actionType);
    }
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
          {productName
            ? `Create New Product (Loaded from ${productName})`
            : 'Create New Product'}
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
                  actionType={selectedActionType}
                />
                {/*<Button color={"error"} variant={"contained"}>Clear</Button>*/}
              </Box>
            </Card>
          </Stack>
        ) : (
          <div />
        )}

        <Grid>
          {selectedActionType === ActionType.newDevice ? (
            <DeviceAuthoring
              selectedProduct={selectedProduct}
              handleClearForm={handleClearFormWrapper}
              isFormEdited={formContainsData}
              setIsFormEdited={setFormContainsData}
              branch={task.branchPath}
              fieldBindings={fieldBindings}
              defaultUnit={defaultUnit as Concept}
              ticket={ticket}
              ticketProductId={productId}
              actionType={selectedActionType}
              productName={productName}
            />
          ) : selectedActionType === ActionType.newMedication ? (
            <MedicationAuthoring
              selectedProduct={selectedProduct}
              handleClearForm={handleClearFormWrapper}
              isFormEdited={formContainsData}
              setIsFormEdited={setFormContainsData}
              branch={task.branchPath}
              ticket={ticket}
              fieldBindings={fieldBindings}
              defaultUnit={defaultUnit as Concept}
              unitPack={unitPack as Concept}
              ticketProductId={productId}
              actionType={selectedActionType}
              productName={productName}
            />
          ) : selectedActionType === ActionType.newPackSize ? (
            <PackSizeAuthoring
              selectedProduct={selectedProduct}
              handleClearForm={handleClearFormWrapper}
              isFormEdited={formContainsData}
              setIsFormEdited={setFormContainsData}
              branch={task.branchPath}
              ticket={ticket}
              fieldBindings={fieldBindings}
              packSizes={defaultProductPackSizes}
              ticketProductId={productName}
              actionType={selectedActionType}
            />
          ) : selectedActionType === ActionType.newBrand ? (
            <BrandAuthoring
              selectedProduct={selectedProduct}
              handleClearForm={handleClearFormWrapper}
              isFormEdited={formContainsData}
              setIsFormEdited={setFormContainsData}
              branch={task.branchPath}
              ticket={ticket}
              fieldBindings={fieldBindings}
              productBrands={defaultProductBrands}
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
export default ProductAuthoring;
