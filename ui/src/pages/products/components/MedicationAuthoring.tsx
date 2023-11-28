import React, { useEffect, useState } from 'react';
import {
  Ingredient,
  MedicationPackageDetails,
  MedicationProductQuantity,
  ProductCreationDetails,
  ProductType,
} from '../../../types/product.ts';
import { useFieldArray, useForm } from 'react-hook-form';
import { Box, Button, Grid, Paper, TextField } from '@mui/material';

import { Stack } from '@mui/system';
import { Concept } from '../../../types/concept.ts';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import ContainedPackages from './ContainedPackages.tsx';
import ContainedProducts from './ContainedProducts.tsx';
import ArtgAutoComplete from './ArtgAutoComplete.tsx';
import conceptService from '../../../api/ConceptService.ts';
import { InnerBox, Level1Box } from './style/ProductBoxes.tsx';
import Loading from '../../../components/Loading.tsx';
import ProductPreview7BoxModal from './ProductPreview7BoxModal.tsx';
import {
  isEmptyObjectByValue,
  storeIngredientsExpanded,
} from '../../../utils/helpers/conceptUtils.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import { errorHandler } from '../../../types/ErrorHandler.ts';

export interface MedicationAuthoringProps {
  selectedProduct: Concept | null;
  units: Concept[];
  containerTypes: Concept[];
  doseForms: Concept[];
  ingredients: Concept[];
  medicationDeviceTypes: Concept[];
  brandProducts: Concept[];
  handleClearForm: () => void;
  isFormEdited: boolean;
  setIsFormEdited: (value: boolean) => void;
  branch: string;
  ticket: Ticket;
}

