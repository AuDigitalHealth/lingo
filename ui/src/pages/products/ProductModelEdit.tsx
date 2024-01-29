import {
  AccordionDetails,
  AccordionSummary,
  Button,
  Grid,
  IconButton,
  Link,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  Concept,
  DefinitionStatus,
  Edge,
  Product,
  ProductModel,
} from '../../types/concept.ts';
import { Box } from '@mui/material';
import {
  cleanPackageDetails,
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
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import Loading from '../../components/Loading.tsx';
import { InnerBoxSmall } from './components/style/ProductBoxes.tsx';
import { Control, UseFormGetValues, UseFormRegister, UseFormSetValue, useForm, useWatch } from 'react-hook-form';

import conceptService from '../../api/ConceptService.ts';

import { useNavigate } from 'react-router';
import CircleIcon from '@mui/icons-material/Circle';
import {
  MedicationPackageDetails,
  ProductCreationDetails,
  ProductGroupType,
} from '../../types/product.ts';
import useTicketStore from '../../stores/TicketStore.ts';
import { Ticket } from '../../types/tickets/ticket.ts';
import TicketsService from '../../api/TicketsService.ts';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import useCanEditTask from '../../hooks/useCanEditTask.tsx';
import UnableToEditTooltip from '../tasks/components/UnableToEditTooltip.tsx';
import { useServiceStatus } from '../../hooks/api/useServiceStatus.tsx';
import CustomTabPanel from './components/CustomTabPanel.tsx';
import useTicketById from '../../hooks/useTicketById.tsx';

import { useParams } from 'react-router-dom';
import useTaskById from '../../hooks/useTaskById.tsx';
import useAuthoringStore from '../../stores/AuthoringStore.ts';

interface ProductModelEditProps {
  productCreationDetails?: ProductCreationDetails;
  productModel: ProductModel;
  handleClose?: () => void;
  readOnlyMode: boolean;
  branch?: string;
  ticket?: Ticket;
}
function ProductModelEdit({
  productCreationDetails,
  handleClose,
  readOnlyMode,
  branch,
  productModel,
  ticket,
}: ProductModelEditProps) {
  const lableTypesRight = ['TP', 'TPUU', 'TPP'];
  const lableTypesLeft = ['MP', 'MPUU', 'MPP'];
  const lableTypesCentre = ['CTPP'];

  const [activeConcept, setActiveConcept] = useState<string>();
  const [expandedConcepts, setExpandedConcepts] = useState<string[]>([]);
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { serviceStatus } = useServiceStatus();
  const newConceptFound =
    !readOnlyMode && productModel.nodes
      ? containsNewConcept(productModel.nodes)
      : false;

  const { register, handleSubmit, reset, control, setValue, getValues, watch } = useForm<ProductModel>({
    defaultValues: {
      nodes: [],
      edges: [],
    },
  });

  useEffect(() => {
    watch((value, { name, type }) => console.log(value, name, type));
  }, [watch]);

  const { mergeTickets } = useTicketStore();

  const [canEdit] = useCanEditTask();

  const onSubmit = (data: ProductModel) => {
    if (!readOnlyMode && newConceptFound && productCreationDetails) {
      productCreationDetails.productSummary = data;
      productCreationDetails.packageDetails = cleanPackageDetails(
        productCreationDetails.packageDetails as MedicationPackageDetails,
      );
      setLoading(true);
      conceptService
        .createNewProduct(productCreationDetails, branch as string)
        .then(v => {
          console.log(v);
          if (handleClose) handleClose();
          setLoading(false);
          if (ticket) {
            const products = TicketsService.getTicketProducts(ticket.id).then(
              p => {
                ticket.products = p;
                mergeTickets(ticket);
              },
            );
          }

          navigate(v.subject?.conceptId as string, {
            state: { productModel: v, branch: branch },
          });
          // return (<ProductModelReadonly productModel={v} />);
        })
        .catch(err => {
          setLoading(false);
          snowstormErrorHandler(
            err,
            `Product creation failed for  [${data.subject?.pt?.term}]`,
            serviceStatus,
          );
        });
    }
  };
  useEffect(() => {
    if (productModel) {
      reset(productModel);
    }
  }, [reset, productModel]);

  if (isLoading) {
    return (
      <Loading
        message={`Creating New Product [${productModel.subject?.pt?.term}]`}
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
              {lableTypesLeft.map((label, index) => (
                <ProductTypeGroup
                  key={`left-${label}-${index}`}
                  productLabelItems={filterByLabel(productModel?.nodes, label)}
                  label={label}
                  control={control}
                  productModel={productModel}
                  activeConcept={activeConcept}
                  setActiveConcept={setActiveConcept}
                  expandedConcepts={expandedConcepts}
                  setExpandedConcepts={setExpandedConcepts}
                  register={register}
                  setFormValue={setValue}
                  getFormValues={getValues}
                />
              ))}
            </Grid>
            <Grid xs={6} key={'right'} item={true}>
              {lableTypesRight.map((label, index) => (
                <ProductTypeGroup
                  key={`left-${label}-${index}`}
                  productLabelItems={filterByLabel(productModel?.nodes, label)}
                  label={label}
                  control={control}
                  productModel={productModel}
                  activeConcept={activeConcept}
                  setActiveConcept={setActiveConcept}
                  expandedConcepts={expandedConcepts}
                  setExpandedConcepts={setExpandedConcepts}
                  register={register}
                  setFormValue={setValue}
                  getFormValues={getValues}
                />
              ))}
            </Grid>
            <Grid xs={12} key={'bottom'} item={true}>
              {lableTypesCentre.map((label, index) => (
                <ProductTypeGroup
                  key={`left-${label}-${index}`}
                  productLabelItems={filterByLabel(productModel?.nodes, label)}
                  label={label}
                  control={control}
                  productModel={productModel}
                  activeConcept={activeConcept}
                  setActiveConcept={setActiveConcept}
                  expandedConcepts={expandedConcepts}
                  setExpandedConcepts={setExpandedConcepts}
                  register={register}
                  setFormValue={setValue}
                  getFormValues={getValues}
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
              <UnableToEditTooltip canEdit={canEdit}>
                <Button
                  variant="contained"
                  type="submit"
                  color="primary"
                  disabled={!newConceptFound && !canEdit}
                >
                  Create
                </Button>
              </UnableToEditTooltip>
            </Stack>
          </Box>
        ) : (
          <div />
        )}
      </form>
    );
  }
}

interface NewConceptDropdownProps {
  product: Product;
  index: number;
  register: UseFormRegister<ProductModel>;
}

function NewConceptDropdown({
  product,
  index,
  register,
}: NewConceptDropdownProps) {
  return (
    <div key={'div-' + product.conceptId}>
      <Grid item xs={12}>
        {/*<Stack direction="row" spacing={1}>*/}
        <Grid item xs={12}>
          <InnerBoxSmall component="fieldset">
            <legend>FSN</legend>
            <TextField
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
  );
}

interface ConceptOptionsDropdownProps {
  product: Product;
  index: number;
  register: UseFormRegister<ProductModel>;
  handleConceptOptionsSubmit?: (concept: Concept) => void;
}

function ConceptOptionsDropdown({
  product,
  index,
  register
}: ConceptOptionsDropdownProps) {
  const { id, ticketId } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const ticket = useTicketById(ticketId, true, refreshKey);

  const task = useTaskById();
  const { serviceStatus } = useServiceStatus();

  const { productPreviewDetails, previewProduct} = useAuthoringStore();

  const [value, setValue] = React.useState(0);
  const [selectedConcept, setSelectedConcept] = useState<Concept>();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  
  const handleSelectChange = (event: SelectChangeEvent) => {
    console.log(event.target.value);
    const concept : Concept | undefined = product.conceptOptions.find(option => {
      return option.id === event.target.value
    });

    if(concept === undefined) return;
    setSelectedConcept(concept);
  };

  const handleSubmit = () => {
    const tempProductPreviewDetails = Object.assign( {},productPreviewDetails);
    if(tempProductPreviewDetails === undefined || selectedConcept?.conceptId === undefined) return;
    tempProductPreviewDetails.selectedConceptIdentifiers = [selectedConcept?.conceptId]
    previewProduct(tempProductPreviewDetails, ticket as Ticket, task?.branchPath as string, serviceStatus);
  }

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="New or existing concept"
        >
          <Tab label="Existing" />
          <Tab label="New" />
        </Tabs>
      </Box>
      <CustomTabPanel
        value={value}
        index={0}
        sx={{ paddingLeft: 0, paddingRight: 0 }}
      >
        <Stack sx={{ width: '100%', flexDirection: 'row' }}>
          <Select
            labelId="existing-concept-select"
            label="Existing Concepts"
            value={selectedConcept?.conceptId}
            sx={{ flexGrow: 1,  overflow: 'hidden', textOverflow: 'ellipsis' }}
            onChange={handleSelectChange}
          >
            {product.conceptOptions.map(option => {
              return (
                <MenuItem value={option.conceptId}>{option.fsn?.term}</MenuItem>
              );
            })}
          </Select>
          {/* if value, it is submittable */}
          {selectedConcept?.conceptId && 
          <IconButton color='success' onClick={() => {
            handleSubmit();
          }}>
            <RefreshIcon />
          </IconButton>
          }
          <IconButton disabled={selectedConcept === undefined} color='error' onClick={() => {
            setSelectedConcept(undefined);
            // setFormValue(`nodes[${index}].concept` as 'nodes.0.concept', null);
          }}>
            <ClearIcon />
          </IconButton>
        </Stack>
      </CustomTabPanel>
      <CustomTabPanel
        value={value}
        index={1}
        sx={{ paddingLeft: 0, paddingRight: 0 }}
      >
        {selectedConcept ? (
          <div>Please clear existing concept selection</div>
        ) : (
          <NewConceptDropdown
            product={product}
            index={index}
            register={register}
          />
        )}
      </CustomTabPanel>
    </>
  );
}

interface ExistingConceptDropdownProps {
  product: Product;
  fsnToggle: boolean;
}
function ExistingConceptDropdown({
  product,
  fsnToggle,
}: ExistingConceptDropdownProps) {
  return (
    <div key={`${product.conceptId}-div`}>
      <Stack direction="row" spacing={2}>
        <span style={{ color: '#184E6B' }}>Concept Id:</span>
        <Link>{product.conceptId}</Link>
      </Stack>
      <Stack direction="row" spacing={2}>
        <Typography style={{ color: '#184E6B' }}>
          {fsnToggle ? 'PT' : 'FSN'}:
        </Typography>
        <Typography>
          {fsnToggle ? product.concept?.pt?.term : product.concept?.fsn?.term}
        </Typography>
      </Stack>
    </div>
  );
}

function ProductHeaderWatch({
  control,
  index,
  fsnToggle,
  showHighLite,
  links,
  product,
  productModel,
  activeConcept,
}: {
  control: Control<ProductModel>;
  index: number;
  fsnToggle: boolean;
  showHighLite: boolean;
  links: Edge[];
  product: Product;
  productModel: ProductModel;
  activeConcept: string | undefined;
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
  // end of ProductHeaderWatch
}

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

interface ProductPanelProps {
  control: Control<ProductModel>;
  fsnToggle: boolean;
  product: Product;
  productModel: ProductModel;
  activeConcept: string | undefined;
  expandedConcepts: string[];
  setExpandedConcepts: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveConcept: React.Dispatch<React.SetStateAction<string | undefined>>;
  register: UseFormRegister<ProductModel>;
  setFormValue: UseFormSetValue<ProductModel>;
  getFormValues: UseFormGetValues<ProductModel>;
}

function ProductPanel({
  control,
  fsnToggle,
  productModel,
  activeConcept,
  product,
  expandedConcepts,
  setExpandedConcepts,
  setActiveConcept,
  register,
  setFormValue,
  getFormValues
}: ProductPanelProps) {
  const theme = useTheme();

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

  const getColorByDefinitionStatus = (): string => {
    if(product.conceptOptions.length > 0 && product.concept === null) {
      return '#F04134'
    }
    if (product.newConcept) {
      return '#00A854';
    }
    return product.concept?.definitionStatus === DefinitionStatus.Primitive
      ? '#99CCFF'
      : '#CCCCFF';
  };

  return (
    <Grid>
      <Accordion
        key={'accordion-' + product.conceptId}
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
                  links={links}
                  product={product}
                  productModel={productModel}
                  activeConcept={activeConcept}
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
                      key={'link-' + product.conceptId}
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
                        ? (product.concept?.fsn?.term as string)
                        : product.concept?.pt?.term}{' '}
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
                      links={links}
                      product={product}
                      productModel={productModel}
                      activeConcept={activeConcept}
                    />
                  ) : (
                    <Typography>
                      <span>
                        {fsnToggle
                          ? (product.concept?.fsn?.term as string)
                          : product.concept?.pt?.term}
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
                  <></>
                )}
              </Stack>
            </Grid>
          )}
        </AccordionSummary>
        <AccordionDetails key={'accordion-details-' + product.conceptId}>
          {/* A single concept exists, you do not have an option to make a new concept */}
          {product.concept &&
             (
              <ExistingConceptDropdown
                product={product}
                fsnToggle={fsnToggle}
              />
            )}
          {/* a new concept has to be made, as one does not exist */}
          {product.concept === null &&
            product.conceptOptions.length === 0 &&
            product.newConcept && (
              <NewConceptDropdown
                product={product}
                index={index}
                register={register}
              />
              // <ConceptOptionsDropdown
              //   product={product}
              //   index={index}
              //   register={register}
              //   setFormValue={setFormValue}
              //   getFormValues={getFormValues}
              // />
            )}
          {/* there is an option to pick a concept, but you could also create a new concept if you so desire. */}
          {product.concept === null &&
            product.conceptOptions.length > 0 &&
            product.newConcept && (
              <ConceptOptionsDropdown
                product={product}
                index={index}
                register={register}
              />
            )}
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}

