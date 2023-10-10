import React, { FC, useEffect, useState } from 'react';
import { Field, FieldArray, Form, Formik, useFormikContext } from 'formik';
import {
  ExternalIdentifier,
  MedicationPackageDetails,
} from '../../../types/authoring.ts';
import { Box, Button, Grid, Paper, Tab, Tabs, TextField } from '@mui/material';

import { Stack } from '@mui/system';
import { experimentalStyled as styled, useTheme } from '@mui/material/styles';
import { Concept } from '../../../types/concept.ts';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import ContainedProducts from './ContainedProducts.tsx';

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

  const InnerBox = styled(Box)({
    border: '0 solid #f0f0f0',
    color: '#003665',
    marginTop: '10px',
    marginBottom: '10px',
    fontSize: 'small',
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
                      ingredients={ingredients}
                      doseForms={doseForms}
                      brandProducts={brandProducts}
                      units={units}
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
                                  ingredients={ingredients}
                                  doseForms={doseForms}
                                  brandProducts={brandProducts}
                                  units={units}
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
