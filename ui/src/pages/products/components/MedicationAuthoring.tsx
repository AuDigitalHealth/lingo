import { useEffect, useState } from 'react';
import {
  MedicationPackageDetails,
  ProductType,
} from '../../../types/product.ts';
import {
  Control,
  FieldError,
  FieldErrors,
  useFieldArray,
  useForm,
  UseFormGetValues,
  UseFormRegister,
  UseFormReset,
  useFormState,
} from 'react-hook-form';
import { Box, Button, Grid, Paper } from '@mui/material';

import { Stack } from '@mui/system';
import { Concept } from '../../../types/concept.ts';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';

import ContainedPackages from './ContainedPackages.tsx';
import ContainedProducts from './ContainedProducts.tsx';
import ArtgAutoComplete from './ArtgAutoComplete.tsx';
import conceptService from '../../../api/ConceptService.ts';
import {
  FieldLabel,
  FieldLabelRequired,
  InnerBox,
  Level1Box,
} from './style/ProductBoxes.tsx';
import ProductPreview7BoxModal from './ProductPreview7BoxModal.tsx';
import { Ticket } from '../../../types/tickets/ticket.ts';
import {
  showErrors,
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
import { useBlocker } from 'react-router-dom';
import { closeSnackbar } from 'notistack';

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
    previewErrorKeys,
    setPreviewErrorKeys,
  } = useAuthoringStore();

  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [runningWarningsCheck, setRunningWarningsCheck] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
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

  const handlePreviewToggleModal = (
    event: object,
    reason: 'backdropClick' | 'escapeKeyDown',
  ) => {
    if (reason && reason === 'backdropClick') return;
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

    formState: { errors },
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
    if (previewErrorKeys && previewErrorKeys.length > 0) {
      previewErrorKeys.forEach(errorKey => {
        closeSnackbar(errorKey);
      });
      setPreviewErrorKeys([]); //clear errors
    }

    setProductPreviewDetails(undefined);
    setProductPreviewDetails(data);
    setRunningWarningsCheck(true);
    void findWarningsForMedicationProduct(data, branch, fieldBindings)
      .then(warnings => {
        if (warnings && warnings.length > 0 && !warningModalOpen) {
          setWarnings(warnings);
          setPreviewModalOpen(false);
          setWarningModalOpen(true);
        } else {
          previewProduct(data, ticket, branch, serviceStatus, ticketProductId);
        }
      })
      .finally(() => setRunningWarningsCheck(false));
  };
  const saveDraft = () => {
    const data = getValues();
    setProductSaveDetails(data);
    setSaveModalOpen(true);
  };
  const onErrors = (errors: FieldErrors) => {
    if (errors) {
      const finalErrors = parseMedicationProductErrors(errors);
      if (finalErrors.length > 0) {
        const errorKey = showErrors(finalErrors);
        const errorKeys = previewErrorKeys;
        errorKeys.push(errorKey as string);
        setPreviewErrorKeys(errorKeys);
      }
    }
  };

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
  } else if (runningWarningsCheck) {
    return <ProductLoader message={`Running validation before Preview`} />;
  } else {
    return (
      <Box sx={{ width: '100%' }}>
        <Grid container>
          <WarningModal
            open={warningModalOpen}
            content={warnings.join('\n')}
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
                  <MedicationBody
                    control={control}
                    register={register}
                    setIsFormEdited={setIsFormEdited}
                    fieldBindings={fieldBindings}
                    getValues={getValues}
                    defaultUnit={defaultUnit}
                    errors={errors}
                    branch={branch}
                    reset={reset}
                    isFormEdited={isFormEdited}
                    handleClearForm={handleClearForm}
                    defaultForm={defaultForm}
                  />

                  <Box m={1} p={1}>
                    <Stack spacing={2} direction="row" justifyContent="end">
                      <DraftSubmitPanel
                        control={control}
                        saveDraft={saveDraft}
                      />
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
export interface DraftSubmitPanelProps {
  control: Control<MedicationPackageDetails>;
  saveDraft: () => void;
}
function DraftSubmitPanel({ control, saveDraft }: DraftSubmitPanelProps) {
  const { dirtyFields } = useFormState({ control });
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const isDirty = Object.keys(dirtyFields).length > 0;
  const { forceNavigation } = useAuthoringStore();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !forceNavigation &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    setConfirmationModalOpen(blocker.state === 'blocked');
  }, [blocker]);

  const handleProceed = () => {
    if (blocker.proceed === undefined) return;
    blocker.proceed();
  };

  const handleReset = () => {
    if (blocker.reset === undefined) return;
    blocker.reset();
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty && !forceNavigation) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, forceNavigation]);

  return (
    <>
      <Button
        variant="contained"
        color="info"
        disabled={!isDirty}
        onClick={saveDraft}
      >
        Save Progress
      </Button>
      {blocker.proceed !== undefined && blocker.reset !== undefined && (
        <ConfirmationModal
          content={''}
          disabled={false}
          open={confirmationModalOpen}
          title={'Unsaved changes will be lost'}
          action="Proceed"
          handleAction={handleProceed}
          handleClose={handleReset}
          reverseAction="Back"
        />
      )}
    </>
  );
}

interface MedicationBody {
  control: Control<MedicationPackageDetails>;
  register: UseFormRegister<MedicationPackageDetails>;
  setIsFormEdited: (value: boolean) => void;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<MedicationPackageDetails>;
  defaultUnit: Concept;
  errors: FieldErrors<MedicationPackageDetails>;
  branch: string;
  reset: UseFormReset<MedicationPackageDetails>;
  isFormEdited: boolean;
  handleClearForm: () => void;
  defaultForm: MedicationPackageDetails;
}
export function MedicationBody({
  control,
  setIsFormEdited,
  branch,
  fieldBindings,
  errors,
  isFormEdited,
  handleClearForm,
  reset,
  register,
  getValues,
  defaultUnit,
  defaultForm,
}: MedicationBody) {
  const [isMultiPack, setIsMultiPack] = useState(false);
  const [activePackageTabIndex, setActivePackageTabIndex] = useState(0);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);
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

  return (
    <>
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
              <FieldLabelRequired>Brand Name</FieldLabelRequired>
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
              <FieldLabelRequired>Container Type</FieldLabelRequired>

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
              <FieldLabel>ARTG ID</FieldLabel>
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
            expandedProducts={expandedProducts}
            setExpandedProducts={setExpandedProducts}
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
            productsArray={'containedProducts'}
            expandedProducts={expandedProducts}
            setExpandedProducts={setExpandedProducts}
          />
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
}
export default MedicationAuthoring;
