import React, { useEffect, useState } from 'react';
import { MedicationPackageDetails } from '../../../types/product.ts';

import { Concept } from '../../../types/concept.ts';

import { Control, UseFormGetValues, useWatch } from 'react-hook-form';

import ProductAutoCompleteChild from './ProductAutoCompleteChild.tsx';

import { generateEclForMedication } from '../../../utils/helpers/EclUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';

interface PreciseIngredientProps {
  ingredientIndex: number;
  activeIngredientsArray: string;
  control: Control<MedicationPackageDetails>;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<MedicationPackageDetails>;
}
function PreciseIngredient(props: PreciseIngredientProps) {
  const {
    ingredientIndex,
    activeIngredientsArray,
    control,
    branch,
    fieldBindings,
    getValues,
  } = props;

  const [preciseIngredient, setPreciseIngredient] = useState<Concept[]>([]);
  const activeIngredientSelected = useWatch({
    control,
    name: `${activeIngredientsArray}[${ingredientIndex}].activeIngredient` as 'containedProducts.0.productDetails.activeIngredients.0',
  }) as Concept;
  const preciseIngredientWatched = useWatch({
    control,
    name: `${activeIngredientsArray}[${ingredientIndex}].preciseIngredient` as 'containedProducts.0.productDetails.activeIngredients.0.preciseIngredient',
  }) as Concept;
  const [ingredientSearchInputValue, setIngredientSearchInputValue] = useState(
    preciseIngredientWatched
      ? (preciseIngredientWatched.pt?.term as string)
      : '',
  );

  const [ecl, setEcl] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    function fetchPreciseIngredients() {
      try {
        setIsLoading(true);

        if (
          activeIngredientSelected != null &&
          activeIngredientSelected.conceptId
        ) {
          const fieldEclGenerated = generateEclForMedication(
            fieldBindings,
            'medicationProduct.activeIngredients.preciseIngredient',
            ingredientIndex,
            activeIngredientsArray,
            getValues,
          );
          setEcl(fieldEclGenerated.generatedEcl);
        } else {
          setIngredientSearchInputValue('');
          setEcl(undefined);
          setPreciseIngredient([]);
        }
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    }
    fetchPreciseIngredients();
  }, [activeIngredientSelected]);

  return (
    <>
      <ProductAutoCompleteChild
        optionValues={preciseIngredient}
        name={`${activeIngredientsArray}[${ingredientIndex}].preciseIngredient`}
        control={control}
        inputValue={ingredientSearchInputValue}
        setInputValue={setIngredientSearchInputValue}
        ecl={ecl}
        branch={branch}
        isLoading={isLoading}
        showDefaultOptions={true}
      />
    </>
  );
}
export default PreciseIngredient;