function MedicationAuthoring(productprops: MedicationAuthoringProps) {
  const {
    selectedProduct,
    units,
    containerTypes,
    doseForms,
    medicationDeviceTypes,
    ingredients,
    brandProducts,
    handleClearForm,
    isFormEdited,
    setIsFormEdited,
    branch,
    ticket,
  } = productprops;

  const defaultForm: MedicationPackageDetails = {
    containedProducts: [],
    containedPackages: [],
  };

  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [productCreationDetails, setProductCreationDetails] =
    useState<ProductCreationDetails>();
  const [isLoadingPreview, setLoadingPreview] = useState(false);
  const handlePreviewToggleModal = () => {
    setPreviewModalOpen(!previewModalOpen);
  };

  const { register, control, handleSubmit, reset } =
    useForm<MedicationPackageDetails>({
      defaultValues: {
        containedPackages: [],
        containedProducts: [],
      },
    });

  function cleanIngredient(item: Ingredient) {
    if (isEmptyObjectByValue(item.concentrationStrength)) {
      item['concentrationStrength'] = null;
    }
  }
  function cleanProductQty(item: MedicationProductQuantity) {
    if (
      item.productDetails &&
      isEmptyObjectByValue(item.productDetails?.quantity)
    ) {
      item.productDetails['quantity'] = null;
    }
    item.productDetails?.activeIngredients.map(i => cleanIngredient(i));
  }
  function removeEmptyFromObject(packageDetails: MedicationPackageDetails) {
    packageDetails.containedPackages.forEach(function (packageQty) {
      packageQty.packageDetails.containedProducts.map(p => cleanProductQty(p));
    });
    packageDetails.containedProducts.map(p => cleanProductQty(p));
    return packageDetails;
  }
  const onSubmit = (data: MedicationPackageDetails) => {
    // setLoadingPreview(true);
    setProductCreationDetails(undefined);
    setPreviewModalOpen(true);
    const validatedData = removeEmptyFromObject(data);
    conceptService
      .previewNewMedicationProduct(validatedData, branch)
      .then(mp => {
        const productCreationObj: ProductCreationDetails = {
          productSummary: mp,
          packageDetails: validatedData,
          ticketId: ticket.id,
        };
        setProductCreationDetails(productCreationObj);
        setPreviewModalOpen(true);
        setLoadingPreview(false);
      })
      .catch(err => {
        errorHandler(err, `Failed preview for  [${data.productName?.pt.term}]`);
        setLoadingPreview(false);
        setPreviewModalOpen(false);
      });
  };

  useEffect(() => {
    if (selectedProduct) {
      setLoadingProduct(true);
      conceptService
        .fetchMedication(
          selectedProduct ? (selectedProduct.conceptId as string) : '',
          branch,
        )
        .then(mp => {
          if (mp.productName) {
            reset(mp);
            // setIsFormEdited(false);
            setLoadingProduct(false);
            storeIngredientsExpanded([]);
          }
        })
        .catch(err => {
          setLoadingProduct(false);
          errorHandler(
            err,
            `Unable to load product  [${selectedProduct?.pt.term}]`,
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

  const {
    fields: packageFields,
    append: packageAppend,
    remove: packageRemove,
  } = useFieldArray({
    control,
    name: 'containedPackages',
  });
  const [activePackageTabIndex, setActivePackageTabIndex] = useState(0);

  if (isLoadingProduct) {
    return (
      <div style={{ marginTop: '200px' }}>
        <Loading
          message={`Loading Product details for ${selectedProduct?.conceptId}`}
        />
      </div>
    );
  } else if (isLoadingPreview) {
    return (
      <div style={{ marginTop: '200px' }}>
        <Loading
          message={`Loading Product Preview for ${selectedProduct?.conceptId}`}
        />
      </div>
    );
  } else {
    return (
      <Box sx={{ width: '100%' }}>
        <Grid container>
          <ProductPreview7BoxModal
            productType={ProductType.medication}
            productCreationDetails={productCreationDetails}
            handleClose={handlePreviewToggleModal}
            open={previewModalOpen}
            branch={branch}
            ticket={ticket}
          />
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
                    content={`This will remove all details that have been entered into this form`}
                    handleClose={() => {
                      setResetModalOpen(false);
                    }}
                    title={'Confirm Clear'}
                    disabled={!isFormEdited}
                    action={'Proceed with clear'}
                    handleAction={() => {
                      setActivePackageTabIndex(0);
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

                  {packageFields.length > 0 ||
                  (packageFields.length === 0 && productFields.length === 0) ? (
                    <div>
                      <ContainedPackages
                        units={units}
                        doseForms={doseForms}
                        brandProducts={brandProducts}
                        ingredients={ingredients}
                        containerTypes={containerTypes}
                        medicationDeviceTypes={medicationDeviceTypes}
                        control={control}
                        register={register}
                        packageFields={packageFields}
                        packageAppend={packageAppend}
                        packageRemove={packageRemove}
                        activePackageTabIndex={activePackageTabIndex}
                        setActivePackageTabIndex={setActivePackageTabIndex}
                        productType={ProductType.medication}
                        branch={branch}
                      />
                    </div>
                  ) : (
                    <div></div>
                  )}
                  {productFields.length > 0 ||
                  (packageFields.length === 0 && productFields.length === 0) ? (
                    <div>
                      <ContainedProducts
                        showTPU={true}
                        partOfPackage={false}
                        units={units}
                        doseForms={doseForms}
                        brandProducts={brandProducts}
                        ingredients={ingredients}
                        containerTypes={containerTypes}
                        medicationDeviceTypes={medicationDeviceTypes}
                        control={control}
                        register={register}
                        productFields={productFields}
                        productAppend={productAppend}
                        productRemove={productRemove}
                        productType={ProductType.medication}
                        branch={branch}
                      />
                    </div>
                  ) : (
                    <div></div>
                  )}

                  <Box m={1} p={1}>
                    <Stack spacing={2} direction="row" justifyContent="end">
                      <Button
                        variant="contained"
                        type="submit"
                        color="primary"
                        disabled={!isFormEdited}
                      >
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

export default MedicationAuthoring;
