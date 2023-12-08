import React, { FC, useState } from 'react';
import {
  DeviceProductQuantity,
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
  useFieldArray,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormRegister,
} from 'react-hook-form';
import {
  defaultProduct,
  getDefaultUnit,
} from '../../../utils/helpers/conceptUtils.ts';

interface ContainedProductsProps {
  packageIndex?: number;
  partOfPackage: boolean;
  showTPU?: boolean;

  units: Concept[];

  medicationDeviceTypes?: Concept[];
  containerTypes: Concept[];
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
}
const ContainedProducts: FC<ContainedProductsProps> = ({
  packageIndex,
  partOfPackage,
  showTPU,
  units,
  control,
  register,
  productFields,
  productAppend,
  productRemove,
  productType,
  medicationDeviceTypes,
  containerTypes,

  branch,
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
  const [defaultUnit] = useState(getDefaultUnit(units));

  const ProductDetails = () => {
    return (
      <div key={'product-details'} style={{ minHeight: '50px' }}>
        <Grid container justifyContent="flex-end">
          <Stack direction="row" spacing={0} alignItems="center">
            <IconButton
              onClick={() => {
                append(defaultProduct(defaultUnit as Concept));
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
        />

        {(productFields ? productFields : packageProductFields).map(
          (containedProduct, index) => {
            return (
              <DetailedProduct
                index={index}
                units={units}
                expandedProducts={expandedProducts}
                setExpandedProducts={setExpandedProducts}
                containedProduct={containedProduct as MedicationProductQuantity}
                showTPU={showTPU}
                productsArray={productsArray}
                partOfPackage={partOfPackage}
                packageIndex={packageIndex}
                key={`product-${containedProduct.id}`}
                medicationDeviceTypes={medicationDeviceTypes}
                containerTypes={containerTypes}
                control={control}
                register={register}
                productRemove={
                  productRemove ? productRemove : packageProductRemove
                }
                productType={productType}
                branch={branch}
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
