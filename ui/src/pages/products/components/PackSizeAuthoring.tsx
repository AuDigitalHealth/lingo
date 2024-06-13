import React, { useState } from 'react';
import {
  ActionType,
  BigDecimal,
  BrandPackSizeCreationDetails,
  ProductBrands,
  ProductPackSizes,
  ProductType,
} from '../../../types/product.ts';
import {
  Control,
  FieldErrors,
  useForm,
  UseFormGetValues,
  UseFormRegister,
  UseFormReset,
  UseFormSetValue,
} from 'react-hook-form';
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  Paper,
  TextField,
  Tooltip,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import MedicationIcon from '@mui/icons-material/Medication';

import { Stack } from '@mui/system';
import { Concept } from '../../../types/concept.ts';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';

import ProductPreview7BoxModal from './ProductPreview7BoxModal.tsx';
import { Ticket } from '../../../types/tickets/ticket.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';

import { yupResolver } from '@hookform/resolvers/yup';
import { brandPackSizeCreationDetailsObjectSchema } from '../../../types/productValidations.ts';

import WarningModal from '../../../themes/overrides/WarningModal.tsx';
import { findWarningsForBrandPackSizes } from '../../../types/productValidationUtils.ts';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import ProductLoader from './ProductLoader.tsx';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
import { closeSnackbar } from 'notistack';
import useCanEditTask from '../../../hooks/useCanEditTask.tsx';
import { AddCircle } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService.ts';
import LockIcon from '@mui/icons-material/Lock';
import useConceptStore from '../../../stores/ConceptStore.ts';
import { deepClone } from '@mui/x-data-grid/utils/utils';
import { concat } from '../../../utils/helpers/conceptUtils.ts';

export interface PackSizeAuthoringProps {
  selectedProduct: Concept | null;
  handleClearForm: () => void;
  isFormEdited: boolean;
  setIsFormEdited: (value: boolean) => void;
  branch: string;
  ticket: Ticket;
  fieldBindings: FieldBindings;
  packSizes: ProductPackSizes;
  ticketProductId?: string;
  actionType: ActionType;
}

