import React, { useEffect, useState } from 'react';
import {
  MedicationPackageDetails,
  ProductCreationDetails,
  ProductType,
} from '../../../types/product.ts';
import {
  FieldError,
  FieldErrors,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { Box, Button, Grid, Paper } from '@mui/material';

import { Stack } from '@mui/system';
import { Concept } from '../../../types/concept.ts';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';

import ContainedPackages from './ContainedPackages.tsx';
import ContainedProducts from './ContainedProducts.tsx';
import ArtgAutoComplete from './ArtgAutoComplete.tsx';
import conceptService from '../../../api/ConceptService.ts';
import { InnerBox, Level1Box } from './style/ProductBoxes.tsx';
import Loading from '../../../components/Loading.tsx';
import ProductPreview7BoxModal from './ProductPreview7BoxModal.tsx';
import {
  cleanPackageDetails,
  UnitPackId,
} from '../../../utils/helpers/conceptUtils.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import {
  showError,
  snowstormErrorHandler,
} from '../../../types/ErrorHandler.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import ProductAutocompleteV2 from './ProductAutocompleteV2.tsx';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';

import { yupResolver } from '@hookform/resolvers/yup';
import { medicationPackageDetailsObjectSchema } from '../../../types/productValidations.ts';

import WarningModal from '../../../themes/overrides/WarningModal.tsx';
import { parseMedicationProductErrors } from '../../../types/productValidationUtils.ts';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
export interface MedicationAuthoringProps {
  selectedProduct: Concept | null;
  handleClearForm: () => void;
  isFormEdited: boolean;
  setIsFormEdited: (value: boolean) => void;
  branch: string;
  ticket: Ticket;
  fieldBindings: FieldBindings;
  defaultUnit: Concept;
  unitPack: Concept;
}

