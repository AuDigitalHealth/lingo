import React, { FC } from 'react';
import {
  MedicationPackageDetails,
  ProductType,
} from '../../../types/product.ts';
import { Concept } from '../../../types/concept.ts';
import {
  Control,
  FieldErrors,
  useFieldArray,
  UseFormGetValues,
  UseFormRegister,
} from 'react-hook-form';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import ContainedProducts from './ContainedProducts.tsx';

interface ContainedPackageProductsProps {
  packageIndex?: number;

  showTPU?: boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  productType: ProductType;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<any>;
  defaultUnit: Concept;
  errors?: FieldErrors<MedicationPackageDetails>;
  expandedProducts: string[];
  setExpandedProducts: (value: string[]) => void;
}
const ContainedPackageProducts: FC<ContainedPackageProductsProps> = ({
  packageIndex,
  showTPU,

  control,
  register,

  productType,
  defaultUnit,

  branch,
  fieldBindings,
  getValues,
  errors,
  expandedProducts,
  setExpandedProducts,
}) => {
  const productsArray = `containedPackages[${packageIndex}].packageDetails.containedProducts`;

  const {
    fields: packageProductFields,
    append: packageProductAppend,
    remove: packageProductRemove,
  } = useFieldArray({
    control,
    name: `containedPackages[${packageIndex}.packageDetails.containedProducts` as 'containedProducts',
  });

  return (
    <ContainedProducts
      showTPU={showTPU}
      partOfPackage={true}
      packageIndex={packageIndex}
      control={control}
      register={register}
      productType={productType}
      branch={branch}
      fieldBindings={fieldBindings}
      getValues={getValues}
      defaultUnit={defaultUnit}
      errors={errors}
      packageProductFields={packageProductFields}
      packageProductRemove={packageProductRemove}
      packageProductAppend={packageProductAppend}
      productsArray={productsArray}
      expandedProducts={expandedProducts}
      setExpandedProducts={setExpandedProducts}
    />
  );
};

export default ContainedPackageProducts;
