import {
  Field,
  FieldArray,
  FieldArrayRenderProps,
  useFormikContext,
} from 'formik';
import React, { FC, useEffect, useState } from 'react';
import {
  MedicationPackageDetails,
  MedicationProductQuantity,
} from '../../../types/authoring.ts';
import { Concept } from '../../../types/concept.ts';
import conceptService from '../../../api/ConceptService.ts';
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
import { Stack } from '@mui/system';
import { AddCircle, Delete } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import Ingredients from './Ingredients.tsx';
import ProductSearchAndAddModal from './ProductSearchAndAddModal.tsx';
import SearchAndAddIcon from '../../../components/icons/SearchAndAddIcon.tsx';
import {
  InnerBox,
  Level1Box,
  Level2Box,
  OuterBox,
} from './style/ProductBoxes.tsx';

interface ContainedProductsProps {
  packageIndex?: number;
  partOfPackage: boolean;
  showTPU: boolean;
  arrayHelpers: FieldArrayRenderProps;
  brandProducts: Concept[];
  units: Concept[];
  ingredients: Concept[];
  doseForms: Concept[];
}
const ContainedProducts: FC<ContainedProductsProps> = ({
  packageIndex,
  partOfPackage,
  showTPU,
  arrayHelpers,
  brandProducts,
  units,
  ingredients,
  doseForms,
}) => {
  //const [name, setName] = React.useState("");
  const { values } = useFormikContext<MedicationPackageDetails>();

  const containedProducts = partOfPackage
    ? values.containedPackages[packageIndex as number].packageDetails
        ?.containedProducts
    : values.containedProducts;
  const productsArray = partOfPackage
    ? `containedPackages[${packageIndex}].packageDetails.containedProducts`
    : 'containedProducts';

  const [specialFormDoses, setSpecialFormDoses] = useState<Concept[]>([]);
  const [selectedDoseForm, setSelectedDoseForm] = useState<Concept>();
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const handleToggleModal = () => {
    setModalOpen(!modalOpen);
  };
  const handleSearchAndAddProduct = () => {
    handleToggleModal();
    // setValue(newValue);
  };

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

  const ProductDetails = () => {
    return (
      <div>
        <Grid container justifyContent="flex-end">
          <Stack direction="row" spacing={0} alignItems="center">
            <IconButton
              onClick={() => {
                const productQuantity: MedicationProductQuantity = {
                  productDetails: { activeIngredients: [{}] },
                };
                arrayHelpers.push(productQuantity);
              }}
              aria-label="create"
              size="large"
            >
              <Tooltip title={'Create new product'}>
                <AddCircle fontSize="medium" />
              </Tooltip>
            </IconButton>

            <Tooltip title={'Search and add an existing product'}>
              <IconButton
                aria-label="create"
                size="large"
                onClick={handleSearchAndAddProduct}
              >
                <SearchAndAddIcon width={'20px'} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Grid>
        <ProductSearchAndAddModal
          open={modalOpen}
          handleClose={handleToggleModal}
          arrayHelpers={arrayHelpers}
        />

        {containedProducts.map((containedProduct, index) => {
          const activeIngredientsArray = partOfPackage
            ? `containedPackages[${packageIndex}].packageDetails.containedProducts[${index}].productDetails.activeIngredients`
            : `containedProducts[${index}].productDetails.activeIngredients`;
          return (
            <div key={productKey(index)} style={{ marginTop: '10px' }}>
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
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Grid item xs={10}>
                        <Typography
                          sx={{
                            color: !containedProduct.productDetails?.productName
                              ? 'red'
                              : 'inherit',
                          }}
                        >
                          {containedProduct.productDetails?.productName
                            ? containedProduct.productDetails?.productName?.pt
                                .term
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
                            <Tooltip title={'Delete Product'}>
                              <Delete />
                            </Tooltip>
                          </IconButton>
                        </Stack>
                      </Grid>
                    </Stack>
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
                        <FieldArray name={activeIngredientsArray}>
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
                                arrayHelpers={arrayHelpers}
                                units={units}
                                ingredients={ingredients}
                              />
                            </>
                          )}
                        </FieldArray>
                        {/*<pre>{JSON.stringify(values.containedProducts[0].productDetails.activeIngredients, null, 2)}</pre>*/}
                      </OuterBox>
                    </Grid>
                    <Grid xs={6} key={'right'} item={true}>
                      <OuterBox component="fieldset">
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
                                value={
                                  containedProduct.productDetails?.quantity
                                    ?.value || ''
                                }
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
                                value={containedProduct.value || ''}
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
          );
        })}
      </div>
    );
  };
  return (
    <>
      {partOfPackage ? (
        <Level2Box component="fieldset">
          <legend>Contained Products</legend>
          <ProductDetails></ProductDetails>
        </Level2Box>
      ) : (
        <Level1Box component="fieldset">
          <legend>Contained Products</legend>
          <ProductDetails></ProductDetails>
        </Level1Box>
      )}
    </>
  );
};
export default ContainedProducts;
