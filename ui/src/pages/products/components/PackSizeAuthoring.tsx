import React, { useEffect, useState } from 'react';
import {
  ActionType,
  BrandPackSizeCreationDetails,
  ExternalIdentifier,
  PackSizeWithIdentifiers,
  ProductBrands,
  ProductPackSizes,
  ProductType,
} from '../../../types/product.ts';
import {
  Control,
  FieldError,
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
import {
  brandPackSizeCreationDetailsObjectSchema,
  PACK_SIZE_THRESHOLD,
} from '../../../types/productValidations.ts';

import WarningModal from '../../../themes/overrides/WarningModal.tsx';
import { findWarningsForBrandPackSizes } from '../../../types/productValidationUtils.ts';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import ProductLoader from './ProductLoader.tsx';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
import { closeSnackbar } from 'notistack';
import useCanEditTask from '../../../hooks/useCanEditTask.tsx';
import { AddCircle } from '@mui/icons-material';

import LockIcon from '@mui/icons-material/Lock';
import useConceptStore from '../../../stores/ConceptStore.ts';
import { deepClone } from '@mui/x-data-grid/utils/utils';
import { concat, UnitEachId } from '../../../utils/helpers/conceptUtils.ts';
import { useFetchBulkAuthorPackSizes } from '../../../hooks/api/tickets/useTicketProduct.tsx';
import { FieldChips } from './ArtgFieldChips.tsx';
import { FieldLabel, FieldLabelRequired } from './style/ProductBoxes.tsx';
import ArtgAutoComplete from './ArtgAutoComplete.tsx';

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

  const [autoFocusInput, setAutoFocusInput] = useState(false);
  const [runningWarningsCheck, setRunningWarningsCheck] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const { serviceStatus } = useServiceStatus();
  const [newPackSizes, setNewPackSizes] = useState<PackSizeWithIdentifiers[]>(
    [],
  );
  const [unitOfMeasure, setUoM] = useState<Concept | undefined>(undefined);
  const { canEdit } = useCanEditTask();

  const setUnitOfMeasure = (uom: Concept | undefined) => {
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

  useEffect(() => {
    setNewPackSizes([]);
  }, [selectedProduct]);

  const { data, isFetching } = useFetchBulkAuthorPackSizes(
    selectedProduct,
    branch,
  );

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

  if (isFetching) {
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
  } else if (!selectedProduct || !data) {
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
                  {actionType === ActionType.newPackSize && data ? (
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
                      data={data}
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
  newPackSizes: PackSizeWithIdentifiers[];
  setNewPackSizes: (value: PackSizeWithIdentifiers[]) => void;
  unitOfMeasure: Concept | undefined;
  setUnitOfMeasure: (uom: Concept | undefined) => void;
  canEdit: boolean;
  data: ProductPackSizes;
}
export function PackSizeBody({
  selectedProduct,
  setIsFormEdited,
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
  data,
  control,
  errors,
}: PackSizeBody) {
  const [, setActivePackageTabIndex] = useState(0);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [, setProductSaveDetails] = useState<BrandPackSizeCreationDetails>();

  const { defaultProductPackSizes, defaultProductBrands } = useConceptStore();
  const defaultArtgs = findDefaultArtgIds(data);
  const [artgOptVals, setArtgOptVals] =
    useState<ExternalIdentifier[]>(defaultArtgs);
  // const [packSizeWithIdentifier, setPackSizeWithIdentifier] = useState<PackSizeWithIdentifiers | null>(null);
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState('');

  useEffect(() => {
    setUnitOfMeasure(undefined);
    if (defaultArtgs) {
      setValue('externalIdentifiers', defaultArtgs);
    }
  }, [selectedProduct]); //Reset pack size for product changes

  useEffect(() => {
    if (data && data.unitOfMeasure) {
      setUnitOfMeasure(data.unitOfMeasure);
    }
  }, [data]);

  useEffect(() => {
    if (newPackSizes.length < 1) {
      setIsFormEdited(false);
    }
  }, [newPackSizes]);

  const [packSizeInput, setPackSizeInput] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPackSizeInput(value);

    if (value && value.trim().length > 0) {
      if (!isNumber(value)) {
        setError(true);
        setHelperText(`Not a valid pack size`);
      } else if (!isUnitAlignedWithValue(Number(value), unitOfMeasure)) {
        setError(true);
        setHelperText('Value must be a positive whole number');
      } else if (checkPackSizeExceedsThreshold(value)) {
        setError(true);
        setHelperText(
          `The pack size must not exceed the ${PACK_SIZE_THRESHOLD} limit`,
        );
      } else if (isAddable(value)) {
        setError(false);
        setHelperText('');
      } else {
        setError(true);
        setHelperText('Not a valid pack size');
      }
    } else {
      setError(false);
      setHelperText('');
    }
  };
  function isAddable(inputValue: string) {
    const validPackSize =
      inputValue &&
      inputValue.trim() !== '' &&
      isNumber(inputValue) &&
      !findPackSizeInList(newPackSizes, inputValue) &&
      !findPackSizeInList(data.packSizes, inputValue);
    return (
      validPackSize &&
      !checkPackSizeExceedsThreshold(inputValue) &&
      isUnitAlignedWithValue(Number(inputValue), unitOfMeasure)
    );
  }

  function addNewPackSize() {
    const tempPackSizes = [...newPackSizes];
    if (isAddable(packSizeInput)) {
      const packSize: PackSizeWithIdentifiers = {
        packSize: Number(packSizeInput),
        externalIdentifiers: [],
      };
      if (artgOptVals) {
        packSize.externalIdentifiers = artgOptVals;
      }
      // setPackSizeWithIdentifier(packSize);

      tempPackSizes.push(packSize);
      setNewPackSizes([...tempPackSizes]);
    }
    setPackSizeInput('');
    setIsFormEdited(tempPackSizes.length > 0);
    setProductSaveDetails(data as BrandPackSizeCreationDetails);
    resetArtgInput();
  }
  function resetArtgInput() {
    setValue('externalIdentifiers', defaultArtgs);
    setArtgOptVals(defaultArtgs);
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
          setNewPackSizes([]);
        }}
      />

      <Grid container justifyContent="flex-end">
        <Button
          type="reset"
          onClick={() => {
            setResetModalOpen(true);
          }}
          disabled={!isFormEdited}
          variant="contained"
          color="error"
          data-testid={'product-clear-btn'}
        >
          Clear
        </Button>
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
              alignItems={'center'}
              spacing={2}
              direction="row"
              width={'100%'}
              sx={{
                width: '100%',
              }}
            >
              <Grid
                item
                xs={6}
                textAlign={'start'}
                alignContent={'start'}
                height={130}
              >
                <Box
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
              <Grid
                item
                xs={5}
                textAlign={'start'}
                alignContent={'start'}
                height={210}
              >
                <Box
                  border={0.1}
                  borderColor="grey.200"
                  marginLeft={2}
                  padding={2}
                >
                  <Grid
                    item
                    xs={12}
                    alignItems={'start'}
                    sx={{
                      verticalAlign: 'top',
                    }}
                  >
                    <FieldLabelRequired>Pack Size</FieldLabelRequired>
                    <TextField
                      aria-readonly={false}
                      fullWidth={true}
                      onFocus={() => setAutoFocusInput(true)}
                      autoFocus={autoFocusInput}
                      key={`new-pack-size-input`}
                      value={packSizeInput}
                      onInput={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setPackSizeInput(event.target.value);
                      }}
                      onChange={handleInputChange}
                      error={error}
                      helperText={helperText}
                      onKeyDown={ev => {
                        if (ev.key === 'Enter') {
                          ev.preventDefault();
                          addNewPackSize();
                        }
                      }}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    alignItems={'start'}
                    sx={{
                      verticalAlign: 'top',
                    }}
                    paddingTop={2}
                  >
                    <FieldLabel>Artg Id</FieldLabel>
                    <ArtgAutoComplete
                      name={`externalIdentifiers`}
                      control={control}
                      error={errors?.productId as FieldError}
                      dataTestId={'package-brand'}
                      optionValues={artgOptVals}
                      handleChange={(artgs: ExternalIdentifier[] | null) => {
                        if (artgs) {
                          setArtgOptVals(artgs);
                        }
                      }}
                    />
                  </Grid>
                </Box>
              </Grid>
              <Grid item xs={1} textAlign={'center'}>
                <IconButton
                  size={'small'}
                  disabled={!isAddable(packSizeInput)}
                  onClick={() => {
                    if (isAddable(packSizeInput)) {
                      addNewPackSize();
                    }
                  }}
                >
                  <Tooltip title={'Add brand'}>
                    <AddCircle fontSize="medium" />
                  </Tooltip>
                </IconButton>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={6}>
            <List>
              <ListSubheader>{`Pack Sizes (Existing)`}</ListSubheader>
              {[...data.packSizes].map(packSize => (
                <ListItem
                  key={concat(
                    packSize.packSize,
                    ' ',
                    data.unitOfMeasure?.pt?.term,
                  )}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <LockIcon />
                    </Avatar>
                  </ListItemAvatar>

                  <Box>
                    <ListItemText
                      primary={concat(
                        packSize.packSize,
                        ' ',
                        data.unitOfMeasure?.pt?.term,
                      )}
                    />
                    <FieldChips items={packSize.externalIdentifiers} />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={6}>
            <List>
              <ListSubheader>{`Pack Sizes (New)`}</ListSubheader>
              {newPackSizes && newPackSizes.length > 0 ? (
                [...newPackSizes].map(packSize => (
                  <ListItem
                    key={concat(
                      packSize.packSize,
                      ' ',
                      data.unitOfMeasure?.pt?.term,
                    )}
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
                    <Box>
                      <ListItemText
                        primary={concat(
                          packSize.packSize,
                          ' ',
                          data.unitOfMeasure?.pt?.term,
                        )}
                      />
                      <FieldChips items={packSize.externalIdentifiers} />
                    </Box>
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
                data.brands = deepClone(defaultProductBrands) as ProductBrands;
                data.packSizes = deepClone(
                  defaultProductPackSizes,
                ) as ProductPackSizes;
                if (data.packSizes) {
                  data.packSizes.productId = data.productId;
                  data.packSizes.unitOfMeasure = unitOfMeasure;
                  data.packSizes.packSizes = [];
                  newPackSizes.forEach(packSize => {
                    if (data.packSizes?.packSizes) {
                      data.packSizes.packSizes.push(packSize);
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
    </>
  );
}
function isNumber(value: string) {
  if (value && value.trim() !== '') {
    return !isNaN(Number(value)) && Number(value) > 0;
  }
}
function findDefaultArtgIds(data: ProductPackSizes) {
  if (data && data.packSizes && data.packSizes.length > 0) {
    return findCommonArtgIds(
      data.packSizes[0].externalIdentifiers,
      data.packSizes.map(p => p.externalIdentifiers),
    );
  }
  return [];
}
function checkElementExistsInArray(
  obj1: ExternalIdentifier,
  array: ExternalIdentifier[],
): boolean {
  return array.some(a => a.identifierValue === obj1.identifierValue);
}

function findCommonArtgIds(
  mainArray: ExternalIdentifier[],
  arrayOfArrays: ExternalIdentifier[][],
): ExternalIdentifier[] {
  if (mainArray && mainArray.length > 0) {
    let commonElements: ExternalIdentifier[] = [...mainArray];

    mainArray.forEach(artg => {
      arrayOfArrays.forEach(artgArray => {
        if (!checkElementExistsInArray(artg, artgArray)) {
          commonElements = commonElements.filter(
            item => item.identifierValue !== artg.identifierValue,
          );
        }
      });
    });

    return commonElements;
  } else {
    return [];
  }
}

function findPackSizeInList(
  packSizeList: PackSizeWithIdentifiers[] | undefined,
  packSize: string,
) {
  if (!packSizeList) {
    return undefined;
  }
  const filteredPacksSize = packSizeList.find(
    p => p.packSize.toString() === packSize,
  );
  return filteredPacksSize;
}
function checkPackSizeExceedsThreshold(value: string) {
  return Number(value) > PACK_SIZE_THRESHOLD;
}
function isUnitAlignedWithValue(
  value: number,
  unitOfMeasure: Concept | undefined,
) {
  if (
    unitOfMeasure &&
    unitOfMeasure.conceptId === UnitEachId &&
    !Number.isInteger(value)
  ) {
    return false;
  }
  return true;
}

export default PackSizeAuthoring;
