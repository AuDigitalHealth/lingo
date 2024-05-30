import React, { useEffect } from 'react';
import SearchProduct from './components/SearchProduct.tsx';
import useConceptStore from '../../stores/ConceptStore.ts';
import { Card, Grid } from '@mui/material';
import MedicationAuthoring from './components/MedicationAuthoring.tsx';
import { Box, Stack } from '@mui/system';
import useInitializeConcepts from '../../hooks/api/useInitializeConcepts.tsx';
import Loading from '../../components/Loading.tsx';
import { Concept } from '../../types/concept.ts';
import DeviceAuthoring from './components/DeviceAuthoring.tsx';
import { Ticket } from '../../types/tickets/ticket.ts';
import { Task } from '../../types/task.ts';
import { useInitializeFieldBindings } from '../../hooks/api/useInitializeConfig.tsx';
import { useNavigate } from 'react-router';
import useAuthoringStore from '../../stores/AuthoringStore.ts';
import { isDeviceType } from '../../utils/helpers/conceptUtils.ts';
import { ProductType } from '../../types/product.ts';
import { isValueSetExpansionContains } from '../../types/predicates/isValueSetExpansionContains.ts';

interface ProductAuthoringProps {
  ticket: Ticket;
  task: Task;
  productName?: string;
  productType?: ProductType;
}
function ProductAuthoring({
  ticket,
  task,
  productName,
  productType,
}: ProductAuthoringProps) {
  const conceptStore = useConceptStore();
  const { defaultUnit, unitPack } = conceptStore;
  const { fieldBindingIsLoading, fieldBindings } = useInitializeFieldBindings(
    task.branchPath,
  );

  useInitializeConcepts(task.branchPath);

  const {
    selectedProduct,
    selectedProductType,
    setSelectedProductType,
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
        message={`Loading Product details for ${isValueSetExpansionContains(selectedProduct) ? selectedProduct.code : selectedProduct?.conceptId}`}
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
                />
                {/*<Button color={"error"} variant={"contained"}>Clear</Button>*/}
              </Box>
            </Card>
          </Stack>
        ) : (
          <div />
        )}

        <Grid>
          {!isDeviceType(selectedProductType) ? (
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
              ticketProductId={productName}
            />
          ) : (
            <DeviceAuthoring
              selectedProduct={selectedProduct}
              handleClearForm={handleClearFormWrapper}
              isFormEdited={formContainsData}
              setIsFormEdited={setFormContainsData}
              branch={task.branchPath}
              fieldBindings={fieldBindings}
              defaultUnit={defaultUnit as Concept}
              ticket={ticket}
              ticketProductId={productName}
            />
          )}
        </Grid>
      </Grid>
    );
  }
}
export default ProductAuthoring;
