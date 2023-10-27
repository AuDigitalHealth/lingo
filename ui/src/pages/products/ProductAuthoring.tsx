import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import SearchProduct from './components/SearchProduct.tsx';
import useConceptStore from '../../stores/ConceptStore.ts';
import { Simulate } from 'react-dom/test-utils';
import { MedicationPackageDetails } from '../../types/authoring.ts';
import { Grid } from '@mui/material';
import ProductAuthoringMain from './components/ProductAuthoringMain.tsx';
import { Stack } from '@mui/system';
import useInitializeConcepts from '../../hooks/api/useInitializeConcepts.tsx';
import Loading from '../../components/Loading.tsx';
import { Concept } from '../../types/concept.ts';
import { storeIngredientsExpanded } from '../../utils/helpers/conceptUtils.ts';
function ProductAuthoring() {
  const conceptStore = useConceptStore();
  const { units, containerTypes, ingredients, doseForms, brandProducts } =
    conceptStore;
  const defaultPackage: MedicationPackageDetails = {
    containedProducts: [],
    containedPackages: [],
    externalIdentifiers: [],
  };
  const [packageDetails, setPackageDetails] =
    useState<MedicationPackageDetails>(defaultPackage);

  const theme = useTheme();
  const { conceptsLoading } = useInitializeConcepts();
  const [selectedProduct, setSelectedProduct] = useState<Concept | null>(null);
  const [isLoadingMedication, setLoadingMedication] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isFormEditted, setIsFormEditted] = useState(false);
  const handleSelectedProductChange = (concept: Concept | null) => {
    setSelectedProduct(concept);
  };
  const handleClearForm = () => {
    setSelectedProduct(null);
    setPackageDetails(defaultPackage);
    setSearchInputValue('');
    storeIngredientsExpanded([]);
    setIsFormEditted(false);
  };
  useEffect(() => {
    if (selectedProduct) {
      setLoadingMedication(false);
    }
  }, [selectedProduct]);
  if (isLoadingMedication) {
    return (
      <Loading
        message={`Loading Medication details for ${selectedProduct?.conceptId}`}
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
              showConfirmationModalOnChange={isFormEditted}
              showDeviceSearch={true}
            />
          </Grid>
        </Stack>
        {packageDetails &&
        packageDetails.containedProducts &&
        packageDetails.containedPackages ? (
          <Grid>
            <ProductAuthoringMain
              selectedProduct={selectedProduct}
              units={units}
              containerTypes={containerTypes}
              doseForms={doseForms}
              ingredients={ingredients}
              brandProducts={brandProducts}
              handleClearForm={handleClearForm}
              isFormEdited={isFormEditted}
              setIsFormEdited={setIsFormEditted}
            />{' '}
          </Grid>
        ) : (
          <Grid></Grid>
        )}
      </Grid>
    );
  }
}
export default ProductAuthoring;
