import { useEffect, useState } from 'react';
import {
  MedicationPackageDetails,
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
import ProductPreview7BoxModal from './ProductPreview7BoxModal.tsx';
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
import {
  findWarningsForMedicationProduct,
  parseMedicationProductErrors,
} from '../../../types/productValidationUtils.ts';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import TicketProductService from '../../../api/TicketProductService.ts';
import ProductLoader from './ProductLoader.tsx';
import ProductPartialSaveModal from './ProductPartialSaveModal.tsx';
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
  ticketProductId?: string;
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
    ticketProductId,
  } = productprops;

  const {
    productCreationDetails,
    setProductPreviewDetails,
    previewModalOpen,
    setPreviewModalOpen,
    loadingPreview,
    warningModalOpen,
    setWarningModalOpen,
    previewProduct,
  } = useAuthoringStore();

  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isMultiPack, setIsMultiPack] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const { serviceStatus } = useServiceStatus();
  const defaultForm: MedicationPackageDetails = {
    containedProducts: [],
    containedPackages: [],
    containerType: unitPack,
    productName: null,
  };

  const [productSaveDetails, setProductSaveDetails] =
    useState<MedicationPackageDetails>();

  const handlePreviewToggleModal = () => {
    setPreviewModalOpen(!previewModalOpen);
  };
  const handleSaveToggleModal = () => {
    setSaveModalOpen(!saveModalOpen);
  };
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,

    formState: { errors, dirtyFields },
  } = useForm<MedicationPackageDetails>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    criteriaMode: 'all',
    resolver: yupResolver(medicationPackageDetailsObjectSchema),
    defaultValues: defaultForm,
  });

  useEffect(() => {
    if (selectedProduct && !ticketProductId) {
      setLoadingProduct(true);
      conceptService
        .fetchMedication(
          selectedProduct ? (selectedProduct.conceptId as string) : '',
          branch,
        )
        .then(mp => {
          if (mp.productName) {
            reset(mp);
            setLoadingProduct(false);
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
    } else if (ticketProductId) {
      setLoadingProduct(true);
      TicketProductService.getTicketProduct(ticket.id, ticketProductId)
        .then(dto => {
          if (dto.packageDetails) {
            reset(dto.packageDetails as MedicationPackageDetails);
            setLoadingProduct(false);
          }
        })
        .catch(err => {
          setLoadingProduct(false);
          snowstormErrorHandler(
            err,
            `Unable to load product  [${ticketProductId}]`,
            serviceStatus,
          );
        });
    }
  }, [reset, selectedProduct, ticketProductId]);

  const onSubmit = (data: MedicationPackageDetails) => {
    setProductPreviewDetails(undefined);
    setProductPreviewDetails(data);
    const warnings = findWarningsForMedicationProduct(data);
    if (warnings && warnings.length > 0 && !warningModalOpen) {
      setWarnings(warnings);
      setWarningModalOpen(true);
    } else {
      previewProduct(data, ticket, branch, serviceStatus, ticketProductId);
    }
  };
  const saveDraft = () => {
    const data = getValues();
    setProductSaveDetails(data);
    setSaveModalOpen(true);
  };
  const isFormDirty = () => {
    return Object.keys(dirtyFields).length > 0;
  };
  const onErrors = (errors: FieldErrors) => {
    if (errors) {
      const finalErrors = parseMedicationProductErrors(errors);
      if (finalErrors.length > 0) {
        showError(finalErrors);
      }
    }
  };

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
      <ProductLoader
        message={`Loading Product details for ${selectedProduct?.pt?.term}`}
      />
    );
  } else if (loadingPreview) {
    return (
      <ProductLoader
        message={`Loading Product Preview for ${selectedProduct?.pt?.term}`}
      />
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
              previewProduct(
                undefined,
                ticket,
                branch,
                serviceStatus,
                ticketProductId,
              );
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
          <ProductPartialSaveModal
            packageDetails={productSaveDetails}
            handleClose={handleSaveToggleModal}
            open={saveModalOpen}
            ticket={ticket}
            existingProductName={ticketProductId}
          />
          <Grid item sm={12} xs={12}>
            <Paper>
              <Box m={2} p={2}>
                <form
                  onSubmit={event =>
                    void handleSubmit(onSubmit, onErrors)(event)
                  }
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
                        color="info"
                        disabled={!isFormDirty()}
                        onClick={saveDraft}
                      >
                        Save Progress
                      </Button>
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
