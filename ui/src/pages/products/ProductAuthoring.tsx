import React, { useEffect, useState } from 'react';

import { useTheme } from '@mui/material/styles';
import SearchProduct from './components/SearchProduct.tsx';
import useConceptStore from '../../stores/ConceptStore.ts';
import conceptService from '../../api/ConceptService.ts';
import { Simulate } from 'react-dom/test-utils';
import error = Simulate.error;
import { MedicationPackageDetails } from '../../types/authoring.ts';
import { Grid } from '@mui/material';
import ProductAuthoringMain from './components/ProductAuthoringMain.tsx';
import { Stack } from '@mui/system';
import useInitializeConcepts from '../../hooks/api/useInitializeConcepts.tsx';
import Loading from '../../components/Loading.tsx';

function ProductAuthoring() {
  const conceptStore = useConceptStore();
  const {
    activeProduct,
    units,
    containerTypes,
    ingredients,
    doseForms,
    brandProducts,
  } = conceptStore;
  const [packageDetails, setPackageDetails] =
    useState<MedicationPackageDetails>();
  const [name, setName] = useState<string>('Random');
  const theme = useTheme();
  const { conceptsLoading } = useInitializeConcepts();
  useEffect(() => {
    conceptService
      .fetchMedication(activeProduct ? activeProduct.conceptId : '')
      .then(mp => {
        setPackageDetails(mp);
        console.log(packageDetails?.productName.conceptId);
        if (packageDetails) {
          setName(packageDetails.productName.conceptId);
        }
      })
      .catch(error);
  }, [activeProduct]);
  if (conceptsLoading) {
    return <Loading />;
  } else {
    return (
      <Grid>
        <h1>Product Authoring</h1>
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
            <SearchProduct authoring={true} />
          </Grid>
        </Stack>

        {packageDetails && packageDetails.productName ? (
          <Grid>
            <ProductAuthoringMain
              packageDetails={packageDetails}
              show={true}
              units={units}
              containerTypes={containerTypes}
              ingredients={ingredients}
              doseForms={doseForms}
              brandProducts={brandProducts}
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
