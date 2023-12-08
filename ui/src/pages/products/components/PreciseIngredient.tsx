import React, { useEffect, useState } from 'react';
import { MedicationPackageDetails } from '../../../types/product.ts';

import { Concept } from '../../../types/concept.ts';

import { Control, useWatch } from 'react-hook-form';

import { findConceptUsingPT } from '../../../utils/helpers/conceptUtils.ts';
import ConceptService from '../../../api/ConceptService.ts';
import ProductAutoCompleteChild from './ProductAutoCompleteChild.tsx';

interface PreciseIngredientProps {
  ingredientIndex: number;
  activeIngredientsArray: string;
  control: Control<MedicationPackageDetails>;
  branch: string;
}
function PreciseIngredient(props: PreciseIngredientProps) {
  const { ingredientIndex, activeIngredientsArray, control, branch } = props;

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
    preciseIngredientWatched ? preciseIngredientWatched.pt.term : '',
  );

  const [ecl, setEcl] = useState(
    activeIngredientSelected
      ? `< ${activeIngredientSelected.conceptId}`
      : undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    async function fetchPreciseIngredients() {
      try {
        setIsLoading(true);
        setPreciseIngredient([]);

        if (
          activeIngredientSelected != null &&
          activeIngredientSelected.conceptId
        ) {
          const conceptId = activeIngredientSelected.conceptId.trim();
          const ecl = `< ${conceptId} OR (< 410942007 : 738774007 = ${conceptId}) OR (< 410942007 : 738774007 =(< 410942007 : 738774007 = ${conceptId}))`;
          const concepts = await ConceptService.searchConceptByEcl(ecl, branch);
          setPreciseIngredient(concepts);

          setEcl(ecl);
          if (
            findConceptUsingPT(ingredientSearchInputValue, concepts) === null
          ) {
            setIngredientSearchInputValue('');
          }
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
    void fetchPreciseIngredients().then(r => r);
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
      />
    </>
  );
}
export default PreciseIngredient;
