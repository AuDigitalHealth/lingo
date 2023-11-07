import React, { useEffect, useState } from 'react';
import { DevicePackageDetails, ProductType } from '../../../types/product.ts';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { Box, Button, Grid, Paper, TextField } from '@mui/material';

import { Stack } from '@mui/system';
import { Concept } from '../../../types/concept.ts';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import ContainedProducts from './ContainedProducts.tsx';
import ArtgAutoComplete from './ArtgAutoComplete.tsx';
import conceptService from '../../../api/ConceptService.ts';
import { InnerBox, Level1Box } from './style/ProductBoxes.tsx';
import Loading from '../../../components/Loading.tsx';
import { enqueueSnackbar } from 'notistack';

export interface DeviceAuthoringProps {
  selectedProduct: Concept | null;
  units: Concept[];
  containerTypes: Concept[];
  deviceDeviceTypes: Concept[];
  brandProducts: Concept[];
  handleClearForm: () => void;
  isFormEdited: boolean;
  setIsFormEdited: (value: boolean) => void;
  branch: string;
}

function DeviceAuthoring(productProps: DeviceAuthoringProps) {
  const {
    selectedProduct,
    units,
    containerTypes,
    deviceDeviceTypes,
    brandProducts,
    handleClearForm,
    isFormEdited,
    setIsFormEdited,
    branch,
  } = productProps;

  const defaultForm: DevicePackageDetails = {
    containedProducts: [],
    // containedPackages: [],
  };

  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const { register, control, handleSubmit, reset } =
    useForm<DevicePackageDetails>({
      defaultValues: defaultForm,
    });
  const onSubmit: SubmitHandler<DevicePackageDetails> = data =>
    console.log(data);

  useEffect(() => {
    if (selectedProduct) {
      setLoadingProduct(true);
      conceptService
        .fetchDevice(
          selectedProduct ? (selectedProduct.conceptId as string) : '',
          branch,
        )
        .then(dp => {
          if (dp.productName) {
            reset(dp);
            setLoadingProduct(false);
          }
        })
        .catch(err => {
          setLoadingProduct(false);
          enqueueSnackbar(
            `Unable to load Device  [${selectedProduct?.pt.term}] with the error:${err}`,
            {
              variant: 'error',
            },
          );
        });
    }
  }, [reset, selectedProduct]);

  const {
    fields: productFields,
    append: productAppend,
    remove: productRemove,
  } = useFieldArray({
    control,
    name: 'containedProducts',
  });

  if (isLoadingProduct) {
    return (
      <div style={{ marginTop: '200px' }}>
        <Loading
          message={`Loading Product details for ${selectedProduct?.conceptId}`}
        />
      </div>
    );
  } else {
    return (
      <Box sx={{ width: '100%' }}>
        <Grid container>
          <Grid item sm={12} xs={12}>
            <Paper>
              <Box m={2} p={2}>
                <form
                  onSubmit={event => void handleSubmit(onSubmit)(event)}
                  onChange={() => {
                    if (!isFormEdited) {
                      setIsFormEdited(true);
                    }
                  }}
                >
                  <ConfirmationModal
                    open={resetModalOpen}
                    content={`Confirm clear?. This will reset the unsaved changes`}
                    handleClose={() => {
                      setResetModalOpen(false);
                    }}
                    title={'Confirm Clear'}
                    disabled={!isFormEdited}
                    action={'Proceed'}
                    handleAction={() => {
                      reset(defaultForm);
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
                      variant="contained"
                      color="error"
                      disabled={!isFormEdited}
                    >
                      Clear
                    </Button>
                  </Grid>
                  <Level1Box component="fieldset">
                    <legend>Product Details</legend>

                    <Stack
                      direction="row"
                      spacing={3}
                      // sx={{ marginLeft: '10px' }}
                      alignItems="center"
                    >
                      <Grid item xs={4}>
                        <InnerBox component="fieldset">
                          <legend>Brand Name</legend>
                          <TextField
                            {...register('productName.pt.term')}
                            fullWidth
                            variant="outlined"
                            margin="dense"
                            InputLabelProps={{ shrink: true }}
                          />
                        </InnerBox>
                      </Grid>

                      <Grid item xs={4}>
                        <InnerBox component="fieldset">
                          <legend>Container Type</legend>

                          <ProductAutocomplete
                            optionValues={containerTypes}
                            searchType={ConceptSearchType.containerTypes}
                            name={'containerType'}
                            control={control}
                            branch={branch}
                          />
                        </InnerBox>
                      </Grid>
                      <Grid item xs={3}>
                        <InnerBox component="fieldset">
                          <legend>ARTG ID</legend>
                          <ArtgAutoComplete
                            control={control}
                            name="externalIdentifiers"
                            optionValues={[]}
                          />
                        </InnerBox>
                      </Grid>
                    </Stack>
                  </Level1Box>

                  <div>
                    <ContainedProducts
                      showTPU={true}
                      partOfPackage={false}
                      units={units}
                      brandProducts={brandProducts}
                      control={control}
                      register={register}
                      productFields={productFields}
                      productAppend={productAppend}
                      productRemove={productRemove}
                      productType={ProductType.device}
                      containerTypes={containerTypes}
                      deviceDeviceTypes={deviceDeviceTypes}
                      branch={branch}
                    />
                  </div>

                  <Box m={1} p={1}>
                    <Stack spacing={2} direction="row" justifyContent="end">
                      <Button variant="contained" type="submit" color="info">
                        Save
                      </Button>
                      <Button variant="contained" type="submit" color="success">
                        Preview
                      </Button>
                      <Button variant="contained" type="submit" color="primary">
                        Commit
                      </Button>
                    </Stack>
                  </Box>
                </form>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }
}

export default DeviceAuthoring;
