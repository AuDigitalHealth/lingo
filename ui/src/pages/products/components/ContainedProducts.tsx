import React, { FC, useState } from 'react';
import {
  MedicationPackageDetails,
  MedicationProductQuantity,
} from '../../../types/authoring.ts';
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
  doseForms: Concept[];
  brandProducts: Concept[];
  ingredients: Concept[];
  control: Control<MedicationPackageDetails>;
  register: UseFormRegister<MedicationPackageDetails>;
  productFields?: FieldArrayWithId<
    MedicationPackageDetails,
    'containedProducts',
    'id'
  >[];
  productAppend?: UseFieldArrayAppend<
    MedicationPackageDetails,
    'containedProducts'
  >;
  productRemove?: UseFieldArrayRemove;
}
const ContainedProducts: FC<ContainedProductsProps> = ({
  packageIndex,
  partOfPackage,
  showTPU,
  units,
  doseForms,
  brandProducts,
  ingredients,
  control,
  register,
  productFields,
  productAppend,
  productRemove,
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
  const append = (value: MedicationProductQuantity) => {
    if (productAppend) {
      productAppend(value);
    } else {
      packageProductAppend(value);
    }
  };
  const [defaultUnit] = useState(getDefaultUnit(units));

  const ProductDetails = () => {
    return (
      <div key={'product-details'}>
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
                doseForms={doseForms}
                brandProducts={brandProducts}
                ingredients={ingredients}
                control={control}
                register={register}
                productRemove={
                  productRemove ? productRemove : packageProductRemove
                }
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
