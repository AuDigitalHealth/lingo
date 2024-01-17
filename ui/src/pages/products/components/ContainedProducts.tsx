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
  useFieldArray,
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
  getValues: UseFormGetValues<any>;
  defaultUnit: Concept;
  errors?: FieldErrors<MedicationPackageDetails>;
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
}) => {
  const productsArray = partOfPackage
    ? `containedPackages[${packageIndex}].packageDetails.containedProducts`
    : 'containedProducts';

  const {
    fields: packageProductFields,
    append: packageProductAppend,
    remove: packageProductRemove,
  } = useFieldArray({
    control,
    name: partOfPackage
      ? (`containedPackages[${packageIndex}.packageDetails.containedProducts` as 'containedProducts')
      : 'containedProducts',
  });
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const handleToggleModal = () => {
    setModalOpen(!modalOpen);
  };
  const handleSearchAndAddProduct = () => {
    handleToggleModal();
  };
  const append = (value: MedicationProductQuantity | DeviceProductQuantity) => {
    if (productAppend) {
      productAppend(value);
    } else {
      packageProductAppend(value);
    }
  };

  const ProductDetails = () => {
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
          productAppend={productAppend ? productAppend : packageProductAppend}
          productType={productType}
          branch={branch}
          fieldBindings={fieldBindings}
        />

        {(productFields ? productFields : packageProductFields).map(
          (containedProduct, index) => {
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
                  productRemove ? productRemove : packageProductRemove
                }
                productType={productType}
                branch={branch}
                fieldBindings={fieldBindings}
                getValues={getValues}
                errors={errors}
              />
            );
          },
        )}
      </div>
    );
  };
  return (
    <>
      {partOfPackage ? (
        <Level2Box component="fieldset">
          <legend>Contained Products</legend>
          <ProductDetails></ProductDetails>
        </Level2Box>
      ) : (
        <Level1Box component="fieldset">
          <legend>Contained Products</legend>
          <ProductDetails></ProductDetails>
        </Level1Box>
      )}
    </>
  );
};

export default ContainedProducts;