function MedicationAuthoring(productprops: MedicationAuthoringProps) {
  const {
    selectedProduct,

    handleClearForm,
    isFormEdited,
    setIsFormEdited,
    branch,
    ticket,
    fieldBindings,
    defaultUnit,
    unitPack,
  } = productprops;

  const defaultForm: MedicationPackageDetails = {
    containedProducts: [],
    containedPackages: [],
    containerType: unitPack,
    productName: null,
    selectedConceptIdentifiers: [],
  };

  const {
    productCreationDetails,
    setProductCreationDetails,
    productPreviewDetails,
    setProductPreviewDetails,
    previewModalOpen,
    setPreviewModalOpen,
    loadingPreview,
    setLoadingPreview,
    warningModalOpen,
    setWarningModalOpen,
    previewProduct,
  } = useAuthoringStore();
  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const [warnings, setWarnings] = useState<string[]>([]);

  const [isMultiPack, setIsMultiPack] = useState(false);

  const handlePreviewToggleModal = () => {
    setPreviewModalOpen(!previewModalOpen);
  };
  const { serviceStatus } = useServiceStatus();

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<MedicationPackageDetails>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    criteriaMode: 'all',
    resolver: yupResolver(medicationPackageDetailsObjectSchema),
    defaultValues: defaultForm,
  });

  const getAllWarnings = (
    medicationPackageDetails: MedicationPackageDetails,
  ) => {
    const warnings = medicationPackageDetails?.containedProducts.reduce(
      function (ids: string[], product, index) {
        if (
          product.productDetails?.containerType &&
          medicationPackageDetails.containerType?.conceptId !== UnitPackId
        ) {
          ids.push(
            `containedProducts[${index}] has container type, package.containerType should be 'Pack'`,
          );
        }
        return ids;
      },
      [],
    );
    return warnings;
  };

  const onSubmit = (data: MedicationPackageDetails) => {
    setProductPreviewDetails(undefined);
    setProductPreviewDetails(data);
    const warnings = getAllWarnings(data);
    if (warnings && warnings.length > 0 && !warningModalOpen) {
      setWarnings(warnings);
      setWarningModalOpen(true);
    } else {
      previewProduct(data, ticket, branch, serviceStatus);
    }
  };

  const onErrors = (errors: FieldErrors) => {
    if (errors) {
      const finalErrors = parseMedicationProductErrors(errors);
      if (finalErrors.length > 0) {
        showError(finalErrors);
      }
    }
  };

  // const previewProduct = function (data?: MedicationPackageDetails) {
  //   setWarningModalOpen(false);
  //   const request = data ? data : productPreviewDetails;

  //   if (request) {
  //     setProductCreationDetails(undefined);
  //     setPreviewModalOpen(true);
  //     const validatedData = cleanPackageDetails(request);
  //     conceptService
  //       .previewNewMedicationProduct(validatedData, branch)
  //       .then(mp => {
  //         const productCreationObj: ProductCreationDetails = {
  //           productSummary: mp,
  //           packageDetails: validatedData,
  //           ticketId: ticket.id,
  //         };
  //         setProductCreationDetails(productCreationObj);
  //         setPreviewModalOpen(true);
  //         setLoadingPreview(false);
  //       })
  //       .catch(err => {
  //         snowstormErrorHandler(
  //           err,
  //           `Failed preview for  [${request.productName?.pt?.term}]`,
  //           serviceStatus,
  //         );
  //         setLoadingPreview(false);
  //         setPreviewModalOpen(false);
  //       });
  //   }
  // };

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
            // storeIngredientsExpanded([]);
          }
        })
        .catch(err => {
          setLoadingProduct(false);
          snowstormErrorHandler(
            err,
            `Unable to load product  [${selectedProduct.pt?.term}]`,
            serviceStatus,
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

  useEffect(() => {
    if (packageFields.length > 0) {
      if (!isMultiPack) {
        setIsMultiPack(true);
        // setValue('containerType', unitPack);
      }
    } else {
      setIsMultiPack(false);
    }
    if (packageFields.length > 0 || productFields.length > 0) {
      setIsFormEdited(true);
    } else {
      setIsFormEdited(false);
    }
  }, [packageFields, productFields]);

  const [activePackageTabIndex, setActivePackageTabIndex] = useState(0);
  if (isLoadingProduct) {
    return (
      <div style={{ marginTop: '200px' }}>
        <Loading
          message={`Loading Product details for ${selectedProduct?.conceptId}`}
        />
      </div>
    );
  } else if (loadingPreview) {
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
          <WarningModal
            open={warningModalOpen}
            content={warnings.toString()}
            handleClose={() => {
              setWarningModalOpen(false);
            }}
            // disabled={warningDisabled}
            action={'Proceed'}
            handleAction={() => {
              previewProduct(undefined, ticket, branch, serviceStatus);
            }}
          />

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
                  onSubmit={event =>
                    void handleSubmit(onSubmit, onErrors)(event)
                  }
                  // onChange={() => {
                  //
                  //
                  // }}
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
                          <ProductAutocompleteV2
                            name={`productName`}
                            control={control}
                            branch={branch}
                            ecl={generateEclFromBinding(
                              fieldBindings,
                              'package.productName',
                            )}
                            error={errors?.productName as FieldError}
                          />
                        </InnerBox>
                      </Grid>

                      <Grid item xs={4}>
                        <InnerBox component="fieldset">
                          <legend>Container Type</legend>

                          <ProductAutocompleteV2
                            ecl={generateEclFromBinding(
                              fieldBindings,
                              isMultiPack
                                ? 'package.containerType.pack'
                                : 'package.containerType',
                            )}
                            name={'containerType'}
                            control={control}
                            branch={branch}
                            showDefaultOptions={true}
                            error={errors?.containerType as FieldError}
                            readOnly={isMultiPack}
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
                            error={errors.externalIdentifiers as FieldError}
                          />
                        </InnerBox>
                      </Grid>
                    </Stack>
                  </Level1Box>

                  {packageFields.length > 0 ||
                  (packageFields.length === 0 && productFields.length === 0) ? (
                    <div>
                      <ContainedPackages
                        control={control}
                        register={register}
                        packageFields={packageFields}
                        packageAppend={packageAppend}
                        packageRemove={packageRemove}
                        activePackageTabIndex={activePackageTabIndex}
                        setActivePackageTabIndex={setActivePackageTabIndex}
                        productType={ProductType.medication}
                        branch={branch}
                        fieldBindings={fieldBindings}
                        getValues={getValues}
                        defaultUnit={defaultUnit}
                        errors={errors}
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
                        control={control}
                        register={register}
                        productFields={productFields}
                        productAppend={productAppend}
                        productRemove={productRemove}
                        productType={ProductType.medication}
                        branch={branch}
                        fieldBindings={fieldBindings}
                        getValues={getValues}
                        defaultUnit={defaultUnit}
                        errors={errors}
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
                        // disabled={!isDirty}
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
