import React, { useEffect, useState } from 'react';
import { MedicationPackageDetails } from '../../../types/product.ts';

import { Concept } from '../../../types/concept.ts';

import { Control, FieldError, FieldErrors, useWatch } from 'react-hook-form';

import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import ProductAutocompleteWithOpt from './ProductAutocompleteWithOpt.tsx';

interface BoSSProps {
  ingredientIndex: number;
  activeIngredientsArray: string;
  control: Control<MedicationPackageDetails>;
  branch: string;
  fieldBindings: FieldBindings;

  errors?: FieldErrors<MedicationPackageDetails>;
  packageIndex?: number;
  partOfPackage: boolean;
  containedProductIndex: number;
  datTestId: string;
}
function BoSS(props: BoSSProps) {
  const {
    ingredientIndex,
    activeIngredientsArray,
    control,
    branch,
    fieldBindings,
    packageIndex,
    partOfPackage,
    errors,
    containedProductIndex,
    datTestId,
  } = props;

  const activeIngredientSelected = useWatch({
    control,
    name: `${activeIngredientsArray}[${ingredientIndex}].activeIngredient` as 'containedProducts.0.productDetails.activeIngredients.0',
  }) as Concept;
  const bossWatched = useWatch({
    control,
    name: `${activeIngredientsArray}[${ingredientIndex}].preciseIngredient` as 'containedProducts.0.productDetails.activeIngredients.0.basisOfStrengthSubstance',
  }) as Concept;
  const [bossDisabled, setBossDisabled] = useState(
    bossWatched && bossWatched.conceptId ? false : true,
  );

  const bossError = partOfPackage
    ? (errors?.containedPackages?.[packageIndex as number]?.packageDetails
        ?.containedProducts?.[containedProductIndex]?.productDetails
        ?.activeIngredients?.[ingredientIndex]
        ?.basisOfStrengthSubstance as FieldError)
    : (errors?.containedProducts?.[containedProductIndex]?.productDetails
        ?.activeIngredients?.[ingredientIndex]
        ?.basisOfStrengthSubstance as FieldError);

  useEffect(() => {
    function fetchPreciseIngredients() {
      if (activeIngredientSelected && activeIngredientSelected.conceptId) {
        setBossDisabled(false);
      } else {
        setBossDisabled(true);
      }
    }
    fetchPreciseIngredients();
  }, [activeIngredientSelected]);

  return (
    <>
      <ProductAutocompleteWithOpt
        name={`${activeIngredientsArray}[${ingredientIndex}].basisOfStrengthSubstance`}
        control={control}
        disabled={bossDisabled}
        clearValue={bossDisabled}
        setDisabled={setBossDisabled}
        branch={branch}
        ecl={generateEclFromBinding(
          fieldBindings,
          'medicationProduct.activeIngredients.basisOfStrengthSubstance',
        )}
        error={bossError}
        dataTestId={datTestId}
      />
    </>
  );
}
export default BoSS;
