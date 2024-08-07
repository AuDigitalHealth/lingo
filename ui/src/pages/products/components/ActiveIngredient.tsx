import { Control, FieldError } from 'react-hook-form';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils';
import ProductAutocompleteV2 from './ProductAutocompleteV2';
import { FieldLabelRequired, InnerBox } from './style/ProductBoxes';
import { MedicationPackageDetails } from '../../../types/product';
import { FieldBindings } from '../../../types/FieldBindings';
import { Concept } from '../../../types/concept';
import { useState } from 'react';
import { Stack } from '@mui/system';
import { SetExtendedEclButton } from './SetExtendedEclButton';

interface ActiveIngredientProps {
  ingredientIndex: number;
  activeIngredientsArray: string;
  control: Control<MedicationPackageDetails>;
  branch: string;
  fieldBindings: FieldBindings;
  activeIngredientError: FieldError;
  handleSelectedIngredient: (concept: Concept | null) => void;
  containedProductIndex: number;
}

export default function ActiveIngredient({
  ingredientIndex,
  containedProductIndex,
  activeIngredientsArray,
  control,
  branch,
  fieldBindings,
  handleSelectedIngredient,
  activeIngredientError,
}: ActiveIngredientProps) {
  const [extendedEcl, setExtendedEcl] = useState(false);
  return (
    <InnerBox component="fieldset">
      <FieldLabelRequired>Has Active Ingredient</FieldLabelRequired>
      <Stack direction={'row'}>
        <ProductAutocompleteV2
          dataTestId={`product-${containedProductIndex}-ing-${ingredientIndex}-active-ing`}
          name={`${activeIngredientsArray}[${ingredientIndex}].activeIngredient`}
          control={control}
          branch={branch}
          ecl={generateEclFromBinding(
            fieldBindings,
            extendedEcl
              ? 'medicationProduct.activeIngredients.activeIngredient_extended'
              : 'medicationProduct.activeIngredients.activeIngredient',
          )}
          error={activeIngredientError}
          handleChange={handleSelectedIngredient}
        />
        <SetExtendedEclButton
          extendedEcl={extendedEcl}
          setExtendedEcl={setExtendedEcl}
        />
      </Stack>
    </InnerBox>
  );
}
