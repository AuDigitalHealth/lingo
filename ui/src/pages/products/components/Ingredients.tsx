import { Field, FieldArrayRenderProps, useFormikContext } from 'formik';
import React, { FC, useState } from 'react';
import {
  Ingredient,
  MedicationPackageDetails,
} from '../../../types/authoring.ts';
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
import {
  addOrRemoveFromArray,
  ingredientsExpandedStored,
  storeIngredientsExpanded,
} from '../../../utils/helpers/conceptUtils.ts';
import { AddCircle, Delete } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack } from '@mui/system';
import { Concept } from '../../../types/concept.ts';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import { InnerBox } from './style/ProductBoxes.tsx';

interface IngredientsProps {
  packageIndex?: number;
  containedProductIndex: number;
  partOfPackage: boolean;
  arrayHelpers: FieldArrayRenderProps;
  units: Concept[];
  ingredients: Concept[];
}
const Ingredients: FC<IngredientsProps> = ({
  containedProductIndex,
  packageIndex,
  partOfPackage,
  arrayHelpers,
  units,
  ingredients,
}) => {
  //const [number, setNumber] = React.useState("");
  const { values } = useFormikContext<MedicationPackageDetails>();
  const [expandedIngredients, setExpandedIngredients] = useState<string[]>(
    ingredientsExpandedStored,
  );

  let activeIngredients: Ingredient[] = [];

  activeIngredients = partOfPackage
    ? (values.containedPackages[packageIndex as number].packageDetails
        .containedProducts[containedProductIndex].productDetails
        ?.activeIngredients as Ingredient[])
    : (values.containedProducts[containedProductIndex].productDetails
        ?.activeIngredients as Ingredient[]);

  const activeIngredientsArray = partOfPackage
    ? `containedPackages[${packageIndex}].packageDetails.containedProducts[${containedProductIndex}].productDetails.activeIngredients`
    : `containedProducts[${containedProductIndex}].productDetails.activeIngredients`;
  const getKey = (index: number) => {
    return `ingredient-key-${index}`;
  };

  const ingredientsAccordionClicked = (key: string) => {
    setExpandedIngredients(addOrRemoveFromArray(expandedIngredients, key));
    storeIngredientsExpanded(expandedIngredients);
  };

  return (
    <>
      <div>
        <Grid container justifyContent="flex-end">
          <IconButton
            onClick={() => {
              storeIngredientsExpanded([]);
              const ingredient: Ingredient = {};
              arrayHelpers.push(ingredient);
            }}
            aria-label="create"
            size="large"
          >
            <Tooltip title={'Add new Ingredient'}>
              <AddCircle fontSize="inherit" />
            </Tooltip>
          </IconButton>
        </Grid>

        {activeIngredients.map(
          (activeIngredient: Ingredient, index: number) => (
            <div key={getKey(index)}>
              <br />
              <Accordion
                style={{ border: 'none' }}
                key={getKey(index)}
                onChange={() => ingredientsAccordionClicked(getKey(index))}
                defaultExpanded={expandedIngredients.includes(getKey(index))}
                // defaultExpanded={false}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel2a-content"
                  id="panel2a-header"
                >
                  <Grid xs={40} item={true}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Grid item xs={10}>
                        <Typography
                          sx={{
                            color: !activeIngredient.activeIngredient
                              ? 'red'
                              : 'inherit',
                          }}
                        >
                          {activeIngredient.activeIngredient
                            ? activeIngredient.activeIngredient?.pt.term
                            : 'Untitled*'}
                        </Typography>
                      </Grid>
                      <Grid container justifyContent="flex-end">
                        <Stack direction="row" spacing={0} alignItems="center">
                          <IconButton
                            aria-label="delete"
                            size="small"
                            onClick={() => arrayHelpers.remove(index)}
                            color="error"
                            sx={{ mt: 0.25 }}
                          >
                            <Tooltip title={'Delete Ingredient'}>
                              <Delete />
                            </Tooltip>
                          </IconButton>
                        </Stack>
                      </Grid>
                    </Stack>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  <InnerBox component="fieldset">
                    <legend>Intended Active Ingredient</legend>

                    <Field
                      name={`${activeIngredientsArray}[${index}].activeIngredient`}
                      id={`${activeIngredientsArray}[${index}].activeIngredient`}
                      optionValues={ingredients}
                      getOptionLabel={(option: Concept) => option.pt.term}
                      component={ProductAutocomplete}
                      fullWidth
                      variant="outlined"
                      margin="dense"
                      required
                      disableClearable={true}
                    />
                  </InnerBox>
                  <InnerBox component="fieldset">
                    <legend>BoSS</legend>
                    <Field
                      name={`${activeIngredientsArray}[${index}].basisOfStrengthSubstance`}
                      id={`${activeIngredientsArray}[${index}].basisOfStrengthSubstance`}
                      optionValues={ingredients}
                      getOptionLabel={(option: Concept) => option.pt.term}
                      component={ProductAutocomplete}
                      fullWidth
                      variant="outlined"
                      margin="dense"
                      required
                    />
                  </InnerBox>
                  <InnerBox component="fieldset">
                    <legend>Strength</legend>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <Grid item xs={4}>
                        <Field
                          as={TextField}
                          //name={`containedProducts[${index}].activeIngredients[${ingIndex}].activeIngredient.conceptId`}
                          name={`${activeIngredientsArray}[${index}].totalQuantity.value`}
                          value={activeIngredient.totalQuantity?.value || ''}
                          fullWidth
                          variant="outlined"
                          margin="dense"
                          required
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Field
                          id={`${activeIngredientsArray}[${index}].totalQuantity.unit`}
                          name={`${activeIngredientsArray}[${index}].totalQuantity.unit`}
                          optionValues={units}
                          getOptionLabel={(option: Concept) => option.pt.term}
                          component={ProductAutocomplete}
                          required
                        />
                      </Grid>
                    </Stack>
                  </InnerBox>

                  <InnerBox component="fieldset">
                    <legend>Concentration Strength</legend>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <Grid item xs={4}>
                        <Field
                          as={TextField}
                          //name={`containedProducts[${index}].activeIngredients[${ingIndex}].activeIngredient.conceptId`}
                          name={`${activeIngredientsArray}[${index}].concentrationStrength.value`}
                          value={
                            activeIngredient.concentrationStrength?.value || ''
                          }
                          fullWidth
                          variant="outlined"
                          margin="dense"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Field
                          id={`${activeIngredientsArray}[${index}].concentrationStrength.unit`}
                          name={`${activeIngredientsArray}[${index}].concentrationStrength.unit`}
                          optionValues={units}
                          getOptionLabel={(option: Concept) => option.pt.term}
                          component={ProductAutocomplete}
                        />
                      </Grid>
                    </Stack>
                  </InnerBox>
                </AccordionDetails>
              </Accordion>
            </div>
          ),
        )}
      </div>
    </>
  );
};
export default Ingredients;
