import React, { useState } from 'react';
import { MedicationPackageDetails } from '../../../types/authoring.ts';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { AddCircle, Delete } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack } from '@mui/system';
import { Concept } from '../../../types/concept.ts';
import { InnerBox } from './style/ProductBoxes.tsx';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import {
  Control,
  useFieldArray,
  UseFormRegister,
  useWatch,
} from 'react-hook-form';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import {
  defaultIngredient,
  getDefaultUnit,
  ingredientsExpandedStored,
  isValidConceptName,
  storeIngredientsExpanded,
} from '../../../utils/helpers/conceptUtils.ts';

interface IngredientsProps {
  packageIndex?: number;
  containedProductIndex: number;
  partOfPackage: boolean;
  units: Concept[];
  ingredients: Concept[];
  control: Control<MedicationPackageDetails>;
  register: UseFormRegister<MedicationPackageDetails>;
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
  } = props;
  //const [number, setNumber] = React.useState("");
  const [expandedIngredients, setExpandedIngredients] = useState<string[]>(
    ingredientsExpandedStored,
  );

  const [disabled, setDisabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | undefined>();
  const [deleteModalContent, setDeleteModalContent] = useState('');

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

  const handleDeleteIngredient = () => {
    if (indexToDelete !== undefined) {
      ingredientRemove(indexToDelete);
    }
    setDeleteModalOpen(false);
    setIndexToDelete(undefined);
    setExpandedIngredients([]);
    storeIngredientsExpanded([]);
  };

  const getKey = (index: number) => {
    return `ing-${index}`;
  };

  const ingredientsAccordionClicked =
    (key: string) => (event: React.SyntheticEvent) => {
      if (expandedIngredients.includes(key)) {
        const temp = expandedIngredients.filter(
          (value: string) => value !== key,
        );
        storeIngredientsExpanded(temp);
        setExpandedIngredients(temp);
      } else {
        const temp = [...expandedIngredients, key];
        storeIngredientsExpanded(temp);
        setExpandedIngredients(temp);
      }
    };

  return (
    <>
      <div>
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
        <ConfirmationModal
          open={deleteModalOpen}
          content={deleteModalContent}
          handleClose={() => {
            setDeleteModalOpen(false);
          }}
          title={'Confirm Delete Ingredient'}
          disabled={disabled}
          action={'Delete'}
          handleAction={handleDeleteIngredient}
        />

        {ingredientFields.map((activeIngredient, index) => {
          return (
            <div key={getKey(index)}>
              <br />
              <Accordion
                style={{ border: 'none' }}
                key={getKey(index)}
                id={getKey(index)}
                expanded={expandedIngredients.includes(getKey(index))}
                onChange={ingredientsAccordionClicked(getKey(index))}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel2a-content"
                  id="panel2a-header"
                >
                  <Grid xs={40} item={true}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Grid item xs={10}>
                        <IngredientNameWatched
                          control={control}
                          index={index}
                          activeIngredientsArray={activeIngredientsArray}
                        />
                      </Grid>

                      <Grid container justifyContent="flex-end">
                        <IconButton
                          aria-label="delete"
                          size="small"
                          onClick={event => {
                            setIndexToDelete(index);
                            setDeleteModalContent(
                              `Remove the ingredient "${
                                isValidConceptName(
                                  activeIngredient.activeIngredient as Concept,
                                )
                                  ? activeIngredient.activeIngredient?.pt.term
                                  : 'Untitled'
                              }" ?`,
                            );
                            setDeleteModalOpen(true);
                            event.stopPropagation();
                          }}
                          color="error"
                          sx={{ mt: 0.25 }}
                        >
                          <Tooltip title={'Delete Ingredient'}>
                            <Delete />
                          </Tooltip>
                        </IconButton>
                      </Grid>
                    </Stack>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  <InnerBox component="fieldset">
                    <legend>Intended Active Ingredient</legend>
                    <ProductAutocomplete
                      optionValues={ingredients}
                      searchType={ConceptSearchType.ingredients}
                      name={`${activeIngredientsArray}[${index}].activeIngredient`}
                      control={control}
                      key={activeIngredient.id}
                    />
                  </InnerBox>
                  <InnerBox component="fieldset">
                    <legend>BoSS</legend>
                    <ProductAutocomplete
                      optionValues={ingredients}
                      searchType={ConceptSearchType.ingredients}
                      name={`${activeIngredientsArray}[${index}].basisOfStrengthSubstance`}
                      control={control}
                      key={activeIngredient.id}
                    />
                  </InnerBox>
                  <InnerBox component="fieldset">
                    <legend>Strength</legend>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <Grid item xs={4}>
                        <TextField
                          {...register(
                            `${activeIngredientsArray}[${index}].totalQuantity.value` as 'containedProducts.0.productDetails.activeIngredients.0.totalQuantity.value',
                          )}
                          key={activeIngredient.id}
                          defaultValue={
                            activeIngredient.totalQuantity?.value || ''
                          }
                          fullWidth
                          variant="outlined"
                          margin="dense"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <ProductAutocomplete
                          optionValues={units}
                          searchType={ConceptSearchType.ingredients}
                          name={`${activeIngredientsArray}[${index}].totalQuantity.unit`}
                          control={control}
                        />
                      </Grid>
                    </Stack>
                  </InnerBox>

                  <InnerBox component="fieldset">
                    <legend>Concentration Strength</legend>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <Grid item xs={4}>
                        <TextField
                          {...register(
                            `${activeIngredientsArray}[${index}].concentrationStrength.value` as 'containedProducts.0.productDetails.activeIngredients.0.concentrationStrength.value',
                          )}
                          fullWidth
                          variant="outlined"
                          margin="dense"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <ProductAutocomplete
                          optionValues={units}
                          searchType={ConceptSearchType.ingredients}
                          name={`${activeIngredientsArray}[${index}].concentrationStrength.unit`}
                          control={control}
                        />
                      </Grid>
                    </Stack>
                  </InnerBox>
                </AccordionDetails>
              </Accordion>
            </div>
          );
        })}
        {/*<pre>{JSON.stringify(ingredientFields, null, 2)}</pre>*/}
      </div>
    </>
  );
}
function IngredientNameWatched({
  control,
  index,
  activeIngredientsArray,
}: {
  control: Control<MedicationPackageDetails>;
  index: number;
  activeIngredientsArray: string;
}) {
  const ingredientName = useWatch({
    control,
    name: `${activeIngredientsArray}[${index}].activeIngredient` as 'containedProducts.0.productDetails.activeIngredients.0',
  }) as Concept;

  return (
    <Typography
      sx={{
        color: !isValidConceptName(ingredientName) ? 'red' : 'inherit',
      }}
    >
      {isValidConceptName(ingredientName)
        ? ingredientName.pt.term
        : 'Untitled*'}
    </Typography>
  );
}
export default Ingredients;
