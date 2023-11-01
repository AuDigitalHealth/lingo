import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import SearchProduct from './components/SearchProduct.tsx';
import useConceptStore from '../../stores/ConceptStore.ts';
import { ProductType } from '../../types/product.ts';
import { Grid } from '@mui/material';
import MedicationAuthoring from './components/MedicationAuthoring.tsx';
import { Stack } from '@mui/system';
import useInitializeConcepts from '../../hooks/api/useInitializeConcepts.tsx';
import Loading from '../../components/Loading.tsx';
import { Concept } from '../../types/concept.ts';
import { storeIngredientsExpanded } from '../../utils/helpers/conceptUtils.ts';
import DeviceAuthoring from './components/DeviceAuthoring.tsx';

function ProductAuthoring() {
  const conceptStore = useConceptStore();
  const {
    units,
    containerTypes,
    ingredients,
    doseForms,
    brandProducts,
    deviceBrandProducts,
    deviceDeviceTypes,
    medicationDeviceTypes,
  } = conceptStore;

  const theme = useTheme();
  const { conceptsLoading } = useInitializeConcepts();
  const [selectedProduct, setSelectedProduct] = useState<Concept | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<ProductType>(
    ProductType.medication,
  );
  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isFormEdited, setIsFormEdited] = useState(true);
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
    storeIngredientsExpanded([]);
    // setIsFormEdited(false);
  };
  useEffect(() => {
    if (selectedProduct) {
      setLoadingProduct(false);
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
        <h1>Create New Product</h1>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          paddingLeft="1rem"
        >
          <Grid item xs={2}>
            <span style={{ color: `${theme.palette.primary.main}` }}>
              Load an existing product:
            </span>
          </Grid>
          <Grid item xs={3}>
            <SearchProduct
              disableLinkOpen={true}
              handleChange={handleSelectedProductChange}
              inputValue={searchInputValue}
              setInputValue={setSearchInputValue}
              showConfirmationModalOnChange={isFormEdited}
              showDeviceSearch={true}
            />
          </Grid>
        </Stack>
        <Grid>
          {selectedProductType === ProductType.medication ? (
            <MedicationAuthoring
              selectedProduct={selectedProduct}
              units={units}
              containerTypes={containerTypes}
              doseForms={doseForms}
              ingredients={ingredients}
              medicationDeviceTypes={medicationDeviceTypes}
              brandProducts={brandProducts}
              handleClearForm={handleClearForm}
              isFormEdited={isFormEdited}
              setIsFormEdited={setIsFormEdited}
            />
          ) : (
            <DeviceAuthoring
              selectedProduct={selectedProduct}
              units={units}
              containerTypes={containerTypes}
              deviceDeviceTypes={deviceDeviceTypes}
              brandProducts={deviceBrandProducts}
              handleClearForm={handleClearForm}
              isFormEdited={isFormEdited}
              setIsFormEdited={setIsFormEdited}
            />
          )}
        </Grid>
      </Grid>
    );
  }
}
export default ProductAuthoring;
