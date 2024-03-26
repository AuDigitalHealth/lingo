import { Concept } from '../../../types/concept.ts';
import {
  DevicePackageDetails,
  DeviceProductQuantity,
  MedicationPackageDetails,
  MedicationProductQuantity,
  ProductType,
} from '../../../types/product.ts';
import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack } from '@mui/system';
import { Delete } from '@mui/icons-material';
import {
  FieldLabelRequired,
  InnerBox,
  OuterBox,
} from './style/ProductBoxes.tsx';
import Ingredients from './Ingredients.tsx';

import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';
import {
  Control,
  FieldError,
  FieldErrors,
  UseFieldArrayRemove,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import DoseForms from './DoseForm.tsx';
import {
  isDeviceType,
  isValidConceptName,
} from '../../../utils/helpers/conceptUtils.ts';
import DeviceTypeForms from './DeviceTypeForm.tsx';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import ProductAutocompleteV2 from './ProductAutocompleteV2.tsx';

interface DetailedProductProps {
  index: number;

  expandedProducts: string[];
  setExpandedProducts: (value: string[]) => void;
  containedProduct: MedicationProductQuantity | DeviceProductQuantity;
  showTPU?: boolean;
  productsArray: string;
  partOfPackage: boolean;
  packageIndex?: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  productRemove: UseFieldArrayRemove;
  productType: ProductType;
  branch: string;
  fieldBindings: FieldBindings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: UseFormGetValues<any>;
  errors?: FieldErrors<MedicationPackageDetails | DevicePackageDetails>;
  setValue: UseFormSetValue<any>;
}
function DetailedProduct(props: DetailedProductProps) {
  const {
    index,
    expandedProducts,
    setExpandedProducts,

    containedProduct,
    showTPU,
    productsArray,
    partOfPackage,
    packageIndex,

    control,
    register,
    productRemove,
    productType,

    branch,
    fieldBindings,
    getValues,
    errors,
    setValue,
  } = props;

  const [disabled, setDisabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState(-1);
  const [deleteModalContent, setDeleteModalContent] = useState('');

  const handleDeleteProduct = () => {
    productRemove(indexToDelete);
    setDeleteModalOpen(false);
  };
  const productKey = (index: number) => {
    return `product-key-${index}`;
  };
  const productAccordionClicked = (key: string) => {
    if (expandedProducts.includes(key)) {
      setExpandedProducts(
        expandedProducts.filter((value: string) => value !== key),
      );
    } else {
      setExpandedProducts([...expandedProducts, key]);
    }
  };
  return (
    <div key={productKey(index)} style={{ marginTop: '10px' }}>
      <ConfirmationModal
        open={deleteModalOpen}
        content={deleteModalContent}
        handleClose={() => {
          setDeleteModalOpen(false);
        }}
        title={'Confirm Delete Product'}
        disabled={disabled}
        action={'Delete'}
        handleAction={handleDeleteProduct}
      />
      <Accordion
        key={productKey(index)}
        style={{ border: 'none' }}
        onChange={() => productAccordionClicked(productKey(index))}
        expanded={expandedProducts.includes(productKey(index))}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          //aria-expanded={true}

          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Grid xs={40} item={true}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Grid item xs={10}>
                <ProductNameWatched
                  control={control}
                  index={index}
                  productsArray={productsArray}
                />
              </Grid>
              <Grid container justifyContent="flex-end">
                <Stack direction="row" spacing={0} alignItems="center">
                  <IconButton
                    aria-label="delete"
                    size="small"
                    onClick={e => {
                      setIndexToDelete(index);

                      setDeleteModalContent(
                        `Remove the product  "${
                          isValidConceptName(
                            containedProduct.productDetails
                              ?.productName as Concept,
                          )
                            ? containedProduct.productDetails?.productName?.pt
                                ?.term
                            : 'Untitled'
                        }?"`,
                      );
                      setDeleteModalOpen(true);
                      e.stopPropagation();
                    }}
                    color="error"
                    sx={{ mt: 0.25 }}
                  >
                    <Tooltip title={'Delete Product'}>
                      <Delete />
                    </Tooltip>
                  </IconButton>
                </Stack>
              </Grid>
            </Stack>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <Grid
            container
            rowSpacing={1}
            columnSpacing={{ xs: 1, sm: 2, md: 3 }}
          >
            <Grid xs={6} key={'left'} item={true}>
              {showTPU ? (
                <OuterBox component="fieldset">
                  <legend>Product Details</legend>
                  <InnerBox component="fieldset">
                    <FieldLabelRequired>Brand Name</FieldLabelRequired>
                    <ProductAutocompleteV2
                      name={`${productsArray}[${index}].productDetails.productName`}
                      control={control}
                      branch={branch}
                      ecl={generateEclFromBinding(
                        fieldBindings,
                        isDeviceType(productType)
                          ? 'deviceProduct.productName'
                          : 'medicationProduct.productName',
                      )}
                      error={
                        partOfPackage
                          ? ((errors as FieldErrors<MedicationPackageDetails>)
                              ?.containedPackages?.[packageIndex as number]
                              ?.packageDetails?.containedProducts?.[index]
                              ?.productDetails?.productName as FieldError)
                          : (errors?.containedProducts?.[index]?.productDetails
                              ?.productName as FieldError)
                      }
                    />
                  </InnerBox>
                </OuterBox>
              ) : (
                <div></div>
              )}

              {!isDeviceType(productType) ? (
                <OuterBox component="fieldset">
                  <legend>Active Ingredients</legend>

                  <Ingredients
                    containedProductIndex={index}
                    packageIndex={
                      partOfPackage ? (packageIndex as number) : undefined
                    }
                    partOfPackage={partOfPackage}
                    control={control}
                    register={register}
                    branch={branch}
                    fieldBindings={fieldBindings}
                    getValues={getValues}
                    errors={errors}
                    setValue={setValue}
                  />
                </OuterBox>
              ) : (
                <div></div>
              )}
            </Grid>
            {!isDeviceType(productType) ? (
              <DoseForms
                productsArray={productsArray}
                control={control}
                register={register}
                index={index}
                branch={branch}
                fieldBindings={fieldBindings}
                getValues={getValues}
                errors={errors}
                partOfPackage={partOfPackage}
                packageIndex={packageIndex}
                setValue={setValue}
              />
            ) : (
              <DeviceTypeForms
                productsArray={productsArray}
                control={control}
                register={register}
                index={index}
                branch={branch}
                fieldBindings={fieldBindings}
                getValues={getValues}
                errors={errors}
                setValue={setValue}
              />
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
function ProductNameWatched({
  control,
  index,
  productsArray,
}: {
  control: Control<MedicationPackageDetails | DevicePackageDetails>;
  index: number;
  productsArray: string;
}) {
  const productName = useWatch({
    control,
    name: `${productsArray}[${index}].productDetails.productName` as 'containedProducts.0.productDetails.productName', // without supply name will watch the entire form, or ['firstName', 'lastName'] to watch both
  }) as Concept;

  return (
    <Typography
      sx={{
        color: !isValidConceptName(productName) ? 'red' : 'inherit',
      }}
    >
      {isValidConceptName(productName) ? productName.pt?.term : 'Untitled*'}
    </Typography>
  );
}
export default DetailedProduct;
