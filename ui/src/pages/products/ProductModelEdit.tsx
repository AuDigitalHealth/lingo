import {
  AccordionDetails,
  AccordionSummary,
  Button,
  Grid,
  Link,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  DefinitionStatus,
  Product,
  ProductModel,
} from '../../types/concept.ts';
import { Box } from '@mui/material';
import {
  containsNewConcept,
  filterByLabel,
  filterKeypress,
  findProductUsingId,
  findRelations,
  isFsnToggleOn,
} from '../../utils/helpers/conceptUtils.ts';
import { styled, useTheme } from '@mui/material/styles';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack } from '@mui/system';
import LinkViews from './components/LinkViews.tsx';

import Loading from '../../components/Loading.tsx';
import { InnerBoxSmall } from './components/style/ProductBoxes.tsx';
import { Control, useForm, useWatch } from 'react-hook-form';

import conceptService from '../../api/ConceptService.ts';
import { enqueueSnackbar } from 'notistack';

import { useNavigate } from 'react-router';
import CircleIcon from '@mui/icons-material/Circle';
import {
  ProductCreationDetails,
  ProductGroupType,
} from '../../types/product.ts';

interface ProductModelEditProps {
  productCreationDetails?: ProductCreationDetails;
  productModel: ProductModel;
  handleClose?: () => void;
  readOnlyMode: boolean;
  branch?: string;
}
function ProductModelEdit({
  productCreationDetails,
  handleClose,
  readOnlyMode,
  branch,
  productModel,
}: ProductModelEditProps) {
  const lableTypesRight = ['TP', 'TPUU', 'TPP'];
  const lableTypesLeft = ['MP', 'MPUU', 'MPP'];
  const lableTypesCentre = ['CTPP'];
  const [activeConcept, setActiveConcept] = useState<string>();
  const [expandedConcepts, setExpandedConcepts] = useState<string[]>([]);
  const theme = useTheme();
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();
  const newConceptFound =
    !readOnlyMode && productModel.nodes
      ? containsNewConcept(productModel.nodes)
      : false;

  const { register, handleSubmit, reset, control } = useForm<ProductModel>({
    defaultValues: {
      nodes: [],
      edges: [],
    },
  });

  const onSubmit = (data: ProductModel) => {
    if (!readOnlyMode && newConceptFound && productCreationDetails) {
      productCreationDetails.productSummary = data;
      setLoading(true);
      conceptService
        .createNewProduct(productCreationDetails, branch as string)
        .then(v => {
          console.log(v);
          if (handleClose) handleClose();
          setLoading(false);

          navigate(v.subject?.conceptId as string, {
            state: { productModel: v, branch: branch },
          });
          // return (<ProductModelReadonly productModel={v} />);
        })
        .catch(err => {
          setLoading(false);
          enqueueSnackbar(
            `Product creation failed for  [${data.subject?.pt.term}] with the error:${err}`,
            {
              variant: 'error',
            },
          );
        });
    }
  };
  useEffect(() => {
    if (productModel) {
      reset(productModel);
    }
  }, [reset, productModel]);

  interface ProductTypeGroupProps {
    productLabelItems: Product[];
    label: string;
  }

  function ProductTypeGroup({
    productLabelItems,
    label,
  }: ProductTypeGroupProps) {
    const Accordion = styled((props: AccordionProps) => (
      <MuiAccordion disableGutters elevation={0} square {...props} />
    ))(({ theme }) => ({
      border: `3px solid ${theme.palette.divider}`,
      '&:not(:last-child)': {
        borderBottom: 0,
      },
      '&:before': {
        display: 'none',
      },
    }));
    const productGroupEnum: ProductGroupType =
      ProductGroupType[label as keyof typeof ProductGroupType];

    interface ProductPanelProps {
      product: Product;
      fsnToggle: boolean;
    }

    function ProductPanel({ product, fsnToggle }: ProductPanelProps) {
      const links = activeConcept
        ? findRelations(productModel?.edges, activeConcept, product.conceptId)
        : [];

      const index = productModel.nodes.findIndex(
        x => x.conceptId === product.conceptId,
      );
      function showHighlite() {
        return links.length > 0;
      }
      const accordionClicked = (conceptId: string) => {
        if (expandedConcepts.includes(conceptId)) {
          setExpandedConcepts(
            expandedConcepts.filter((value: string) => value !== conceptId),
          );
          setActiveConcept(undefined);
        } else {
          setExpandedConcepts([...expandedConcepts, conceptId]);
          setActiveConcept(conceptId);
        }
      };
      function ProductHeaderWatch({
        control,
        index,
        fsnToggle,
        showHighLite,
      }: {
        control: Control<ProductModel>;
        index: number;
        fsnToggle: boolean;
        showHighLite: boolean;
      }) {
        const pt = useWatch({
          control,
          name: `nodes[${index}].newConceptDetails.preferredTerm` as 'nodes.0.newConceptDetails.preferredTerm',
        });

        const fsn = useWatch({
          control,
          name: `nodes[${index}].newConceptDetails.preferredTerm` as 'nodes.0.newConceptDetails.preferredTerm',
        });

        if (showHighLite) {
          return (
            <Tooltip
              title={
                <LinkViews
                  links={links}
                  linkedConcept={
                    findProductUsingId(
                      activeConcept as string,
                      productModel?.nodes,
                    ) as Product
                  }
                  currentConcept={product}
                  key={product.conceptId}
                  productModel={productModel}
                  control={control}
                  fsnToggle={fsnToggle}
                />
              }
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: '#9bddff',
                    color: '#262626',
                    border: '1px solid #888888',
                    borderRadius: '15px',
                  },
                },
              }}
            >
              <Typography>
                <span>{fsnToggle ? fsn : pt} </span>
              </Typography>
            </Tooltip>
          );
        }

        return (
          <Typography>
            <span>{fsnToggle ? fsn : pt}</span>
          </Typography>
        );
      }

      const getColorByDefinitionStatus = (): string => {
        if (product.newConcept) {
          return '#00A854';
        }
        return product.concept.definitionStatus === DefinitionStatus.Primitive
          ? '#99CCFF'
          : '#CCCCFF';
      };

      return (
        <Grid>
          <Accordion
            key={product.conceptId}
            onChange={() => accordionClicked(product.conceptId)}
            expanded={expandedConcepts.includes(product.conceptId)}
          >
            <AccordionSummary
              sx={{
                backgroundColor: getColorByDefinitionStatus,
                //borderColor:theme.palette.warning.light,
                border: '3px solid',
              }}
              style={{
                borderColor: showHighlite()
                  ? theme.palette.warning.light
                  : 'transparent',
              }}
              expandIcon={<ExpandMoreIcon />}
              //aria-expanded={true}

              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              {showHighlite() ? (
                <Grid xs={40} item={true}>
                  {product.newConcept ? (
                    <ProductHeaderWatch
                      control={control}
                      index={index}
                      fsnToggle={fsnToggle}
                      showHighLite={showHighlite()}
                    />
                  ) : (
                    <Tooltip
                      title={
                        <LinkViews
                          links={links}
                          linkedConcept={
                            findProductUsingId(
                              activeConcept as string,
                              productModel?.nodes,
                            ) as Product
                          }
                          currentConcept={product}
                          key={product.conceptId}
                          productModel={productModel}
                          fsnToggle={fsnToggle}
                          control={control}
                        />
                      }
                      componentsProps={{
                        tooltip: {
                          sx: {
                            bgcolor: '#9bddff',
                            color: '#262626',
                            border: '1px solid #888888',
                            borderRadius: '15px',
                          },
                        },
                      }}
                    >
                      <Typography>
                        <span>
                          {fsnToggle
                            ? (product.concept.fsn?.term as string)
                            : product.concept.pt.term}{' '}
                        </span>
                      </Typography>
                    </Tooltip>
                  )}
                </Grid>
              ) : (
                <Grid xs={40} item={true}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Grid item xs={10}>
                      {product.newConcept ? (
                        <ProductHeaderWatch
                          control={control}
                          index={index}
                          fsnToggle={fsnToggle}
                          showHighLite={showHighlite()}
                        />
                      ) : (
                        <Typography>
                          <span>
                            {fsnToggle
                              ? (product.concept.fsn?.term as string)
                              : product.concept.pt.term}
                          </span>
                        </Typography>
                      )}
                    </Grid>
                    {activeConcept === product.conceptId ? (
                      <Grid container justifyContent="flex-end">
                        <CircleIcon
                          style={{ color: theme.palette.warning.light }}
                        />
                      </Grid>
                    ) : (
                      <div></div>
                    )}
                  </Stack>
                </Grid>
              )}
            </AccordionSummary>
            <AccordionDetails>
              {product.newConcept ? (
                <div>
                  <Grid item xs={12}>
                    {/*<Stack direction="row" spacing={1}>*/}
                    <Grid item xs={12}>
                      <InnerBoxSmall component="fieldset">
                        <legend>FSN</legend>
                        <TextField
                          multiline
                          {...register(
                            `nodes[${index}].newConceptDetails.fullySpecifiedName` as 'nodes.0.newConceptDetails.fullySpecifiedName',
                          )}
                          onKeyDown={filterKeypress}
                          fullWidth
                          variant="outlined"
                          margin="dense"
                          InputLabelProps={{ shrink: true }}
                          label={`(${product.newConceptDetails.semanticTag})`}
                        />
                      </InnerBoxSmall>
                    </Grid>

                    {/*</Stack>*/}

                    <InnerBoxSmall component="fieldset">
                      <legend>Preferred Term</legend>
                      <TextField
                        multiline
                        {...register(
                          `nodes[${index}].newConceptDetails.preferredTerm` as 'nodes.0.newConceptDetails.preferredTerm',
                        )}
                        fullWidth
                        variant="outlined"
                        margin="dense"
                        InputLabelProps={{ shrink: true }}
                        onKeyDown={filterKeypress}
                      />
                    </InnerBoxSmall>
                    <InnerBoxSmall component="fieldset">
                      <legend>Specified Concept Id</legend>
                      <TextField
                        {...register(
                          `nodes[${index}].newConceptDetails.specifiedConceptId` as 'nodes.0.newConceptDetails.specifiedConceptId',
                        )}
                        fullWidth
                        variant="outlined"
                        margin="dense"
                        InputLabelProps={{ shrink: true }}
                        onKeyDown={filterKeypress}
                      />
                    </InnerBoxSmall>
                  </Grid>
                </div>
              ) : (
                <div>
                  <Stack direction="row" spacing={2}>
                    <span style={{ color: '#184E6B' }}>Concept Id:</span>
                    <Link>{product.conceptId}</Link>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <Typography style={{ color: '#184E6B' }}>
                      {fsnToggle ? 'PT' : 'FSN'}:
                    </Typography>
                    <Typography>
                      {fsnToggle
                        ? product.concept.pt.term
                        : product.concept.fsn?.term}
                    </Typography>
                  </Stack>
                </div>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      );
    }
    return (
      <Grid>
        <Accordion defaultExpanded={true}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>{productGroupEnum}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div key={label + '-lists'}>
              {productLabelItems?.map(p => {
                return (
                  <ProductPanel
                    product={p}
                    fsnToggle={isFsnToggleOn()}
                    key={p.conceptId}
                  />
                );
              })}
            </div>
          </AccordionDetails>
        </Accordion>
      </Grid>
    );
  }
  if (isLoading) {
    return (
      <Loading
        message={`Creating New Product [${productModel.subject?.pt.term}]`}
      />
    );
  } else {
    return (
      <form onSubmit={event => void handleSubmit(onSubmit)(event)}>
        <Box sx={{ width: '100%' }}>
          <Grid
            container
            rowSpacing={1}
            columnSpacing={{ xs: 1, sm: 2, md: 3 }}
          >
            <Grid xs={6} key={'left'} item={true}>
              {lableTypesLeft.map(label => (
                <ProductTypeGroup
                  key={label}
                  label={label}
                  productLabelItems={filterByLabel(productModel?.nodes, label)}
                />
              ))}
            </Grid>
            <Grid xs={6} key={'right'} item={true}>
              {lableTypesRight.map(label => (
                <ProductTypeGroup
                  label={label}
                  key={label}
                  productLabelItems={filterByLabel(productModel?.nodes, label)}
                />
              ))}
            </Grid>
            <Grid xs={12} key={'bottom'} item={true}>
              {lableTypesCentre.map(label => (
                <ProductTypeGroup
                  label={label}
                  key={label}
                  productLabelItems={filterByLabel(productModel?.nodes, label)}
                />
              ))}
            </Grid>
          </Grid>
        </Box>
        {!readOnlyMode ? (
          <Box m={1} p={1}>
            <Stack spacing={2} direction="row" justifyContent="end">
              <Button
                variant="contained"
                type="button"
                color="error"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                type="submit"
                color="primary"
                disabled={!newConceptFound}
              >
                Create
              </Button>
              {/*<Button variant="contained" type="submit" color="primary">*/}
              {/*  Commit*/}
              {/*</Button>*/}
            </Stack>
          </Box>
        ) : (
          <div />
        )}
      </form>
    );
  }
}

export default ProductModelEdit;
