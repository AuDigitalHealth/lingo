import React, { FC, useEffect, useState } from 'react';
import { Field, FieldArray, Form, Formik, useFormikContext } from 'formik';
import {
  ExternalIdentifier,
  Ingredient,
  MedicationPackageDetails,
} from '../../../types/authoring.ts';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { Stack } from '@mui/system';
import { experimentalStyled as styled, useTheme } from '@mui/material/styles';
import { Concept } from '../../../types/concept.ts';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import conceptService from '../../../api/ConceptService.ts';

export interface ProductAuthoringMainProps {
  packageDetails: MedicationPackageDetails;
  show: boolean;
  units: Concept[];
  containerTypes: Concept[];
  ingredients: Concept[];
  doseForms: Concept[];
  brandProducts: Concept[];
}

function ProductAuthoringMain(productprops: ProductAuthoringMainProps) {
  const {
    packageDetails,
    units,
    containerTypes,
    ingredients,
    doseForms,
    brandProducts,
  } = productprops;
  const theme = useTheme();

  const handleSubmit = (values: MedicationPackageDetails) => {
    console.log(values);
  };

  const TPBox = styled(Box)({
    border: `1px solid ${theme.palette.divider}`,
    color: 'red',
    fontWeight: 'bold',
    fontSize: 'larger',
  });
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

  const PackageBox = styled(Box)({
    border: `1px solid ${theme.palette.divider}`,
    color: 'red',
    fontWeight: 'bold',
    fontSize: 'larger',
  });

  const ContainedPackages = () => {
    const { values } = useFormikContext<MedicationPackageDetails>();

    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
    };
    interface TabPanelProps {
      children?: React.ReactNode;
      index: number;
      value: number;
    }
    function CustomTabPanel(props: TabPanelProps) {
      const { children, value, index, ...other } = props;

      return (
        <div
          role="tabpanel"
          hidden={value !== index}
          id={`simple-tabpanel-${index}`}
          aria-labelledby={`simple-tab-${index}`}
          {...other}
        >
          {value === index && (
            <Box sx={{ p: 3 }}>
              <div>{children}</div>
            </Box>
          )}
        </div>
      );
    }
    function a11yProps(index: number) {
      return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
      };
    }
    return (
      <>
        {/*<input type="text" value={name} onChange={handleChange} />*/}
        {/*<button type="button" onClick={handleAddPerson}>*/}
        {/*  add person*/}
        {/*</button>*/}
        <PackageBox component="fieldset">
          <legend>Contained Packages</legend>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
            >
              {values.containedPackages.map((containedPackage, index) => (
                <Tab
                  label={containedPackage.packageDetails.productName.pt.term}
                  {...a11yProps(index)}
                  key={index}
                />
              ))}
            </Tabs>
          </Box>
          {values.containedPackages.map((containedPackage, index) => (
            <CustomTabPanel
              value={value}
              index={index}
              key={containedPackage.packageDetails.productName.conceptId}
            >
              <FieldArray
                name={'containedPackages[${index}].containedProducts'}
              >
                {arrayHelpers => (
                  <>
                    <ContainedProducts
                      packageIndex={index}
                      partOfPackage={true}
                      showTPU={true}
                    />
                  </>
                )}
              </FieldArray>
            </CustomTabPanel>
          ))}
        </PackageBox>
      </>
    );
  };
  interface ContainedProductsProps {
    packageIndex?: number;
    partOfPackage: boolean;
    showTPU: boolean;
  }
  const ContainedProducts: FC<ContainedProductsProps> = ({
    packageIndex,
    partOfPackage,
    showTPU,
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
                              getOptionLabel={(option: Concept) =>
                                option.pt.term
                              }
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
                              <ActiveIngredients
                                containedProductIndex={index}
                                packageIndex={
                                  partOfPackage
                                    ? (packageIndex as number)
                                    : undefined
                                }
                                partOfPackage={partOfPackage}
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

  interface ActiveIngredientsProps {
    packageIndex?: number;
    containedProductIndex: number;
    partOfPackage: boolean;
  }
  const ActiveIngredients: FC<ActiveIngredientsProps> = ({
    containedProductIndex,
    packageIndex,
    partOfPackage,
  }) => {
    //const [number, setNumber] = React.useState("");
    const { values } = useFormikContext<MedicationPackageDetails>();
    const [expandedIngredients, setExpandedIngredients] = useState<string[]>(
      [],
    );

    // const handleAddContactNumber = () => {
    //   const contact = {};
    //   contact.number = number;
    //
    //   contactsArrayHelpers.push(contact);
    //   setNumber("");
    // };

    // const handleChange = event => {
    //   setNumber(event.currentTarget.value);
    // };

    const activeIngredients = partOfPackage
      ? values.containedPackages[packageIndex as number].packageDetails
          .containedProducts[containedProductIndex].productDetails
          .activeIngredients
      : values.containedProducts[containedProductIndex].productDetails
          .activeIngredients;

    const activeIngredientsArray = partOfPackage
      ? `containedPackages[${packageIndex}].packageDetails.containedProducts[${containedProductIndex}].productDetails.activeIngredients`
      : `containedProducts[${containedProductIndex}].productDetails.activeIngredients`;
    const getKey = (index: number) => {
      return `ingredient-key-${index}`;
    };

    const ingredientsAccordionClicked = (key: string) => {
      if (expandedIngredients.includes(key)) {
        setExpandedIngredients(
          expandedIngredients.filter((value: string) => value !== key),
        );
      } else {
        setExpandedIngredients([...expandedIngredients, key]);
      }
    };

    return (
      <>
        {activeIngredients.map(
          (activeIngredient: Ingredient, index: number) => (
            <div key={activeIngredient.activeIngredient.conceptId}>
              <br />
              <Accordion
                style={{ border: 'none' }}
                key={getKey(index)}
                onChange={() => ingredientsAccordionClicked(getKey(index))}
                expanded={expandedIngredients.includes(getKey(index))}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  //aria-expanded={true}

                  aria-controls="panel2a-content"
                  id="panel2a-header"
                >
                  <Grid xs={40} item={true}>
                    <Typography>
                      {activeIngredient.activeIngredient.pt.term}
                    </Typography>
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
                          fullWidth
                          variant="outlined"
                          margin="dense"
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
        {/*<input type="text" value={number} onChange={handleChange} />*/}

        {/*<button type="button" onClick={handleAddContactNumber}>*/}
        {/*  add contact to {values.people[personIndex].name}*/}
        {/*</button>*/}
      </>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container>
        <Grid item sm={12} xs={12}>
          <Paper>
            <Box m={2} p={2}>
              <Formik
                initialValues={{ ...packageDetails }}
                enableReinitialize={true}
                onSubmit={handleSubmit}
              >
                {({ values }) => (
                  <Form
                    onChange={event => {
                      console.log(event.currentTarget);
                    }}
                  >
                    {/*<MainBox component="fieldset">*/}
                    <TPBox component="fieldset">
                      <legend>Package Details</legend>

                      <Stack
                        direction="row"
                        spacing={3}
                        sx={{ marginLeft: '10px' }}
                        alignItems="center"
                      >
                        <Grid item xs={4}>
                          <InnerBox component="fieldset">
                            <legend>Brand Name</legend>
                            <Field
                              as={TextField}
                              name={`productName.pt.term`}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                              InputLabelProps={{ shrink: true }}
                            />
                          </InnerBox>
                        </Grid>

                        <Grid item xs={4}>
                          <InnerBox component="fieldset">
                            <legend>Container Type</legend>
                            <Field
                              name={'containerType'}
                              id={'containerType'}
                              optionValues={containerTypes}
                              getOptionLabel={(option: Concept) =>
                                option.pt.term
                              }
                              component={ProductAutocomplete}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                            />
                          </InnerBox>
                        </Grid>
                        <Grid item xs={3}>
                          <InnerBox component="fieldset">
                            <legend>ARTG ID</legend>
                            <Field
                              name={'externalIdentifiers'}
                              id={'externalIdentifiers'}
                              optionValues={[]}
                              getOptionLabel={(option: ExternalIdentifier) =>
                                option.identifierValue
                              }
                              multiple
                              freeSolo
                              component={ProductAutocomplete}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                            />
                          </InnerBox>
                        </Grid>
                      </Stack>
                    </TPBox>

                    {packageDetails.containedProducts.length > 0 ? (
                      <div>
                        <FieldArray name="containedProducts">
                          {arrayHelpers => {
                            return (
                              <>
                                <br />
                                <ContainedProducts
                                  showTPU={true}
                                  partOfPackage={false}
                                />
                              </>
                            );
                          }}
                        </FieldArray>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    {packageDetails.containedPackages.length > 0 ? (
                      <div>
                        <FieldArray name="containedPackages">
                          {arrayHelpers => {
                            return (
                              <>
                                <br />
                                <ContainedPackages />
                              </>
                            );
                          }}
                        </FieldArray>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    {/*</MainBox>*/}

                    <Box m={1} p={1}>
                      <Stack spacing={2} direction="row" justifyContent="end">
                        <Button variant="contained" type="submit" color="info">
                          Save
                        </Button>
                        <Button
                          variant="contained"
                          type="submit"
                          color="success"
                        >
                          Preview
                        </Button>
                        <Button
                          variant="contained"
                          type="submit"
                          color="primary"
                        >
                          Commit
                        </Button>
                      </Stack>
                    </Box>
                  </Form>
                )}
              </Formik>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProductAuthoringMain;
