import React, { useState } from 'react';
import {
  Field,
  FieldArray,
  FieldArrayRenderProps,
  Form,
  Formik,
  useFormikContext,
} from 'formik';
import {
  ExternalIdentifier,
  MedicationPackageDetails,
  MedicationPackageQuantity,
} from '../../../types/authoring.ts';
import {
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  styled,
  Tab,
  Tabs,
  TextField,
  Tooltip,
} from '@mui/material';

import { Stack } from '@mui/system';
import { Concept } from '../../../types/concept.ts';
import ProductAutocomplete from './ProductAutocomplete.tsx';

import { AddCircle, Delete } from '@mui/icons-material';
import CustomTabPanel, { a11yProps } from './CustomTabPanel.tsx';
import PackageSearchAndAddModal from './PackageSearchAndAddModal.tsx';
import ContainedProducts from './ContainedProducts.tsx';
import ArtgAutocomplete from './ArtgAutocomplete.tsx';
import { useTheme } from '@mui/material/styles';
import { getDefaultUnit } from '../../../utils/helpers/conceptUtils.ts';
import SearchAndAddIcon from '../../../components/icons/SearchAndAddIcon.tsx';
import { shallowEqual } from 'react-redux';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';

export interface ProductAuthoringMainProps {
  packageDetails: MedicationPackageDetails;
  units: Concept[];
  containerTypes: Concept[];
  ingredients: Concept[];
  doseForms: Concept[];
  brandProducts: Concept[];
  handleClearForm: () => void;
  emptyForm: boolean;
  setEmptyForm: (value: boolean) => void;
}

