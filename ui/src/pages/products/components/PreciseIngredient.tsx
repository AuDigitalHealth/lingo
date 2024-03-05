import React, { useEffect, useState } from 'react';
import { MedicationPackageDetails } from '../../../types/product.ts';

import { Concept } from '../../../types/concept.ts';

import { Control, UseFormGetValues } from 'react-hook-form';

import ProductAutoCompleteChild from './ProductAutoCompleteChild.tsx';

import { generateEclForMedication } from '../../../utils/helpers/EclUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import { isValidConcept } from '../../../utils/helpers/conceptUtils.ts';

interface PreciseIngredientProps {
  ingredientIndex: number;
  activeIngredientsArray: string;
  control: Control<MedicationPackageDetails>;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<MedicationPackageDetails>;
  selectedIngredient: Concept | null;
}
function PreciseIngredient(props: PreciseIngredientProps) {
  const {
    ingredientIndex,
    activeIngredientsArray,
    control,
    branch,
    fieldBindings,
    getValues,
    selectedIngredient,
  } = props;
  const [preciseIngredientWatched, setPreciseIngredientWatched] =
    useState<Concept | null>(null);
  const [ingredientSearchInputValue, setIngredientSearchInputValue] = useState(
    preciseIngredientWatched
      ? (preciseIngredientWatched.pt?.term as string)
      : '',
  );
  const [preciseIngredient, setPreciseIngredient] = useState<Concept[]>([]);
  const [ecl, setEcl] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const parentConcept = getValues(
    `${activeIngredientsArray}[${ingredientIndex}].activeIngredient` as 'containedProducts.0.productDetails.activeIngredients.0.activeIngredient',
  );

  const handleSelectedPreciseIngredient = (concept: Concept | null) => {
    setPreciseIngredientWatched(concept);
  };
  useEffect(() => {
    function fetchPreciseIngredients() {
      try {
        setIsLoading(true);
        if (
          isValidConcept(selectedIngredient) ||
          isValidConcept(parentConcept)
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
  }, [selectedIngredient]);

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
        handleChange={handleSelectedPreciseIngredient}
      />
    </>
  );
}
export default PreciseIngredient;
