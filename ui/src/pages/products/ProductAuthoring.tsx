import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
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

interface ProductAuthoringProps {
  ticket: Ticket;
  task: Task;
}
function ProductAuthoring({ ticket, task }: ProductAuthoringProps) {
  const conceptStore = useConceptStore();
  const { units, containerTypes, medicationDeviceTypes } = conceptStore;

  useInitializeConcepts(task.branchPath);
  const [selectedProduct, setSelectedProduct] = useState<Concept | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<ProductType>(
    ProductType.medication,
  );
  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [FormContainsData, setFormContainsData] = useState(false);
  const handleSelectedProductChange = (
    concept: Concept | null,
    productType: ProductType,
  ) => {
    setSelectedProduct(concept);
    setSelectedProductType(productType);
  };
  const handleClearForm = () => {
    setSelectedProduct(null);
    setSearchInputValue('');
    // storeIngredientsExpanded([]);
    setFormContainsData(false);
  };
  useEffect(() => {
    if (selectedProduct) {
      setLoadingProduct(false);
      setFormContainsData(true);
    }
  }, [selectedProduct]);
  useEffect(() => {
    if (selectedProductType) {
      setLoadingProduct(false);
    }
  }, [selectedProductType]);
  if (isLoadingProduct) {
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
          {/*<Grid>*/}
          {/*<span style={{ color: `${theme.palette.primary.main}` }}>*/}
          {/*  Load an existing product:*/}
          {/*</span>*/}
          {/*</Grid>*/}
          {/*<Grid>*/}
          <Card sx={{ marginY: '1em', padding: '1em', width: '100%' }}>
            <Box display={'flex'} justifyContent={'space-between'}>
              <SearchProduct
                disableLinkOpen={true}
                handleChange={handleSelectedProductChange}
                inputValue={searchInputValue}
                setInputValue={setSearchInputValue}
                showConfirmationModalOnChange={FormContainsData}
                showDeviceSearch={true}
                branch={task.branchPath}
              />
              {/*<Button color={"error"} variant={"contained"}>Clear</Button>*/}
            </Box>
          </Card>
        </Stack>
        <Grid>
          {selectedProductType === ProductType.medication ? (
            <MedicationAuthoring
              selectedProduct={selectedProduct}
              units={units}
              containerTypes={containerTypes}
              medicationDeviceTypes={medicationDeviceTypes}
              handleClearForm={handleClearForm}
              isFormEdited={FormContainsData}
              setIsFormEdited={setFormContainsData}
              branch={task.branchPath}
              ticket={ticket}
            />
          ) : (
            <DeviceAuthoring
              selectedProduct={selectedProduct}
              units={units}
              containerTypes={containerTypes}
              handleClearForm={handleClearForm}
              isFormEdited={FormContainsData}
              setIsFormEdited={setFormContainsData}
              branch={task.branchPath}
            />
          )}
        </Grid>
      </Grid>
    );
  }
}
export default ProductAuthoring;
