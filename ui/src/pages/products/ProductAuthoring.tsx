import React, { useEffect, useState } from 'react';
import SearchProduct from './components/SearchProduct.tsx';
import useConceptStore from '../../stores/ConceptStore.ts';
import { ProductType } from '../../types/product.ts';
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
import useAuthoringStore from '../../stores/AuthoringStore.ts';

interface ProductAuthoringProps {
  ticket: Ticket;
  task: Task;
}
function ProductAuthoring({ ticket, task }: ProductAuthoringProps) {
  const conceptStore = useConceptStore();
  const { defaultUnit, unitPack } = conceptStore;
  const { fieldBindingIsLoading, fieldBindings } = useInitializeFieldBindings(
    task.branchPath,
  );

  useInitializeConcepts(task.branchPath);

  const {
    selectedProduct,
    selectedProductType,
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
    if (selectedProduct) {
      setIsLoadingProduct(false);
      setFormContainsData(true);
    }
  }, [selectedProduct]);
  useEffect(() => {
    if (selectedProductType) {
      setIsLoadingProduct(false);
    }
  }, [selectedProductType]);
  if (isLoadingProduct || fieldBindingIsLoading) {
    return (
      <Loading
        message={`Loading Product details for ${selectedProduct?.conceptId}`}
      />
    );
  } else {
    return (
      <Grid>
        <h3>Create New Product</h3>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          // paddingLeft="1rem"
        >
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
              />
            </Box>
          </Card>
        </Stack>
        <Grid>
          {selectedProductType === ProductType.medication ? (
            <MedicationAuthoring
              selectedProduct={selectedProduct}
              handleClearForm={handleClearForm}
              isFormEdited={formContainsData}
              setIsFormEdited={setFormContainsData}
              branch={task.branchPath}
              ticket={ticket}
              fieldBindings={fieldBindings}
              defaultUnit={defaultUnit as Concept}
              unitPack={unitPack as Concept}
            />
          ) : (
            <DeviceAuthoring
              selectedProduct={selectedProduct}
              handleClearForm={handleClearForm}
              isFormEdited={formContainsData}
              setIsFormEdited={setFormContainsData}
              branch={task.branchPath}
              fieldBindings={fieldBindings}
              defaultUnit={defaultUnit as Concept}
            />
          )}
        </Grid>
      </Grid>
    );
  }
}
export default ProductAuthoring;
