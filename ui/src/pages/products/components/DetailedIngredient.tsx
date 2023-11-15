import React, { useEffect, useState } from 'react';
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
import {
  isValidConceptName,
  storeIngredientsExpanded,
} from '../../../utils/helpers/conceptUtils.ts';
import ConceptService from '../../../api/ConceptService.ts';
import ProductAutoCompleteParent from './ProductAutoCompleteParent.tsx';
import ProductAutoCompleteChild from './ProductAutoCompleteChild.tsx';

interface DetailedIngredientProps {
  units: Concept[];
  activeIngredient: Ingredient;
  ingredientIndex: number;
  activeIngredientsArray: string;
  ingredients: Concept[];
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
    ingredients,
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

  const [preciseIngredient, setPreciseIngredient] = useState<Concept[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Concept | null>(
    activeIngredient.activeIngredient
      ? activeIngredient.activeIngredient
      : null,
  );
  const [ingredientSearchInputValue, setIngredientSearchInputValue] =
    useState('');
  const [ecl, setEcl] = useState(
    selectedIngredient ? `< ${selectedIngredient.conceptId}` : undefined,
  );
  useEffect(() => {
    async function fetchPreciseIngredients() {
      setPreciseIngredient([]);
      try {
        // alert(selectedDoseForm);

        if (selectedIngredient != null && selectedIngredient.conceptId) {
          const conceptId = selectedIngredient.conceptId.trim();
          const ecl = `< ${conceptId} OR (< 410942007 : 738774007 = ${conceptId}) OR (< 410942007 : 738774007 =(< 410942007 : 738774007 = ${conceptId}))`;
          const concepts = await ConceptService.searchConceptByEcl(ecl, branch);
          setPreciseIngredient(concepts);
          setEcl(ecl);
        } else {
          setIngredientSearchInputValue('');
          setEcl(undefined);
        }
      } catch (error) {
        console.log(error);
      }
    }
    void fetchPreciseIngredients().then(r => r);
  }, [selectedIngredient]);

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

        <div key={getKey(ingredientIndex)}>
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
                <ProductAutoCompleteParent
                  optionValues={ingredients}
                  searchType={ConceptSearchType.ingredients}
                  name={`${activeIngredientsArray}[${ingredientIndex}].activeIngredient`}
                  control={control}
                  setval={setSelectedIngredient}
                  branch={branch}
                />
              </InnerBox>
              <InnerBox component="fieldset">
                <legend>Precise Ingredient</legend>

                <ProductAutoCompleteChild
                  optionValues={preciseIngredient}
                  name={`${activeIngredientsArray}[${ingredientIndex}].preciseIngredient`}
                  control={control}
                  inputValue={ingredientSearchInputValue}
                  setInputValue={setIngredientSearchInputValue}
                  ecl={ecl}
                  branch={branch}
                />
              </InnerBox>
              <InnerBox component="fieldset">
                <legend>BoSS</legend>
                <ProductAutocomplete
                  optionValues={ingredients}
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