function ProductAuthoringMain(productprops: ProductAuthoringMainProps) {
  const {
    packageDetails,
    units,
    containerTypes,
    ingredients,
    doseForms,
    brandProducts,
    handleClearForm,
    emptyForm,
    setEmptyForm,
  } = productprops;
  const theme = useTheme();

  const handleSubmit = (values: MedicationPackageDetails) => {
    console.log(values);
  };

  const Level1Box = styled(Box)({
    border: `1px solid ${theme.palette.divider}`,
    color: '#003665',
    fontWeight: 'bold',
    fontSize: 'larger',
  });
  const Level2Box = styled(Box)({
    border: `1px solid ${theme.palette.divider}`,
    color: '#CD7F32',
    fontWeight: 'bold',
    fontSize: 'medium',
  });
  const InnerBox = styled(Box)({
    border: '0 solid #f0f0f0',
    color: '#003665',
    marginTop: '10px',
    marginBottom: '10px',
    fontSize: 'small',
  });

  const [resetModalDisabled, setResetModalDisabled] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  interface ContainedPackagesProps {
    arrayHelpers: FieldArrayRenderProps;
  }

  function ContainedPackages(props: ContainedPackagesProps) {
    const { arrayHelpers } = props;
    const { values } = useFormikContext<MedicationPackageDetails>();

    const [value, setValue] = React.useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [defaultUnit] = useState(getDefaultUnit(units));
    const handleToggleModal = () => {
      setModalOpen(!modalOpen);
    };

    const [disabled, setDisabled] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [indexToDelete, setIndexToDelete] = useState(-1);

    const handleDeletePackage = () => {
      arrayHelpers.remove(indexToDelete);
      setDeleteModalOpen(false);
    };

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
    };

    const handlePackageCreation = () => {
      const medicationPackageQty: MedicationPackageQuantity = {
        unit: defaultUnit,
        value: 1,
        packageDetails: {
          externalIdentifiers: [],
          containedPackages: [],
          containedProducts: [{ productDetails: { activeIngredients: [{}] } }],
        },
      };
      arrayHelpers.push(medicationPackageQty);
      setValue(values.containedPackages.length);
    };

    const handleSearchAndAddPackage = () => {
      handleToggleModal();
      setValue(values.containedPackages.length);
    };

    return (
      <>
        <Level1Box component="fieldset">
          <legend>Contained Packages</legend>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="package tab"
            >
              {values.containedPackages?.map((containedPackage, index) => (
                <Tab
                  label={
                    <Tooltip
                      title={
                        containedPackage?.packageDetails?.productName
                          ? containedPackage?.packageDetails?.productName?.pt
                              .term
                          : 'untitled*'
                      }
                    >
                      <span>
                        {containedPackage?.packageDetails?.productName
                          ? containedPackage?.packageDetails?.productName?.pt
                              .term
                          : 'untitled*'}
                      </span>
                    </Tooltip>
                  }
                  sx={{
                    color: !containedPackage?.packageDetails?.productName
                      ? 'red'
                      : 'inherit',
                  }}
                  {...a11yProps(index)}
                  key={index}
                />
              ))}
              <Tab
                icon={
                  <Tooltip title="Create new package">
                    <AddCircle />
                  </Tooltip>
                }
                onClick={handlePackageCreation}
                {...a11yProps(
                  values.containedPackages?.length
                    ? values.containedPackages?.length + 1
                    : 0,
                )}
                key={
                  values.containedPackages?.length
                    ? values.containedPackages?.length + 1
                    : 0
                }
              />
              <Tab
                label={
                  <Tooltip title="Search and add an existing package">
                    <span>
                      <SearchAndAddIcon width={'20px'} />
                    </span>
                  </Tooltip>
                }
                onClick={handleSearchAndAddPackage}
                {...a11yProps(
                  values.containedPackages?.length
                    ? values.containedPackages?.length + 2
                    : 1,
                )}
                key={
                  values.containedPackages?.length
                    ? values.containedPackages?.length + 2
                    : 1
                }
              />
            </Tabs>
            <PackageSearchAndAddModal
              open={modalOpen}
              handleClose={handleToggleModal}
              arrayHelpers={arrayHelpers}
              defaultUnit={defaultUnit as Concept}
            />
          </Box>
          {values.containedPackages?.map((containedPackage, index) => (
            <CustomTabPanel value={value} index={index} key={index}>
              <Grid container justifyContent="flex-end">
                <ConfirmationModal
                  open={deleteModalOpen}
                  content={`Remove the package "${
                    containedPackage.packageDetails.productName
                      ? containedPackage.packageDetails.productName?.pt.term
                      : 'Untitled'
                  }" ?`}
                  handleClose={() => {
                    setDeleteModalOpen(false);
                  }}
                  title={'Confirm Delete Package'}
                  disabled={disabled}
                  action={'Delete'}
                  handleAction={handleDeletePackage}
                />
                <IconButton
                  onClick={() => {
                    setIndexToDelete(index);
                    setDeleteModalOpen(true);
                    // arrayHelpers.remove(index);
                  }}
                  aria-label="delete"
                  size="small"
                  color="error"
                >
                  <Tooltip title={'Delete Package'}>
                    <Delete />
                  </Tooltip>
                </IconButton>
              </Grid>
              <FieldArray
                name={`containedPackages[${index}].packageDetails.containedProducts`}
              >
                {arrayHelpers => (
                  <>
                    <Level2Box component="fieldset">
                      <legend>Package Details</legend>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Grid item xs={4}>
                          <InnerBox component="fieldset">
                            <legend>Brand Name</legend>
                            <Field
                              name={`containedPackages[${index}].packageDetails.productName`}
                              id={`containedPackages[${index}].packageDetails.productName`}
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
                        </Grid>

                        <Grid item xs={4}>
                          <InnerBox component="fieldset">
                            <legend>Container Type</legend>
                            <Field
                              name={`containedPackages[${index}].packageDetails.containerType`}
                              id={`containedPackages[${index}].packageDetails.containerType`}
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
                              name={`containedPackages[${index}].packageDetails.externalIdentifiers`}
                              id={`containedPackages[${index}].packageDetails.externalIdentifiers`}
                              optionValues={[]}
                              getOptionLabel={(option: ExternalIdentifier) =>
                                option.identifierValue
                              }
                              multiple
                              freeSolo
                              component={ArtgAutocomplete}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                            />
                          </InnerBox>
                        </Grid>
                      </Stack>

                      <InnerBox component="fieldset">
                        <legend>Quantity</legend>

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems={'center'}
                        >
                          <Grid item xs={1}>
                            <Field
                              as={TextField}
                              name={`containedPackages[${index}].value`}
                              id={`containedPackages[${index}].value`}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                              InputLabelProps={{ shrink: true }}
                              value={containedPackage.value || 1}
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <Field
                              name={`containedPackages[${index}].unit`}
                              id={`containedPackages[${index}].unit`}
                              defaultOption={defaultUnit}
                              optionValues={units}
                              getOptionLabel={(option: Concept) =>
                                option.pt.term
                              }
                              component={ProductAutocomplete}
                              sx={{ maxWidth: '95%' }}
                            />
                          </Grid>
                        </Stack>
                      </InnerBox>
                    </Level2Box>
                    <br />
                    <ContainedProducts
                      packageIndex={index}
                      partOfPackage={true}
                      showTPU={true}
                      arrayHelpers={arrayHelpers}
                      units={units}
                      doseForms={doseForms}
                      brandProducts={brandProducts}
                      ingredients={ingredients}
                    />
                  </>
                )}
              </FieldArray>
            </CustomTabPanel>
          ))}
        </Level1Box>
      </>
    );
  }

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
                {({ values, resetForm, initialValues }) => (
                  <Form
                    onChange={event => {
                      console.log(event.currentTarget);
                      const hasChanged = !shallowEqual(initialValues, values);
                      if (emptyForm && hasChanged) {
                        setEmptyForm(false);
                      }
                    }}
                  >
                    <ConfirmationModal
                      open={resetModalOpen}
                      content={`Confirm clear?. This will reset the unsaved changes`}
                      handleClose={() => {
                        setResetModalOpen(false);
                      }}
                      title={'Confirm Clear'}
                      disabled={resetModalDisabled}
                      action={'Clear'}
                      handleAction={() => {
                        resetForm();
                        handleClearForm();
                        setResetModalOpen(false);
                      }}
                    />
                    <Grid container justifyContent="flex-end">
                      <Button
                        type="reset"
                        onClick={() => {
                          setResetModalOpen(true);
                        }}
                        variant="contained"
                        color="error"
                      >
                        Clear
                      </Button>
                    </Grid>
                    {/*<MainBox component="fieldset">*/}
                    <Level1Box component="fieldset">
                      <legend>Product Details</legend>

                      <Stack
                        direction="row"
                        spacing={3}
                        // sx={{ marginLeft: '10px' }}
                        alignItems="center"
                      >
                        <Grid item xs={4}>
                          <InnerBox component="fieldset">
                            <legend>Brand Name</legend>
                            <Field
                              as={TextField}
                              name={`productName.pt.term`}
                              value={values.productName?.pt.term || ''}
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
                              component={ArtgAutocomplete}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                            />
                          </InnerBox>
                        </Grid>
                      </Stack>
                    </Level1Box>

                    {values.containedPackages.length > 0 ||
                    (values.containedPackages.length === 0 &&
                      values.containedProducts.length === 0) ? (
                      <div>
                        <FieldArray name="containedPackages">
                          {arrayHelpers => {
                            return (
                              <>
                                <br />
                                <ContainedPackages
                                  arrayHelpers={arrayHelpers}
                                />
                              </>
                            );
                          }}
                        </FieldArray>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    {values.containedProducts.length > 0 ||
                    (values.containedPackages.length === 0 &&
                      values.containedProducts.length === 0) ? (
                      <div>
                        <FieldArray name="containedProducts">
                          {arrayHelpers => {
                            return (
                              <>
                                <br />
                                <ContainedProducts
                                  showTPU={true}
                                  partOfPackage={false}
                                  arrayHelpers={arrayHelpers}
                                  units={units}
                                  doseForms={doseForms}
                                  brandProducts={brandProducts}
                                  ingredients={ingredients}
                                />
                              </>
                            );
                          }}
                        </FieldArray>
                      </div>
                    ) : (
                      <div></div>
                    )}

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
