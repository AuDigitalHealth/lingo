import React, { useEffect, useState } from 'react';
import { MedicationPackageDetails } from '../../../types/product.ts';

import { Concept } from '../../../types/concept.ts';

import {
  Control,
  UseFormGetValues,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { generateEclForMedication } from '../../../utils/helpers/EclUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import { isValidConcept } from '../../../utils/helpers/conceptUtils.ts';
import { showError } from '../../../types/ErrorHandler.ts';
import ProductAutocompleteWithOpt from './ProductAutocompleteWithOpt.tsx';

interface PreciseIngredientProps {
  ingredientIndex: number;
  activeIngredientsArray: string;
  control: Control<MedicationPackageDetails>;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<MedicationPackageDetails>;
  selectedIngredient: Concept | null;
  setselectedIngredient: (concept: Concept | null) => void;
  setValue: UseFormSetValue<any>;
  dataTestId: string;
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
    setValue,
    setselectedIngredient,
    dataTestId,
  } = props;

  // const [preciseIngredientWatched, setPreciseIngredientWatched] =
  //     useState<Concept | null|undefined>(getValues(
  //         `${activeIngredientsArray}[${ingredientIndex}].preciseIngredient` as 'containedProducts.0.productDetails.activeIngredients.0.preciseIngredient',
  //     ));

  const [ecl, setEcl] = useState<string>();
  const parentConcept = useWatch({
    control,
    name: `${activeIngredientsArray}[${ingredientIndex}].activeIngredient` as 'containedProducts.0.productDetails.activeIngredients.0.activeIngredient',
  });
  const [optionDisabled, setOptionDisabled] = useState(
    parentConcept && parentConcept.conceptId ? false : true,
  );

  useEffect(() => {
    function fetchPreciseIngredients() {
      if (!parentConcept) {
        // setPreciseIngredientWatched(null);
        setOptionDisabled(true);
        setEcl(undefined);
      }

      try {
        if (
          isValidConcept(selectedIngredient) ||
          isValidConcept(parentConcept)
        ) {
          if (selectedIngredient) {
            setValue(
              `${activeIngredientsArray}[${ingredientIndex}].preciseIngredient`,
              null,
              { shouldDirty: false },
            );
          }
          const fieldEclGenerated = generateEclForMedication(
            fieldBindings,
            'medicationProduct.activeIngredients.preciseIngredient',
            ingredientIndex,
            activeIngredientsArray,
            getValues,
          );
          setEcl(fieldEclGenerated.generatedEcl);
        } else {
          setEcl(undefined);
        }
      } catch (error) {
        showError('Field binding error');
      }
    }
    fetchPreciseIngredients();
  }, [parentConcept, selectedIngredient, setselectedIngredient]);

  return (
    <>
      <ProductAutocompleteWithOpt
        optionValues={[]}
        name={`${activeIngredientsArray}[${ingredientIndex}].preciseIngredient`}
        control={control}
        ecl={ecl}
        branch={branch}
        showDefaultOptions={true}
        disabled={optionDisabled}
        setDisabled={setOptionDisabled}
        clearValue={optionDisabled}
        dataTestId={dataTestId}
      />
    </>
  );
}
export default PreciseIngredient;
