import React, { useEffect, useState } from 'react';
import { DevicePackageDetails, ProductType } from '../../../types/product.ts';
import {
  Control,
  FieldError,
  FieldErrors,
  SubmitHandler,
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

import ContainedProducts from './ContainedProducts.tsx';
import ArtgAutoComplete from './ArtgAutoComplete.tsx';
import conceptService from '../../../api/ConceptService.ts';
import {
  FieldLabel,
  FieldLabelRequired,
  InnerBox,
  Level1Box,
} from './style/ProductBoxes.tsx';
import Loading from '../../../components/Loading.tsx';
import { closeSnackbar, enqueueSnackbar } from 'notistack';
import ProductAutocompleteV2 from './ProductAutocompleteV2.tsx';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import { yupResolver } from '@hookform/resolvers/yup';
import { devicePackageDetailsObjectSchema } from '../../../types/productValidations.ts';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import ProductPreview7BoxModal from './ProductPreview7BoxModal.tsx';
import { parseDeviceErrors } from '../../../types/productValidationUtils.ts';
import {
  showErrors,
  snowstormErrorHandler,
} from '../../../types/ErrorHandler.ts';
import { DraftSubmitPanel } from './DarftSubmitPanel.tsx';
import ProductPartialSaveModal from './ProductPartialSaveModal.tsx';
import TicketProductService from '../../../api/TicketProductService.ts';

export interface DeviceAuthoringProps {
  selectedProduct: Concept | null;

  handleClearForm: () => void;
  isFormEdited: boolean;
  setIsFormEdited: (value: boolean) => void;
  branch: string;
  fieldBindings: FieldBindings;
  defaultUnit: Concept;
  ticket: Ticket;
  ticketProductId?: string;
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
    ticket,
    ticketProductId,
  } = productProps;

  const defaultForm: DevicePackageDetails = {
    productName: null,
    containedProducts: [],
    // containedPackages: [],
  };
  const {
    productCreationDetails,
    previewModalOpen,
    setDevicePreviewDetails,
    previewDeviceProduct,
    previewErrorKeys,
    setPreviewErrorKeys,
    handlePreviewToggleModal,
  } = useAuthoringStore();

  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<DevicePackageDetails>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    criteriaMode: 'all',
    defaultValues: defaultForm,
    resolver: yupResolver(devicePackageDetailsObjectSchema),
  });
  const [productSaveDetails, setProductSaveDetails] =
    useState<DevicePackageDetails>();
  const handleSaveToggleModal = () => {
    setSaveModalOpen(!saveModalOpen);
  };
  const { serviceStatus } = useServiceStatus();
  const onSubmit: SubmitHandler<DevicePackageDetails> = data => {
    if (previewErrorKeys && previewErrorKeys.length > 0) {
      previewErrorKeys.forEach(errorKey => {
        closeSnackbar(errorKey);
      });
      setPreviewErrorKeys([]); //clear errors
    }

    setDevicePreviewDetails(undefined);
    setDevicePreviewDetails(data);
    previewDeviceProduct(data, ticket, branch, serviceStatus, ticketProductId);
  };
  const saveDraft = () => {
    const data = getValues();
    setProductSaveDetails(data);
    setSaveModalOpen(true);
  };

  const onErrors = (errors: FieldErrors) => {
    if (errors) {
      const finalErrors = parseDeviceErrors(errors);
      if (finalErrors.length > 0) {
        const errorKey = showErrors(finalErrors);
        const errorKeys = previewErrorKeys;
        errorKeys.push(errorKey as string);
        setPreviewErrorKeys(errorKeys);
      }
    }
  };

  useEffect(() => {
    if (selectedProduct && !ticketProductId) {
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
    } else if (ticketProductId) {
      setLoadingProduct(true);
      TicketProductService.getTicketProduct(ticket.id, ticketProductId)
        .then(dto => {
          if (dto.packageDetails) {
            reset(dto.packageDetails as DevicePackageDetails);
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
          <ProductPreview7BoxModal
            productType={ProductType.device}
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
                  <DeviceBody
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
interface DeviceBodyProps {
  control: Control<DevicePackageDetails>;
  register: UseFormRegister<DevicePackageDetails>;
  setIsFormEdited: (value: boolean) => void;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<DevicePackageDetails>;
  defaultUnit: Concept;
  errors: FieldErrors<DevicePackageDetails>;
  branch: string;
  reset: UseFormReset<DevicePackageDetails>;
  isFormEdited: boolean;
  handleClearForm: () => void;
  defaultForm: DevicePackageDetails;
  setValue: UseFormSetValue<any>;
}
function DeviceBody({
  control,
  isFormEdited,
  reset,
  handleClearForm,
  branch,
  defaultForm,
  defaultUnit,
  fieldBindings,
  errors,
  register,
  getValues,
  setValue,
  setIsFormEdited,
}: DeviceBodyProps) {
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
  useEffect(() => {
    if (productFields.length > 0) {
      setIsFormEdited(true);
    } else {
      setIsFormEdited(false);
    }
  }, [productFields]);

  return (
    <>
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
              <FieldLabelRequired>Brand Name</FieldLabelRequired>
              <ProductAutocompleteV2
                name={'productName'}
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
                name={'containerType'}
                control={control}
                branch={branch}
                ecl={generateEclFromBinding(
                  fieldBindings,
                  'package.containerType',
                )}
                error={errors?.containerType as FieldError}
                showDefaultOptions={true}
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
          errors={errors}
          setValue={setValue}
        />
      </div>
    </>
  );
}

export default DeviceAuthoring;
