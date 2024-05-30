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
  UseFormSetValue,
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
import { closeSnackbar } from 'notistack';
import { DraftSubmitPanel } from './DarftSubmitPanel.tsx';
import useCanEditTask from '../../../hooks/useCanEditTask.tsx';
import { ProductStatus } from '../../../types/TicketProduct.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';
import { getValueSetExpansionContainsPt } from '../../../utils/helpers/getValueSetExpansionContainsPt.ts';

export interface MedicationAuthoringProps {
  selectedProduct: Concept | ValueSetExpansionContains | null;
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
    previewMedicationProduct,
    previewErrorKeys,
    setPreviewErrorKeys,
    handlePreviewToggleModal,
  } = useAuthoringStore();

  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [runningWarningsCheck, setRunningWarningsCheck] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const { serviceStatus } = useServiceStatus();
  const { canEdit } = useCanEditTask();
  const [productStatus, setProductStatus] = useState<string | undefined>();

  const defaultForm: MedicationPackageDetails = {
    containedProducts: [],
    containedPackages: [],
    containerType: unitPack,
    productName: null,
  };

  const [productSaveDetails, setProductSaveDetails] =
    useState<MedicationPackageDetails>();
  const handleSaveToggleModal = () => {
    setSaveModalOpen(!saveModalOpen);
  };
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,

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
          selectedProduct
            ? isValueSetExpansionContains(selectedProduct)
              ? (selectedProduct.code as string)
              : (selectedProduct.conceptId as string)
            : '',
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
            `Unable to load product  [ ${isValueSetExpansionContains(selectedProduct) ? getValueSetExpansionContainsPt(selectedProduct) : selectedProduct.pt?.term}]`,
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
            setProductStatus(
              dto.conceptId && dto.conceptId !== null
                ? ProductStatus.Completed
                : ProductStatus.Partial,
            );
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
          previewMedicationProduct(
            data,
            ticket,
            branch,
            serviceStatus,
            ticketProductId,
          );
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
        message={`Loading Product details for ${isValueSetExpansionContains(selectedProduct) ? getValueSetExpansionContainsPt(selectedProduct) : selectedProduct?.pt?.term}`}
      />
    );
  } else if (loadingPreview) {
    return (
      <ProductLoader
        message={`Loading Product Preview for ${isValueSetExpansionContains(selectedProduct) ? getValueSetExpansionContainsPt(selectedProduct) : selectedProduct?.pt?.term}`}
      />
    );
  } else if (runningWarningsCheck) {
    return <ProductLoader message={`Running validation before Preview`} />;
  } else {
    return (
      <Box sx={{ width: '100%' }}>
        <Grid container data-testid={'product-creation-grid'}>
          <WarningModal
            open={warningModalOpen}
            content={warnings.join('\n')}
            handleClose={() => {
              setWarningModalOpen(false);
            }}
            // disabled={warningDisabled}
            action={'Proceed'}
            handleAction={() => {
              previewMedicationProduct(
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
            productStatus={productStatus}
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
                    setValue={setValue}
                  />

                  <Box m={1} p={1}>
                    <Stack spacing={2} direction="row" justifyContent="end">
                      <DraftSubmitPanel
                        control={control}
                        saveDraft={saveDraft}
                      />
                      <Button
                        data-testid={'preview-btn'}
                        variant="contained"
                        type="submit"
                        color="primary"
                        disabled={!canEdit || !isFormEdited}
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
  setValue: UseFormSetValue<any>;
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
  setValue,
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
          data-testid={'product-clear-btn'}
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
                dataTestId={'package-brand'}
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
                dataTestId={'package-container'}
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
                dataTestId={'package-artgid'}
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
            setValue={setValue}
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
            setValue={setValue}
          />
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
}
export default MedicationAuthoring;