function PackSizeAuthoring(productprops: PackSizeAuthoringProps) {
  const {
    selectedProduct,

    handleClearForm,
    isFormEdited,
    setIsFormEdited,
    branch,
    ticket,
    fieldBindings,
    packSizes,
    ticketProductId,
    actionType,
  } = productprops;

  const {
    productCreationDetails,
    previewModalOpen,
    setPreviewModalOpen,
    loadingPreview,
    warningModalOpen,
    setWarningModalOpen,
    previewBrandPackSize,
    previewErrorKeys,
    setPreviewErrorKeys,
    handlePreviewToggleModal,
    setBrandPackSizePreviewDetails,
  } = useAuthoringStore();

  const defaultConcept: Concept = {};
  const [autoFocusInput, setAutoFocusInput] = useState(false);
  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [runningWarningsCheck, setRunningWarningsCheck] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const { serviceStatus } = useServiceStatus();
  const [, setProductStatus] = useState<string | undefined>();
  const [newPackSizes, setNewPackSizes] = useState([] as string[]);
  const [unitOfMeasure, setUoM] = useState(defaultConcept);
  const { canEdit } = useCanEditTask();
  const setUnitOfMeasure = (uom: Concept) => {
    return setUoM(uom);
  };

  const defaultForm: BrandPackSizeCreationDetails = {
    productId: '',
    brands: undefined,
    packSizes: packSizes,
  };
  const {
    register,
    control,
    reset,
    getValues,
    setValue,

    formState: { errors },
  } = useForm<BrandPackSizeCreationDetails>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    criteriaMode: 'all',
    resolver: yupResolver(brandPackSizeCreationDetailsObjectSchema),
    defaultValues: defaultForm,
  });

  const onSubmit = (data: BrandPackSizeCreationDetails) => {
    if (previewErrorKeys && previewErrorKeys.length > 0) {
      previewErrorKeys.forEach(errorKey => {
        closeSnackbar(errorKey);
      });
      setPreviewErrorKeys([]); //clear errors
    }

    setBrandPackSizePreviewDetails(undefined);
    setBrandPackSizePreviewDetails(data);
    setRunningWarningsCheck(true);
    void findWarningsForBrandPackSizes(data, branch, fieldBindings)
      .then(warnings => {
        if (warnings && warnings.length > 0 && !warningModalOpen) {
          setWarnings(warnings);
          setPreviewModalOpen(false);
          setWarningModalOpen(true);
        } else {
          previewBrandPackSize(
            data,
            ticket,
            branch,
            serviceStatus,
            ticketProductId,
          );
          setPreviewModalOpen(true);
        }
      })
      .finally(() => setRunningWarningsCheck(false));
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
  } else if (!selectedProduct) {
    return (
      <Alert severity="info">
        <AlertTitle>Info</AlertTitle>
        Search and select a product to create a new pack size.
      </Alert>
    );
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
              previewBrandPackSize(
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
          <Grid item sm={12} xs={12}>
            <Paper>
              <Box m={2} p={2}>
                <form
                  onSubmit={event => {
                    if (isFormEdited) {
                      const data = getValues();
                      onSubmit(data);
                    }
                  }}
                >
                  {actionType === ActionType.newPackSize ? (
                    <PackSizeBody
                      selectedProduct={selectedProduct}
                      control={control}
                      register={register}
                      setIsFormEdited={setIsFormEdited}
                      fieldBindings={fieldBindings}
                      getValues={getValues}
                      errors={errors}
                      branch={branch}
                      reset={reset}
                      isFormEdited={isFormEdited}
                      handleClearForm={handleClearForm}
                      defaultForm={defaultForm}
                      setValue={setValue}
                      actionType={actionType}
                      autoFocusInput={autoFocusInput}
                      setAutoFocusInput={setAutoFocusInput}
                      newPackSizes={newPackSizes}
                      setNewPackSizes={setNewPackSizes}
                      unitOfMeasure={unitOfMeasure}
                      setUnitOfMeasure={setUnitOfMeasure}
                      canEdit={canEdit}
                      isProductLoading={isLoadingProduct}
                      setIsProductLoading={setLoadingProduct}
                    />
                  ) : (
                    <div></div>
                  )}
                  <Box m={1} p={1}>
                    <Stack
                      spacing={2}
                      direction="row"
                      justifyContent="end"
                    ></Stack>
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

interface PackSizeBody {
  selectedProduct: Concept | null;
  control: Control<BrandPackSizeCreationDetails>;
  register: UseFormRegister<BrandPackSizeCreationDetails>;
  setIsFormEdited: (value: boolean) => void;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<BrandPackSizeCreationDetails>;
  errors: FieldErrors<BrandPackSizeCreationDetails>;
  branch: string;
  reset: UseFormReset<BrandPackSizeCreationDetails>;
  isFormEdited: boolean;
  handleClearForm: () => void;
  defaultForm: BrandPackSizeCreationDetails;
  setValue: UseFormSetValue<any>;
  actionType: ActionType;
  autoFocusInput: boolean;
  setAutoFocusInput: (value: boolean) => void;
  newPackSizes: string[];
  setNewPackSizes: (value: string[]) => void;
  unitOfMeasure: Concept;
  setUnitOfMeasure: (uom: Concept) => void;
  canEdit: boolean;
  isProductLoading: boolean;
  setIsProductLoading: (value: boolean) => void;
}
export function PackSizeBody({
  selectedProduct,
  setIsFormEdited,
  branch,
  isFormEdited,
  handleClearForm,
  reset,
  getValues,
  defaultForm,
  setValue,
  autoFocusInput,
  setAutoFocusInput,
  newPackSizes,
  setNewPackSizes,
  unitOfMeasure,
  setUnitOfMeasure,
  setIsProductLoading,
}: PackSizeBody) {
  const [, setActivePackageTabIndex] = useState(0);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [, setProductSaveDetails] = useState<BrandPackSizeCreationDetails>();

  const { defaultProductPackSizes, defaultProductBrands } = useConceptStore();

  const { data } = useQuery(
    [`bulk-author-pack-sizes-${selectedProduct?.conceptId}`],
    () => {
      setIsProductLoading(true);
      setIsFormEdited(false);
      setNewPackSizes([]);
      const resp = ConceptService.getMedicationProductPackSizes(
        selectedProduct?.conceptId as string,
        branch,
      );
      return Promise.resolve(
        resp.then(pps => {
          if (pps.unitOfMeasure) {
            setUnitOfMeasure(pps.unitOfMeasure);
          }
          setIsProductLoading(false);
          setIsFormEdited(false);
          return pps;
        }),
      );
    },
    {
      staleTime: 20 * (60 * 1000),
      enabled: selectedProduct?.conceptId && branch ? true : false,
    },
  );

  const [packSizeInput, setPackSizeInput] = useState('');

  function isNumber(value: string) {
    if (value && value.trim() !== '') {
      return !isNaN(Number(value)) && Number(value) > 0;
    }
  }

  function isAddable() {
    return (
      packSizeInput &&
      packSizeInput.trim() !== '' &&
      data &&
      newPackSizes &&
      isNumber(concat('', packSizeInput.trim())) &&
      (!data.packSizes ||
        !data.packSizes
          .map(size => concat('', size))
          .includes(packSizeInput)) &&
      (!newPackSizes ||
        !newPackSizes.map(size => concat('', size)).includes(packSizeInput))
    );
  }

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

      <Grid container>
        <Grid xs item display="flex" justifyContent="start" alignItems="start">
          <Button
            type="reset"
            onClick={() => {
              setResetModalOpen(true);
            }}
            disabled={!isFormEdited}
            variant="outlined"
            color="error"
            data-testid={'product-clear-btn'}
          >
            Clear
          </Button>
        </Grid>
        <Grid xs item display="flex" justifyContent="end" alignItems="end">
          <Button
            data-testid={'preview-btn'}
            variant="contained"
            type="submit"
            color="primary"
            disabled={!isFormEdited}
            onClick={() => {
              if (newPackSizes.length > 0) {
                const data: BrandPackSizeCreationDetails = getValues();
                if (selectedProduct?.conceptId) {
                  data.productId = selectedProduct?.conceptId;
                  data.brands = deepClone(
                    defaultProductBrands,
                  ) as ProductBrands;
                  data.packSizes = deepClone(
                    defaultProductPackSizes,
                  ) as ProductPackSizes;
                  if (data.packSizes) {
                    data.packSizes.productId = data.productId;
                    data.packSizes.unitOfMeasure = unitOfMeasure;
                    data.packSizes.packSizes = [] as BigDecimal[];
                    newPackSizes.forEach(packSize => {
                      if (data.packSizes?.packSizes) {
                        data.packSizes.packSizes.push(Number(packSize));
                      }
                    });
                  }
                }
                setProductSaveDetails(data);
                setValue('packSizes', data.packSizes);
                setValue('brands', data.brands);
                setValue('productId', data.productId);
                setAutoFocusInput(false);
                setIsFormEdited(true);
              } else {
                setIsFormEdited(false);
              }
            }}
          >
            Preview
          </Button>
        </Grid>
      </Grid>

      {data && data.packSizes ? (
        <Grid direction="row" spacing={3} alignItems="start" container>
          <Grid item xs={12}>
            <Alert
              severity="info"
              sx={{
                marginTop: 3,
              }}
            >
              Enter one or more new pack sizes for the selected product.
            </Alert>
          </Grid>
          <Grid item xs={12}>
            <Grid
              container={true}
              alignItems={'end'}
              spacing={2}
              direction="row"
              width={'100%'}
              sx={{
                width: '100%',
              }}
            >
              <Grid item xs={9} textAlign={'start'}>
                <Box
                  // height={200}
                  width={'100%'}
                  display="flex"
                  alignItems="start"
                  padding={1}
                  sx={{
                    // width: 100,
                    // height: 100,
                    border: 1,
                    borderColor: 'lightgray',
                    borderRadius: 1,
                  }}
                >
                  {selectedProduct?.pt?.term}
                </Box>
              </Grid>
              <Grid item xs={2} textAlign={'end'}>
                <TextField
                  aria-readonly={false}
                  label="Size"
                  variant="standard"
                  fullWidth={true}
                  onFocus={() => setAutoFocusInput(true)}
                  autoFocus={autoFocusInput}
                  key={`new-pack-size-input`}
                  value={packSizeInput}
                  onInput={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setPackSizeInput(event.target.value);
                  }}
                />
              </Grid>
              <Grid item xs={1} textAlign={'center'}>
                <IconButton
                  size={'small'}
                  disabled={!isAddable()}
                  onClick={() => {
                    const tempPackSizes = [...newPackSizes];
                    if (isAddable()) {
                      tempPackSizes.push(packSizeInput);
                      setNewPackSizes([...tempPackSizes]);
                    }
                    setPackSizeInput('');
                    setIsFormEdited(tempPackSizes.length > 0);
                    setProductSaveDetails(data as BrandPackSizeCreationDetails);
                  }}
                >
                  <Tooltip title={'Add pack size'}>
                    <AddCircle fontSize="medium" />
                  </Tooltip>
                </IconButton>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={6}>
            <ListSubheader>{`Pack Sizes (Existing)`}</ListSubheader>
            <List>
              {[...data.packSizes].map(packSize => (
                <ListItem
                  key={concat(packSize, ' ', data.unitOfMeasure?.pt?.term)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <LockIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={concat(
                      packSize,
                      ' ',
                      data.unitOfMeasure?.pt?.term,
                    )}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={6}>
            <ListSubheader>{`Pack Sizes (New)`}</ListSubheader>
            <List>
              {newPackSizes && newPackSizes.length > 0 ? (
                [...newPackSizes].map(packSize => (
                  <ListItem
                    key={concat(packSize, ' ', data.unitOfMeasure?.pt?.term)}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
                          const tempPackSizes = [...newPackSizes];
                          if (tempPackSizes.includes(packSize)) {
                            tempPackSizes.splice(
                              tempPackSizes.indexOf(packSize),
                              1,
                            );
                            setNewPackSizes([...tempPackSizes]);
                          }
                          setIsFormEdited(tempPackSizes.length > 0);
                          setProductSaveDetails(
                            data as BrandPackSizeCreationDetails,
                          );
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <MedicationIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={concat(
                        packSize,
                        ` `,
                        data.unitOfMeasure?.pt?.term,
                      )}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <Alert
                    severity="warning"
                    sx={{
                      width: '100%',
                    }}
                  >
                    No new pack sizes entered
                  </Alert>
                </ListItem>
              )}
            </List>
          </Grid>
        </Grid>
      ) : (
        <></>
      )}
    </>
  );
}
export default PackSizeAuthoring;
