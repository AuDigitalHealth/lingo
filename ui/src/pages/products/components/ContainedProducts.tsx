import { Field, FieldArray, useFormikContext } from 'formik';
import { MedicationPackageDetails } from '../../../types/authoring.ts';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Concept } from '../../../types/concept.ts';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import { Stack } from '@mui/system';
import { experimentalStyled as styled, useTheme } from '@mui/material/styles';
import React, { FC, useState, useEffect } from 'react';
import Ingredients from './Ingredients.tsx';
import conceptService from '../../../api/ConceptService.ts';

interface ContainedProductsProps {
  packageIndex?: number;
  partOfPackage: boolean;
  showTPU: boolean;
  ingredients: Concept[];
  units: Concept[];
  brandProducts: Concept[];
  doseForms: Concept[];
}
const ContainedProducts: FC<ContainedProductsProps> = ({
  packageIndex,
  partOfPackage,
  showTPU,
  units,
  brandProducts,
  doseForms,
  ingredients,
}) => {
  //const [name, setName] = React.useState("");
  const { values } = useFormikContext<MedicationPackageDetails>();

  const containedProducts = partOfPackage
    ? values.containedPackages[packageIndex as number].packageDetails
        .containedProducts
    : values.containedProducts;
  const productsArray = partOfPackage
    ? `containedPackages[${packageIndex}].packageDetails.containedProducts`
    : 'containedProducts';

  const [specialFormDoses, setSpecialFormDoses] = useState<Concept[]>([]);
  const [selectedDoseForm, setSelectedDoseForm] = useState<Concept>();
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);

  const productAccordionClicked = (key: string) => {
    if (expandedProducts.includes(key)) {
      setExpandedProducts(
        expandedProducts.filter((value: string) => value !== key),
      );
    } else {
      setExpandedProducts([...expandedProducts, key]);
    }
  };
  const productKey = (index: number) => {
    return `product-key-${index}`;
  };
  const theme = useTheme();

  const OuterBox = styled(Box)({
    border: `1px solid ${theme.palette.divider}`,
    color: 'green',
    fontWeight: 'bold',
    fontSize: 'medium',
    marginBottom: '15px',
  });
  const InnerBox = styled(Box)({
    border: '0 solid #f0f0f0',
    color: '#003665',
    marginTop: '10px',
    marginBottom: '10px',
    fontSize: 'small',
  });

  const ProductBox = styled(Box)({
    border: `1px solid ${theme.palette.divider}`,
    color: '#CD7F32',
    fontWeight: 'bold',
    fontSize: 'large',
  });

  useEffect(() => {
    async function fetchSpecialFormDoses() {
      setSpecialFormDoses([]);
      try {
        let concepts: Concept[] = [];
        if (selectedDoseForm) {
          const conceptId = selectedDoseForm.conceptId.trim();
          const ecl = '<' + conceptId;

          concepts = await conceptService.searchConceptByEcl(ecl);
          setSpecialFormDoses(concepts);
        }
      } catch (error) {
        console.log(error);
      }
    }
    void fetchSpecialFormDoses().then(r => r);
  }, [selectedDoseForm]);

  return (
    <>
      {/*<input type="text" value={name} onChange={handleChange} />*/}
      {/*<button type="button" onClick={handleAddPerson}>*/}
      {/*  add person*/}
      {/*</button>*/}
      <ProductBox component="fieldset">
        <legend>Contained Products</legend>
        {containedProducts.map((containedProduct, index) => (
          <div key={containedProduct.productDetails.productName.conceptId}>
            <br />
            <Accordion
              key={productKey(index)}
              style={{ border: 'none' }}
              onChange={() => productAccordionClicked(productKey(index))}
              expanded={expandedProducts.includes(productKey(index))}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                //aria-expanded={true}

                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Grid xs={40} item={true}>
                  <Typography>
                    {containedProduct.productDetails.productName.pt.term}
                  </Typography>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <Grid
                  container
                  rowSpacing={1}
                  columnSpacing={{ xs: 1, sm: 2, md: 3 }}
                >
                  <Grid xs={6} key={'left'} item={true}>
                    {showTPU ? (
                      <OuterBox component="fieldset">
                        <legend>Product Details</legend>
                        <InnerBox component="fieldset">
                          <legend>Brand Name</legend>
                          <Field
                            name={`${productsArray}[${index}].productDetails.productName`}
                            id={`${productsArray}[${index}].productDetails.productName`}
                            optionValues={brandProducts}
                            getOptionLabel={(option: Concept) => option.pt.term}
                            component={ProductAutocomplete}
                            fullWidth
                            variant="outlined"
                            margin="dense"
                            disableClearable={true}
                          />
                        </InnerBox>
                      </OuterBox>
                    ) : (
                      <div></div>
                    )}

                    <OuterBox component="fieldset">
                      <legend>Active Ingredients</legend>
                      <FieldArray
                        name={'containedProducts[${index}].activeIngredients'}
                      >
                        {arrayHelpers => (
                          <>
                            <Ingredients
                              containedProductIndex={index}
                              packageIndex={
                                partOfPackage
                                  ? (packageIndex as number)
                                  : undefined
                              }
                              partOfPackage={partOfPackage}
                              units={units}
                              ingredients={ingredients}
                            />
                          </>
                        )}
                      </FieldArray>
                    </OuterBox>
                  </Grid>
                  <Grid xs={6} key={'right'} item={true}>
                    <OuterBox
                      component="fieldset"
                      sx={{
                        display: 'grid',
                      }}
                    >
                      <legend>Dose Forms</legend>
                      <InnerBox component="fieldset">
                        <legend>Generic Dose Form</legend>
                        <Field
                          name={`${productsArray}[${index}].productDetails.genericForm`}
                          id={`${productsArray}[${index}].productDetails.genericForm`}
                          optionValues={doseForms}
                          getOptionLabel={(option: Concept) => option.pt.term}
                          setval={setSelectedDoseForm}
                          component={ProductAutocomplete}
                          fullWidth
                          variant="outlined"
                          margin="dense"
                        />
                      </InnerBox>
                      <InnerBox component="fieldset">
                        <legend>Specific Dose Form</legend>

                        <Field
                          name={`${productsArray}[${index}].productDetails.specificForm`}
                          id={`${productsArray}[${index}].productDetails.specificForm`}
                          optionValues={specialFormDoses}
                          getOptionLabel={(option: Concept) => option.pt.term}
                          component={ProductAutocomplete}
                          fullWidth
                          variant="outlined"
                          margin="dense"
                        />
                      </InnerBox>

                      <InnerBox component="fieldset">
                        <legend>Unit Size</legend>

                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems={'center'}
                        >
                          <Grid item xs={2}>
                            <Field
                              as={TextField}
                              name={`${productsArray}[${index}].productDetails.quantity.value`}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={10}>
                            <Field
                              name={`${productsArray}[${index}].productDetails.quantity.unit`}
                              id={`${productsArray}[${index}].productDetails.quantity.unit`}
                              optionValues={units}
                              getOptionLabel={(option: Concept) =>
                                option.pt.term
                              }
                              component={ProductAutocomplete}
                            />
                          </Grid>
                        </Stack>
                      </InnerBox>
                      <InnerBox component="fieldset">
                        <legend>Pack Size</legend>

                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems={'center'}
                        >
                          <Grid item xs={2}>
                            <Field
                              as={TextField}
                              name={`${productsArray}[${index}].value`}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={10}>
                            <Field
                              name={`${productsArray}[${index}].unit`}
                              id={`${productsArray}[${index}].unit`}
                              optionValues={units}
                              getOptionLabel={(option: Concept) =>
                                option.pt.term
                              }
                              component={ProductAutocomplete}
                            />
                          </Grid>
                        </Stack>
                      </InnerBox>
                    </OuterBox>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </div>
        ))}
      </ProductBox>
    </>
  );
};
export default ContainedProducts;
