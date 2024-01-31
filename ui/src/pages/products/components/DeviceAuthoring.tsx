import React, { useEffect, useState } from 'react';
import { DevicePackageDetails, ProductType } from '../../../types/product.ts';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { Box, Button, Grid, Paper } from '@mui/material';

import { Stack } from '@mui/system';
import { Concept } from '../../../types/concept.ts';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';

import ContainedProducts from './ContainedProducts.tsx';
import ArtgAutoComplete from './ArtgAutoComplete.tsx';
import conceptService from '../../../api/ConceptService.ts';
import { InnerBox, Level1Box } from './style/ProductBoxes.tsx';
import Loading from '../../../components/Loading.tsx';
import { enqueueSnackbar } from 'notistack';
import ProductAutocompleteV2 from './ProductAutocompleteV2.tsx';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';

export interface DeviceAuthoringProps {
  selectedProduct: Concept | null;

  handleClearForm: () => void;
  isFormEdited: boolean;
  setIsFormEdited: (value: boolean) => void;
  branch: string;
  fieldBindings: FieldBindings;
  defaultUnit: Concept;
}

function DeviceAuthoring(productProps: DeviceAuthoringProps) {
  const {
    selectedProduct,

    handleClearForm,
    isFormEdited,
    setIsFormEdited,
    branch,
    fieldBindings,
    defaultUnit,
  } = productProps;

  const defaultForm: DevicePackageDetails = {
    containedProducts: [],
    // containedPackages: [],
  };

  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);

  const { register, control, handleSubmit, reset, getValues } =
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
            `Unable to load Device  [${selectedProduct?.pt?.term}] with the error:${err}`,
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
                          <ProductAutocompleteV2
                            name={'productName'}
                            control={control}
                            branch={branch}
                            ecl={generateEclFromBinding(
                              fieldBindings,
                              'package.device.productName',
                            )}
                          />
                        </InnerBox>
                      </Grid>

                      <Grid item xs={4}>
                        <InnerBox component="fieldset">
                          <legend>Container Type</legend>

                          <ProductAutocompleteV2
                            name={'containerType'}
                            control={control}
                            branch={branch}
                            ecl={generateEclFromBinding(
                              fieldBindings,
                              'package.device.containerType',
                            )}
                            showDefaultOptions={true}
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
                      control={control}
                      register={register}
                      productFields={productFields}
                      productAppend={productAppend}
                      productRemove={productRemove}
                      productType={ProductType.device}
                      branch={branch}
                      fieldBindings={fieldBindings}
                      getValues={getValues}
                      defaultUnit={defaultUnit}
                      productsArray={'containedProducts'}
                      expandedProducts={expandedProducts}
                      setExpandedProducts={setExpandedProducts}
                    />
                  </div>

                  <Box m={1} p={1}>
                    <Stack spacing={2} direction="row" justifyContent="end">
                      <Button variant="contained" type="submit" color="primary">
                        Preview
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
