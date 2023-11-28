import React, { useState } from 'react';
import {
  Ingredient,
  MedicationPackageDetails,
} from '../../../types/product.ts';
import { Grid, IconButton, Tooltip } from '@mui/material';

import { AddCircle } from '@mui/icons-material';
import { Concept } from '../../../types/concept.ts';

import { Control, useFieldArray, UseFormRegister } from 'react-hook-form';
import {
  defaultIngredient,
  getDefaultUnit,
  ingredientsExpandedStored,
} from '../../../utils/helpers/conceptUtils.ts';
import DetailedIngredient from './DetailedIngredient.tsx';

interface IngredientsProps {
  packageIndex?: number;
  containedProductIndex: number;
  partOfPackage: boolean;
  units: Concept[];
  ingredients: Concept[];
  control: Control<MedicationPackageDetails>;
  register: UseFormRegister<MedicationPackageDetails>;
  branch: string;
}
function Ingredients(props: IngredientsProps) {
  const {
    containedProductIndex,
    packageIndex,
    partOfPackage,
    units,
    ingredients,
    control,
    register,
    branch,
  } = props;
  //const [number, setNumber] = React.useState("");
  const [expandedIngredients, setExpandedIngredients] = useState<string[]>(
    ingredientsExpandedStored,
  );
  const activeIngredientsArray = partOfPackage
    ? `containedPackages[${packageIndex}].packageDetails.containedProducts[${containedProductIndex}].productDetails.activeIngredients`
    : `containedProducts[${containedProductIndex}].productDetails.activeIngredients`;
  const {
    fields: ingredientFields,
    append: ingredientAppend,
    remove: ingredientRemove,
  } = useFieldArray({
    control,
    name: partOfPackage
      ? (`containedPackages[${packageIndex}].packageDetails.containedProducts[${containedProductIndex}].productDetails.activeIngredients` as 'containedProducts.0.productDetails.activeIngredients')
      : (`containedProducts[${containedProductIndex}].productDetails.activeIngredients` as 'containedProducts.0.productDetails.activeIngredients'),
  });
  const [defaultUnit] = useState(getDefaultUnit(units));

  return (
    <>
      <div key={`ingredients-${containedProductIndex}`}>
        <Grid container justifyContent="flex-end">
          <IconButton
            onClick={() => {
              ingredientAppend(defaultIngredient(defaultUnit as Concept));
            }}
            aria-label="create"
            size="large"
          >
            <Tooltip title={'Add new Ingredient'}>
              <AddCircle fontSize="inherit" />
            </Tooltip>
          </IconButton>
        </Grid>

        {ingredientFields.map((activeIngredient, index) => {
          return (
            <DetailedIngredient
              expandedIngredients={expandedIngredients}
              setExpandedIngredients={setExpandedIngredients}
              units={units}
              activeIngredient={activeIngredient as Ingredient}
              ingredientIndex={index}
              ingredients={ingredients}
              control={control}
              register={register}
              branch={branch}
              ingredientRemove={ingredientRemove}
              activeIngredientsArray={activeIngredientsArray}
              key={activeIngredient.id}
            />
          );
        })}
      </div>
    </>
  );
}

export default Ingredients;
