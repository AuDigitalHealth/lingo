import { useEffect, useState } from 'react';
import {
  ActionType,
  BrandPackSizeCreationDetails,
  BrandWithIdentifiers,
  ExternalIdentifier,
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
  Tooltip,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import MedicationIcon from '@mui/icons-material/Medication';

import { Concept } from '../../../types/concept.ts';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';

import { FieldLabel, FieldLabelRequired } from './style/ProductBoxes.tsx';
import ProductPreview7BoxModal from './ProductPreview7BoxModal.tsx';
import { Ticket } from '../../../types/tickets/ticket.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import ProductAutocompleteV2 from './ProductAutocompleteV2.tsx';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';

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

import useConceptStore from '../../../stores/ConceptStore.ts';
import { deepClone } from '@mui/x-data-grid/utils/utils';
import ArtgAutoComplete from './ArtgAutoComplete.tsx';
import { useFetchBulkAuthorBrands } from '../../../hooks/api/tickets/useTicketProduct.tsx';
import { FieldChips } from './ArtgFieldChips.tsx';

export interface BrandAuthoringProps {
  selectedProduct: Concept | null;
  handleClearForm: () => void;
  isFormEdited: boolean;
  setIsFormEdited: (value: boolean) => void;
  branch: string;
  ticket: Ticket;
  fieldBindings: FieldBindings;
  productBrands: ProductBrands;
  ticketProductId?: string;
  actionType: ActionType;
}

function BrandAuthoring(productprops: BrandAuthoringProps) {
  const {
    selectedProduct,

    handleClearForm,
    isFormEdited,
    setIsFormEdited,
    branch,
    ticket,
    fieldBindings,
    productBrands,
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

  const [runningWarningsCheck, setRunningWarningsCheck] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const { serviceStatus } = useServiceStatus();
  const { canEdit } = useCanEditTask();
  const [newBrands, setNewBrands] = useState([] as BrandWithIdentifiers[]);

  const defaultForm: BrandPackSizeCreationDetails = {
    productId: '',
    brands: productBrands,
    packSizes: undefined,
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
    setNewBrands([]);
  }, [selectedProduct]);

  const { data, isFetching } = useFetchBulkAuthorBrands(
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
        Search and select a product to create new brand(s).
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
                  {actionType === ActionType.newBrand && data ? (
                    <BrandBody
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
                      newBrands={newBrands}
                      setNewBrands={setNewBrands}
                      canEdit={canEdit}
                      data={data}
                    />
                  ) : (
                    <></>
                  )}
                </form>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }
}

interface BrandBody {
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
  newBrands: BrandWithIdentifiers[];
  setNewBrands: (value: BrandWithIdentifiers[]) => void;
  canEdit: boolean;
  data: ProductBrands;
}
export function BrandBody({
  selectedProduct,
  control,
  setIsFormEdited,
  branch,
  fieldBindings,
  errors,
  isFormEdited,
  handleClearForm,
  reset,
  getValues,
  defaultForm,
  setValue,
  newBrands,
  setNewBrands,
  data,
}: BrandBody) {
  const [, setActivePackageTabIndex] = useState(0);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const { defaultProductPackSizes, defaultProductBrands } = useConceptStore();

  const [, setProductSaveDetails] = useState<BrandPackSizeCreationDetails>();

  const [brandInput, setBrandInput] = useState<BrandWithIdentifiers | null>(
    null,
  );
  const [optVals, setOptVals] = useState<Concept[]>([]);
  const [artgOptVals, setArtgOptVals] = useState<ExternalIdentifier[]>([]);

  useEffect(() => {
    // setNewBrands([]);
    setOptVals([]);
    setArtgOptVals([]);
    setValue('productId', []);
  }, [selectedProduct]);

  useEffect(() => {
    if (newBrands.length < 1) {
      setIsFormEdited(false);
    }
  }, [newBrands]);

  function isAddable() {
    return (
      brandInput &&
      newBrands &&
      !findBrandInList(newBrands, brandInput) &&
      !findBrandInList(data.brands, brandInput)
    );
  }
  function clearInputFields() {
    setValue('externalIdentifiers', []);
    setValue('productId', []);
  }
  function findBrandInList(
    brandList: BrandWithIdentifiers[] | undefined,
    brand: BrandWithIdentifiers,
  ) {
    if (!brandList) {
      return undefined;
    }
    const filteredBrand = brandList.find(
      b => b.brand.conceptId === brand.brand.conceptId,
    );
    return filteredBrand;
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
          setNewBrands([]);

          setResetModalOpen(false);
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

      {data && data.brands ? (
        <Grid direction="row" spacing={3} alignItems="start" container>
          {true && (
            <Grid item xs={12}>
              <Alert
                severity="info"
                sx={{
                  marginTop: 3,
                }}
              >
                Enter one or more new brands for the selected product.
              </Alert>
            </Grid>
          )}
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
                    <FieldLabelRequired>Brand Name</FieldLabelRequired>
                    <ProductAutocompleteV2
                      name={`productId`}
                      control={control}
                      branch={branch}
                      ecl={generateEclFromBinding(
                        fieldBindings,
                        'package.productName',
                      )}
                      error={errors?.productId as FieldError}
                      dataTestId={'package-brand'}
                      showDefaultOptions={false}
                      optionValues={optVals}
                      handleChange={(concept: Concept | null) => {
                        if (concept) {
                          const brand: BrandWithIdentifiers = {
                            brand: concept,
                            externalIdentifiers: artgOptVals,
                          };
                          setBrandInput(brand);
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
                  >
                    <FieldLabel>Artg Id</FieldLabel>
                    <ArtgAutoComplete
                      name={`externalIdentifiers`}
                      control={control}
                      error={errors?.productId as FieldError}
                      dataTestId={'package-brand'}
                      optionValues={artgOptVals}
                      handleChange={(artgs: ExternalIdentifier[] | null) => {
                        if (artgs && brandInput) {
                          const brand = brandInput;
                          brand.externalIdentifiers = artgs;
                          setBrandInput(brand);
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
                  disabled={!isAddable()}
                  onClick={() => {
                    const tempBrands = [...newBrands];
                    if (isAddable() && brandInput) {
                      if (artgOptVals) {
                        brandInput.externalIdentifiers = artgOptVals;
                      }
                      tempBrands.push(brandInput);
                      setNewBrands([...tempBrands]);
                    }
                    setBrandInput(null);

                    setOptVals([]);
                    setArtgOptVals([]);
                    setIsFormEdited(tempBrands.length > 0);
                    setProductSaveDetails(data as BrandPackSizeCreationDetails);
                    clearInputFields();
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
              <ListSubheader>{`Brands (Existing)`}</ListSubheader>
              {[...data.brands].map(brand => (
                <ListItem key={brand.brand.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <MedicationIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <Box>
                    <ListItemText primary={brand.brand.pt?.term} />
                    <FieldChips items={brand.externalIdentifiers} />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={6}>
            <List>
              <ListSubheader>{`Brands (New)`}</ListSubheader>
              {newBrands && newBrands.length > 0 ? (
                [...newBrands].map(brand => (
                  <ListItem
                    key={brand.brand.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
                          const tempBrands = [...newBrands];
                          if (tempBrands.includes(brand)) {
                            tempBrands.splice(tempBrands.indexOf(brand), 1);
                            setNewBrands([...tempBrands]);
                          }
                          setIsFormEdited(tempBrands.length > 0);
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
                      <ListItemText primary={brand.brand.pt?.term} />
                      <FieldChips items={brand.externalIdentifiers} />
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
                    No new brands entered
                  </Alert>
                </ListItem>
              )}
            </List>
          </Grid>
        </Grid>
      ) : (
        <></>
      )}
      <Grid
        xs
        item
        display="flex"
        justifyContent="end"
        alignItems="end"
        paddingTop={5}
      >
        <Button
          data-testid={'preview-btn'}
          variant="contained"
          type="submit"
          color="primary"
          disabled={!isFormEdited}
          onClick={() => {
            if (newBrands.length > 0) {
              const data: BrandPackSizeCreationDetails = getValues();
              if (selectedProduct?.conceptId) {
                data.productId = selectedProduct?.conceptId;
                data.brands = deepClone(defaultProductBrands) as ProductBrands;
                data.packSizes = deepClone(
                  defaultProductPackSizes,
                ) as ProductPackSizes;
                if (data.brands) {
                  data.brands.productId = data.productId;
                  data.brands.brands = [];
                  newBrands.forEach(brand => {
                    if (data.brands?.brands) {
                      data.brands.brands.push(brand);
                    }
                  });
                }
              }
              setProductSaveDetails(data);
              setValue('packSizes', data.packSizes);
              setValue('brands', data.brands);
              setValue('productId', data.productId);
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

export default BrandAuthoring;
