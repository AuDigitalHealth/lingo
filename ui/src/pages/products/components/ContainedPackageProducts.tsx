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
  UseFormSetValue,
} from 'react-hook-form';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import ContainedProducts from './ContainedProducts.tsx';

interface ContainedPackageProductsProps {
  packageIndex?: number;
  showTPU?: boolean;
  control: Control<MedicationPackageDetails>;
  register: UseFormRegister<MedicationPackageDetails>;
  productType: ProductType;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<MedicationPackageDetails>;
  defaultUnit: Concept;
  errors?: FieldErrors<MedicationPackageDetails>;
  expandedProducts: string[];
  setExpandedProducts: (value: string[]) => void;
  setValue: UseFormSetValue<MedicationPackageDetails>;
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
  setValue,
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
      setValue={setValue}
    />
  );
};

export default ContainedPackageProducts;
