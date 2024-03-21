import React, { FC, useState } from 'react';
import {
  DeviceProductQuantity,
  MedicationPackageDetails,
  MedicationProductQuantity,
  ProductType,
} from '../../../types/product.ts';
import { Concept } from '../../../types/concept.ts';
import { Grid, IconButton, Tooltip } from '@mui/material';
import { Stack } from '@mui/system';
import { AddCircle } from '@mui/icons-material';

import ProductSearchAndAddModal from './ProductSearchAndAddModal.tsx';
import SearchAndAddIcon from '../../../components/icons/SearchAndAddIcon.tsx';
import { Level1Box, Level2Box } from './style/ProductBoxes.tsx';

import DetailedProduct from './DetailedProduct.tsx';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormGetValues,
  UseFormRegister,
} from 'react-hook-form';
import { defaultProduct } from '../../../utils/helpers/conceptUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';

interface ContainedProductsProps {
  packageIndex?: number;
  partOfPackage: boolean;
  showTPU?: boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  productFields?: FieldArrayWithId<any, 'containedProducts', 'id'>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  productAppend?: UseFieldArrayAppend<any, 'containedProducts'>;
  productRemove?: UseFieldArrayRemove;
  productType: ProductType;
  branch: string;
  fieldBindings: FieldBindings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: UseFormGetValues<any>;
  defaultUnit: Concept;
  errors?: FieldErrors<MedicationPackageDetails>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packageProductFields?: FieldArrayWithId<any, 'containedProducts', 'id'>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packageProductAppend?: UseFieldArrayAppend<any, 'containedProducts'>;
  packageProductRemove?: UseFieldArrayRemove;
  productsArray: string;
  expandedProducts: string[];
  setExpandedProducts: (value: string[]) => void;
}
const ContainedProducts: FC<ContainedProductsProps> = ({
  packageIndex,
  partOfPackage,
  showTPU,

  control,
  register,
  productFields,
  productAppend,
  productRemove,
  productType,
  defaultUnit,

  branch,
  fieldBindings,
  getValues,
  errors,
  packageProductFields,
  packageProductAppend,
  packageProductRemove,
  productsArray,
  expandedProducts,
  setExpandedProducts,
}) => {
  return (
    <>
      {partOfPackage ? (
        <Level2Box component="fieldset">
          <legend>Contained Products</legend>
          <ProductDetails
            showTPU={showTPU}
            partOfPackage={partOfPackage}
            control={control}
            register={register}
            productFields={productFields}
            productAppend={productAppend}
            productRemove={productRemove}
            productType={productType}
            branch={branch}
            fieldBindings={fieldBindings}
            getValues={getValues}
            defaultUnit={defaultUnit}
            packageIndex={packageIndex}
            productsArray={productsArray}
            packageProductAppend={packageProductAppend}
            packageProductFields={packageProductFields}
            packageProductRemove={packageProductRemove}
            expandedProducts={expandedProducts}
            setExpandedProducts={setExpandedProducts}
            errors={errors}
          ></ProductDetails>
        </Level2Box>
      ) : (
        <Level1Box component="fieldset">
          <legend>Contained Products</legend>
          <ProductDetails
            showTPU={showTPU}
            partOfPackage={partOfPackage}
            control={control}
            register={register}
            productFields={productFields}
            productAppend={productAppend}
            productRemove={productRemove}
            productType={productType}
            branch={branch}
            fieldBindings={fieldBindings}
            getValues={getValues}
            defaultUnit={defaultUnit}
            productsArray={productsArray}
            expandedProducts={expandedProducts}
            setExpandedProducts={setExpandedProducts}
            errors={errors}
          ></ProductDetails>
        </Level1Box>
      )}
    </>
  );
};

export interface ProductDetailsProps {
  packageIndex?: number;
  partOfPackage: boolean;
  showTPU?: boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  productFields?: FieldArrayWithId<any, 'containedProducts', 'id'>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  productAppend?: UseFieldArrayAppend<any, 'containedProducts'>;
  productRemove?: UseFieldArrayRemove;
  productType: ProductType;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<MedicationPackageDetails>;
  defaultUnit: Concept;
  errors?: FieldErrors<MedicationPackageDetails>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packageProductFields?: FieldArrayWithId<any, 'containedProducts', 'id'>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packageProductAppend?: UseFieldArrayAppend<any, 'containedProducts'>;
  packageProductRemove?: UseFieldArrayRemove;
  productsArray: string;
  expandedProducts: string[];
  setExpandedProducts: (value: string[]) => void;
}
export const ProductDetails = ({
  defaultUnit,
  getValues,
  productAppend,
  productRemove,
  partOfPackage,
  packageIndex,
  control,
  branch,
  fieldBindings,
  productFields,
  productType,
  showTPU,
  register,
  errors,
  packageProductFields,
  packageProductAppend,
  packageProductRemove,
  productsArray,
  expandedProducts,
  setExpandedProducts,
}: ProductDetailsProps) => {
  const append = (value: MedicationProductQuantity | DeviceProductQuantity) => {
    if (productAppend) {
      productAppend(
        productFields && productFields.length > 0 ? undefined : value,
      );
    } else if (packageProductAppend) {
      packageProductAppend(value);
    }
  };
  const [modalOpen, setModalOpen] = useState(false);
  const handleToggleModal = () => {
    setModalOpen(!modalOpen);
  };
  const handleSearchAndAddProduct = () => {
    handleToggleModal();
  };
  return (
    <div key={'product-details'} style={{ minHeight: '50px' }}>
      <Grid container justifyContent="flex-end">
        <Stack direction="row" spacing={0} alignItems="center">
          <IconButton
            onClick={() => {
              append(
                defaultProduct(
                  defaultUnit,
                  getValues('productName') as Concept | undefined,
                ),
              );
            }}
            aria-label="create"
            size="large"
          >
            <Tooltip title={'Create new product'}>
              <AddCircle fontSize="medium" />
            </Tooltip>
          </IconButton>

          <Tooltip title={'Search and add an existing product'}>
            <IconButton
              aria-label="create"
              size="large"
              onClick={handleSearchAndAddProduct}
            >
              <SearchAndAddIcon width={'20px'} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Grid>
      <ProductSearchAndAddModal
        open={modalOpen}
        handleClose={handleToggleModal}
        productAppend={
          productAppend
            ? productAppend
            : (packageProductAppend as UseFieldArrayAppend<
                any,
                'containedProducts'
              >)
        }
        productType={productType}
        branch={branch}
        fieldBindings={fieldBindings}
      />

      {(productFields
        ? productFields
        : (packageProductFields as FieldArrayWithId<
            any,
            'containedProducts',
            'id'
          >[])
      ).map((containedProduct, index) => {
        return (
          <DetailedProduct
            index={index}
            expandedProducts={expandedProducts}
            setExpandedProducts={setExpandedProducts}
            containedProduct={containedProduct as MedicationProductQuantity}
            showTPU={showTPU}
            productsArray={productsArray}
            partOfPackage={partOfPackage}
            packageIndex={packageIndex}
            key={`product-${containedProduct.id}`}
            control={control}
            register={register}
            productRemove={
              productRemove
                ? productRemove
                : (packageProductRemove as UseFieldArrayRemove)
            }
            productType={productType}
            branch={branch}
            fieldBindings={fieldBindings}
            getValues={getValues}
            errors={errors}
          />
        );
      })}
    </div>
  );
};

export default ContainedProducts;
