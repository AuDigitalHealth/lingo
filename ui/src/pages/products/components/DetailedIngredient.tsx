import React, { useState } from 'react';
import {
  Ingredient,
  MedicationPackageDetails,
} from '../../../types/product.ts';
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

import { Delete } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack } from '@mui/system';
import { Concept } from '../../../types/concept.ts';
import { InnerBox } from './style/ProductBoxes.tsx';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import {
  Control,
  UseFieldArrayRemove,
  UseFormRegister,
  useWatch,
} from 'react-hook-form';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import { isValidConceptName } from '../../../utils/helpers/conceptUtils.ts';
import PreciseIngredient from './PreciseIngredient.tsx';
import { nanoid } from 'nanoid';

interface DetailedIngredientProps {
  units: Concept[];
  activeIngredient: Ingredient;
  ingredientIndex: number;
  activeIngredientsArray: string;

  control: Control<MedicationPackageDetails>;
  register: UseFormRegister<MedicationPackageDetails>;
  ingredientRemove: UseFieldArrayRemove;
  expandedIngredients: string[];
  setExpandedIngredients: (value: string[]) => void;
  branch: string;
}
function DetailedIngredient(props: DetailedIngredientProps) {
  const {
    units,

    activeIngredientsArray,
    activeIngredient,
    ingredientIndex,
    control,
    register,
    ingredientRemove,
    expandedIngredients,
    setExpandedIngredients,
    branch,
  } = props;
  //const [number, setNumber] = React.useState("");

  const [disabled, setDisabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState(-1);
  const [deleteModalContent, setDeleteModalContent] = useState('');

  const handleDeleteIngredient = () => {
    ingredientRemove(indexToDelete);
    setDeleteModalOpen(false);
    setExpandedIngredients([]);
  };

  const getKey = (index: number) => {
    return `ing-${index}`;
  };

  const ingredientsAccordionClicked =
    (key: string) => (event: React.SyntheticEvent) => {
      event.stopPropagation();
      if (expandedIngredients.includes(key)) {
        const temp = expandedIngredients.filter(
          (value: string) => value !== key,
        );
        setExpandedIngredients(temp);
      } else {
        const temp = [...expandedIngredients, key];
        setExpandedIngredients(temp);
      }
    };

  return (
    <>
      <div>
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

        <div key={nanoid()}>
          <br />
          <Accordion
            style={{ border: 'none' }}
            key={getKey(ingredientIndex)}
            id={getKey(ingredientIndex)}
            expanded={expandedIngredients.includes(getKey(ingredientIndex))}
            onChange={ingredientsAccordionClicked(getKey(ingredientIndex))}
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
                      index={ingredientIndex}
                      activeIngredientsArray={activeIngredientsArray}
                      key={nanoid()}
                    />
                  </Grid>

                  <Grid container justifyContent="flex-end">
                    <IconButton
                      aria-label="delete"
                      size="small"
                      onClick={event => {
                        setIndexToDelete(ingredientIndex);
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
                <legend>Has Active Ingredient</legend>
                <ProductAutocomplete
                  optionValues={[]}
                  searchType={ConceptSearchType.ingredients}
                  name={`${activeIngredientsArray}[${ingredientIndex}].activeIngredient`}
                  control={control}
                  branch={branch}
                />
              </InnerBox>
              <InnerBox component="fieldset">
                <legend>Precise Ingredient</legend>

                <PreciseIngredient
                  branch={branch}
                  activeIngredientsArray={activeIngredientsArray}
                  ingredientIndex={ingredientIndex}
                  control={control}
                />
              </InnerBox>
              <InnerBox component="fieldset">
                <legend>BoSS</legend>
                <ProductAutocomplete
                  optionValues={[]}
                  searchType={ConceptSearchType.ingredients}
                  name={`${activeIngredientsArray}[${ingredientIndex}].basisOfStrengthSubstance`}
                  control={control}
                  // key={activeIngredient.id}
                  branch={branch}
                />
              </InnerBox>
              <InnerBox component="fieldset">
                <legend>Unit Strength</legend>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Grid item xs={4}>
                    <TextField
                      {...register(
                        `${activeIngredientsArray}[${ingredientIndex}].totalQuantity.value` as 'containedProducts.0.productDetails.activeIngredients.0.totalQuantity.value',
                      )}
                      // key={activeIngredient.id}
                      defaultValue={activeIngredient.totalQuantity?.value || ''}
                      fullWidth
                      variant="outlined"
                      margin="dense"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <ProductAutocomplete
                      optionValues={units}
                      searchType={ConceptSearchType.units}
                      name={`${activeIngredientsArray}[${ingredientIndex}].totalQuantity.unit`}
                      control={control}
                      branch={branch}
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
                        `${activeIngredientsArray}[${ingredientIndex}].concentrationStrength.value` as 'containedProducts.0.productDetails.activeIngredients.0.concentrationStrength.value',
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
                      searchType={ConceptSearchType.units}
                      name={`${activeIngredientsArray}[${ingredientIndex}].concentrationStrength.unit`}
                      control={control}
                      branch={branch}
                    />
                  </Grid>
                </Stack>
              </InnerBox>
            </AccordionDetails>
          </Accordion>
        </div>
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
export default DetailedIngredient;