interface ProductTypeGroupProps {
  productLabelItems: Product[];
  label: string;
  control: Control<ProductModel>;
  productModel: ProductModel;
  activeConcept: string | undefined;
  expandedConcepts: string[];
  setExpandedConcepts: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveConcept: React.Dispatch<React.SetStateAction<string | undefined>>;
  register: UseFormRegister<ProductModel>;
  setFormValue: UseFormSetValue<ProductModel>;
  getFormValues: UseFormGetValues<ProductModel>;
}

function ProductTypeGroup({
  productLabelItems,
  label,
  control,
  productModel,
  activeConcept,
  setActiveConcept,
  expandedConcepts,
  setExpandedConcepts,
  register,
  setFormValue,
  getFormValues
}: ProductTypeGroupProps) {
  const productGroupEnum: ProductGroupType =
    ProductGroupType[label as keyof typeof ProductGroupType];

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
        <AccordionDetails key={label + '-accordion'}>
          <div key={label + '-lists'}>
            {productLabelItems?.map((p, index) => {
              return (
                <ProductPanel
                  control={control}
                  fsnToggle={isFsnToggleOn()}
                  productModel={productModel}
                  activeConcept={activeConcept}
                  product={p}
                  expandedConcepts={expandedConcepts}
                  setExpandedConcepts={setExpandedConcepts}
                  setActiveConcept={setActiveConcept}
                  register={register}
                  key={`${p.conceptId}-${index}`}
                  setFormValue={setFormValue}
                  getFormValues={getFormValues}
                />
              );
            })}
          </div>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
export default ProductModelEdit;


