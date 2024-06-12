import {
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormHelperText,
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
  ProductSummary,
} from '../../types/concept.ts';
import {
  cleanBrandPackSizeDetails,
  cleanDevicePackageDetails,
  cleanPackageDetails,
  containsNewConcept,
  filterByLabel,
  filterKeypress,
  findProductUsingId,
  findRelations,
  getProductDisplayName,
  isDeviceType,
  isFsnToggleOn,
  setEmptyToNull,
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
import {
  Control,
  Controller,
  useForm,
  UseFormGetValues,
  UseFormRegister,
  UseFormWatch,
  useWatch,
} from 'react-hook-form';

import conceptService from '../../api/ConceptService.ts';

import { useNavigate } from 'react-router';
import CircleIcon from '@mui/icons-material/Circle';
import {
  ActionType,
  BrandPackSizeCreationDetails,
  BulkProductCreationDetails,
  DevicePackageDetails,
  MedicationPackageDetails,
  ProductCreationDetails,
  ProductGroupType,
  ProductType,
} from '../../types/product.ts';
import useTicketStore from '../../stores/TicketStore.ts';
import { Ticket } from '../../types/tickets/ticket.ts';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import useCanEditTask from '../../hooks/useCanEditTask.tsx';
import UnableToEditTooltip from '../tasks/components/UnableToEditTooltip.tsx';
import { useServiceStatus } from '../../hooks/api/useServiceStatus.tsx';
import TicketProductService from '../../api/TicketProductService.ts';
import CustomTabPanel from './components/CustomTabPanel.tsx';
import useTicketDtoById from '../../hooks/useTicketById.tsx';

import { useLocation, useParams } from 'react-router-dom';
import useTaskById from '../../hooks/useTaskById.tsx';
import useAuthoringStore from '../../stores/AuthoringStore.ts';
import {
  uniqueFsnValidator,
  uniquePtValidator,
} from '../../types/productValidations.ts';
import WarningModal from '../../themes/overrides/WarningModal.tsx';
import { closeSnackbar } from 'notistack';
import ConceptDiagramModal from '../../components/conceptdiagrams/ConceptDiagramModal.tsx';
import {
  AccountTreeOutlined,
  NewReleases,
  NewReleasesOutlined,
} from '@mui/icons-material';
import { FormattedMessage } from 'react-intl';

interface ProductModelEditProps {
  productCreationDetails?: ProductCreationDetails;
  productModel: ProductSummary;
  handleClose?:
    | ((event: object, reason: 'backdropClick' | 'escapeKeyDown') => void)
    | (() => void);
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

  const [ignoreErrors, setIgnoreErrors] = useState(false);
  const [ignoreErrorsModalOpen, setIgnoreErrorsModalOpen] = useState(false);
  const [lastValidatedData, setLastValidatedData] = useState<ProductSummary>();
  const [errorKey, setErrorKey] = useState<string | undefined>();

  const { register, handleSubmit, reset, control, getValues, watch } =
    useForm<ProductSummary>({
      defaultValues: {
        nodes: [],
        edges: [],
      },
    });
  const { mergeTicket: mergeTickets } = useTicketStore();

  const { canEdit, lockDescription } = useCanEditTask();

  const { setForceNavigation, selectedProductType, selectedActionType } =
    useAuthoringStore();
  const location = useLocation();

  const onSubmit = (data: ProductSummary) => {
    setLastValidatedData(data);
    const fsnWarnings = uniqueFsnValidator(data.nodes);
    const ptWarnings = uniquePtValidator(data.nodes);
    if (!ignoreErrors && (fsnWarnings || ptWarnings)) {
      setIgnoreErrorsModalOpen(true);
      return;
    }

    submitData(data);
  };

  const getProductViewUrl = () => {
    if (
      location &&
      location.pathname &&
      location.pathname.endsWith('/product/edit')
    ) {
      //handle from edit screen
      return location.pathname.replace('/product/edit', '/product/view');
    }
    return 'view';
  };

  const submitData = (data?: ProductSummary) => {
    const usedData = data ? data : lastValidatedData;
    if (errorKey) {
      closeSnackbar(errorKey);
      setErrorKey(undefined);
    }
    if (
      !readOnlyMode &&
      newConceptFound &&
      productCreationDetails &&
      usedData
    ) {
      setForceNavigation(true);
      productCreationDetails.productSummary = usedData;
      setLoading(true);
      if (isDeviceType(selectedProductType)) {
        productCreationDetails.packageDetails = cleanDevicePackageDetails(
          productCreationDetails.packageDetails as DevicePackageDetails,
        );
        conceptService
          .createDeviceProduct(productCreationDetails, branch as string)
          .then(v => {
            if (handleClose) handleClose({}, 'escapeKeyDown');
            setLoading(false);
            if (ticket) {
              void TicketProductService.getTicketProducts(ticket.id).then(p => {
                ticket.products = p;
                mergeTickets(ticket);
              });
            }
            // TODO: make this ignore

            navigate(
              `${getProductViewUrl()}/${(v.subjects?.values().next().value as Concept).conceptId}`,
              {
                state: { productModel: v, branch: branch },
              },
            );
          })
          .catch(err => {
            setForceNavigation(false);
            setLoading(false);
            const snackbarKey = snowstormErrorHandler(
              err,
              `Product creation failed for  [${usedData.subjects?.map(subject => subject.preferredTerm)}]`,
              serviceStatus,
            );
            setErrorKey(snackbarKey as string);
          });
      } else if (selectedActionType === ActionType.newProduct) {
        productCreationDetails.packageDetails = cleanPackageDetails(
          productCreationDetails.packageDetails as MedicationPackageDetails,
        );
        conceptService
          .createNewMedicationProduct(productCreationDetails, branch as string)
          .then(v => {
            if (handleClose) handleClose({}, 'escapeKeyDown');
            setLoading(false);
            if (ticket) {
              void TicketProductService.getTicketProducts(ticket.id).then(p => {
                ticket.products = p;
                mergeTickets(ticket);
              });
            }
            // TODO: make this ignore

            navigate(
              `${getProductViewUrl()}/${(v.subjects?.values().next().value as Concept).conceptId}`,
              {
                state: { productModel: v, branch: branch },
              },
            );
          })
          .catch(err => {
            setForceNavigation(false);
            setLoading(false);
            const snackbarKey = snowstormErrorHandler(
              err,
              `Product creation failed for  [${usedData.subjects?.map(subject => subject.preferredTerm)}]`,
              serviceStatus,
            );
            setErrorKey(snackbarKey as string);
          });
      } else {
        const bulkProductCreationDetails = {
          details:
            productCreationDetails.packageDetails as BrandPackSizeCreationDetails,
          productSummary: productCreationDetails.productSummary,
          ticketId: productCreationDetails.ticketId,
        } as BulkProductCreationDetails;
        bulkProductCreationDetails.details = cleanBrandPackSizeDetails(
          bulkProductCreationDetails.details,
        );
        conceptService
          .createNewMedicationBrandPackSizes(
            bulkProductCreationDetails,
            branch as string,
          )
          .then(v => {
            if (handleClose) handleClose({}, 'escapeKeyDown');
            setLoading(false);
            if (ticket) {
              void TicketProductService.getTicketProducts(ticket.id).then(p => {
                ticket.products = p;
                mergeTickets(ticket);
              });
            }
            // TODO: make this ignore

            navigate(
              `${getProductViewUrl()}/${(v.subjects?.values().next().value as Concept).conceptId}`,
              {
                state: { productModel: v, branch: branch },
              },
            );
          })
          .catch(err => {
            setForceNavigation(false);
            setLoading(false);
            const snackbarKey = snowstormErrorHandler(
              err,
              `Product creation failed for  [${usedData.subjects?.map(subject => subject.preferredTerm)}]`,
              serviceStatus,
            );
            setErrorKey(snackbarKey as string);
          });
      }
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
        message={`Creating New Product [${getProductDisplayName(productModel)}]`}
      />
    );
  } else {
    return (
      <>
        <WarningModal
          open={ignoreErrorsModalOpen}
          content={`At least one FSN or PT is the same as another FSN or PT. Is this correct?`}
          handleClose={() => {
            setIgnoreErrorsModalOpen(false);
          }}
          disabled={false}
          action={'Ignore Duplicates'}
          handleAction={() => {
            setIgnoreErrors(true);
            setIgnoreErrorsModalOpen(false);
            submitData();
          }}
        />
        <Box width={'100%'}>
          <form onSubmit={event => void handleSubmit(onSubmit)(event)}>
            <Box
              sx={{ width: '100%' }}
              id={'product-view'}
              data-testid={'product-view'}
            >
              <Grid
                container
                rowSpacing={1}
                columnSpacing={{ xs: 1, sm: 2, md: 3 }}
              >
                <Grid xs={6} key={'left'} item={true}>
                  {lableTypesLeft.map((label, index) => (
                    <ProductTypeGroup
                      key={`left-${label}-${index}`}
                      productLabelItems={filterByLabel(
                        productModel?.nodes,
                        label,
                      )}
                      label={label}
                      control={control}
                      productModel={productModel}
                      activeConcept={activeConcept}
                      setActiveConcept={setActiveConcept}
                      expandedConcepts={expandedConcepts}
                      setExpandedConcepts={setExpandedConcepts}
                      getValues={getValues}
                      register={register}
                      watch={watch}
                    />
                  ))}
                </Grid>
                <Grid xs={6} key={'right'} item={true}>
                  {lableTypesRight.map((label, index) => (
                    <ProductTypeGroup
                      key={`left-${label}-${index}`}
                      productLabelItems={filterByLabel(
                        productModel?.nodes,
                        label,
                      )}
                      label={label}
                      control={control}
                      productModel={productModel}
                      activeConcept={activeConcept}
                      setActiveConcept={setActiveConcept}
                      expandedConcepts={expandedConcepts}
                      setExpandedConcepts={setExpandedConcepts}
                      register={register}
                      watch={watch}
                      getValues={getValues}
                    />
                  ))}
                </Grid>
                <Grid xs={12} key={'bottom'} item={true}>
                  {lableTypesCentre.map((label, index) => (
                    <ProductTypeGroup
                      key={`left-${label}-${index}`}
                      productLabelItems={filterByLabel(
                        productModel?.nodes,
                        label,
                      )}
                      label={label}
                      control={control}
                      productModel={productModel}
                      activeConcept={activeConcept}
                      setActiveConcept={setActiveConcept}
                      expandedConcepts={expandedConcepts}
                      setExpandedConcepts={setExpandedConcepts}
                      register={register}
                      watch={watch}
                      getValues={getValues}
                    />
                  ))}
                </Grid>
              </Grid>
            </Box>
            {!readOnlyMode ? (
              <Box m={1} p={1}>
                <Stack spacing={2} direction="row" justifyContent="end">
                  <Button
                    data-testid={'preview-cancel'}
                    variant="contained"
                    type="button"
                    color="error"
                    onClick={() =>
                      handleClose && handleClose({}, 'escapeKeyDown')
                    }
                  >
                    Cancel
                  </Button>
                  <UnableToEditTooltip
                    canEdit={canEdit}
                    lockDescription={lockDescription}
                  >
                    <Button
                      variant="contained"
                      type="submit"
                      color="primary"
                      disabled={!newConceptFound || !canEdit}
                      data-testid={'create-product-btn'}
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
        </Box>
      </>
    );
  }
}

interface NewConceptDropdownProps {
  product: Product;
  index: number;
  register: UseFormRegister<ProductSummary>;
  getValues: UseFormGetValues<ProductSummary>;
  control: Control<ProductSummary>;
}

function NewConceptDropdown({
  product,
  index,
  register,
  getValues,
  control,
}: NewConceptDropdownProps) {
  return (
    <div key={'div-' + product.conceptId}>
      <Grid item xs={12}>
        <Grid item xs={12}>
          <NewConceptDropdownField
            fieldName={`nodes[${index}].newConceptDetails.fullySpecifiedName`}
            originalValue={product.newConceptDetails.fullySpecifiedName}
            register={register}
            legend={'FSN'}
            getValues={getValues}
            dataTestId={`fsn-input`}
            control={control}
          />
        </Grid>
        <NewConceptDropdownField
          fieldName={`nodes[${index}].newConceptDetails.preferredTerm`}
          originalValue={product.newConceptDetails.preferredTerm}
          register={register}
          legend={'Preferred Term'}
          getValues={getValues}
          dataTestId={`pt-input`}
          control={control}
        />
        <InnerBoxSmall component="fieldset">
          <legend>Specified Concept Id</legend>
          <TextField
            {...register(
              `nodes[${index}].newConceptDetails.specifiedConceptId` as 'nodes.0.newConceptDetails.specifiedConceptId',
              { required: false, setValueAs: setEmptyToNull },
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

interface NewConceptDropdownFieldProps {
  register: UseFormRegister<ProductSummary>;
  originalValue: string;
  fieldName: string;
  legend: string;
  getValues: UseFormGetValues<ProductSummary>;
  dataTestId: string;
  control: Control<ProductSummary>;
}

function NewConceptDropdownField({
  originalValue,
  fieldName,
  legend,
  getValues,
  dataTestId,
  control,
}: NewConceptDropdownFieldProps) {
  const [fieldChanged, setFieldChange] = useState(false);

  const handleBlur = () => {
    const currentVal = getValues(
      fieldName as 'nodes.0.newConceptDetails.preferredTerm',
    );
    setFieldChange(currentVal !== originalValue);
  };

  return (
    <InnerBoxSmall component="fieldset">
      <legend>{legend}</legend>

      <Controller
        name={fieldName as 'nodes.0.newConceptDetails.preferredTerm'}
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextField
            {...field}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            margin="dense"
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            data-testid={dataTestId}
            color={fieldChanged ? 'error' : 'primary'}
            onBlur={handleBlur}
          />
        )}
      />
      {fieldChanged && (
        <FormHelperText sx={{ color: t => `${t.palette.warning.main}` }}>
          This name has been changed from the auto-generated name.
        </FormHelperText>
      )}
    </InnerBoxSmall>
  );
}

interface ConceptOptionsDropdownProps {
  control: Control<ProductSummary>;
  product: Product;
  index: number;
  register: UseFormRegister<ProductSummary>;
  handleConceptOptionsSubmit?: (concept: Concept) => void;
  setOptionsIgnored: (bool: boolean) => void;
  getValues: UseFormGetValues<ProductSummary>;
}

function ConceptOptionsDropdown({
  product,
  index,
  register,
  setOptionsIgnored,
  getValues,
  control,
}: ConceptOptionsDropdownProps) {
  const { ticketId } = useParams();
  const { ticket } = useTicketDtoById(ticketId);

  const task = useTaskById();
  const { serviceStatus } = useServiceStatus();

  const {
    productPreviewDetails,
    devicePreviewDetails,
    previewMedicationProduct,
    previewDeviceProduct,
    selectedProductType,
  } = useAuthoringStore();

  const [tabValue, setTabValue] = React.useState(0);
  const [selectedConcept, setSelectedConcept] = useState<Concept>();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setOptionsIgnored(newValue === 1 ? true : false);
    setTabValue(newValue);
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    console.log(event.target.value);
    const concept: Concept | undefined = product.conceptOptions.find(option => {
      return option.id === event.target.value;
    });

    if (concept === undefined) return;
    setSelectedConcept(concept);
  };

  const handleSubmit = () => {
    if (selectedProductType === ProductType.device) {
      return handleDeviceProductSubmit();
    }
    const tempProductPreviewDetails = Object.assign({}, productPreviewDetails);
    if (
      tempProductPreviewDetails === undefined ||
      selectedConcept?.conceptId === undefined
    )
      return;
    tempProductPreviewDetails.selectedConceptIdentifiers = [
      selectedConcept?.conceptId,
    ];

    previewMedicationProduct(
      tempProductPreviewDetails,
      ticket as Ticket,
      task?.branchPath as string,
      serviceStatus,
    );
  };
  const handleDeviceProductSubmit = () => {
    const tempProductPreviewDetails = Object.assign({}, devicePreviewDetails);
    if (
      tempProductPreviewDetails === undefined ||
      selectedConcept?.conceptId === undefined
    )
      return;
    tempProductPreviewDetails.selectedConceptIdentifiers = [
      selectedConcept?.conceptId,
    ];

    previewDeviceProduct(
      tempProductPreviewDetails,
      ticket as Ticket,
      task?.branchPath as string,
      serviceStatus,
    );
  };

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleChange}
          aria-label="New or existing concept"
        >
          <Tab label="Existing" />
          <Tab label="New" />
        </Tabs>
      </Box>
      <CustomTabPanel
        value={tabValue}
        index={0}
        sx={{ paddingLeft: 0, paddingRight: 0 }}
      >
        <Stack sx={{ width: '100%', flexDirection: 'row' }}>
          <Select
            data-testid={'existing-concepts-select'}
            labelId="existing-concept-select"
            label="Existing Concepts"
            value={selectedConcept?.conceptId}
            sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
            onChange={handleSelectChange}
          >
            {product.conceptOptions.map((option, index) => {
              return (
                <MenuItem
                  value={option.conceptId}
                  data-testid={`existing-concept-option-${index}`}
                >
                  {option.fsn?.term}
                </MenuItem>
              );
            })}
          </Select>
          {/* if value, it is submittable */}
          {selectedConcept?.conceptId && (
            <IconButton
              color="success"
              onClick={() => {
                handleSubmit();
              }}
            >
              <RefreshIcon />
            </IconButton>
          )}
          <IconButton
            disabled={selectedConcept === undefined}
            color="error"
            onClick={() => {
              setSelectedConcept(undefined);
              // setFormValue(`nodes[${index}].concept` as 'nodes.0.concept', null);
            }}
          >
            <ClearIcon />
          </IconButton>
        </Stack>
      </CustomTabPanel>
      <CustomTabPanel
        value={tabValue}
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
            getValues={getValues}
            control={control}
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
  control: Control<ProductSummary>;
  index: number;
  fsnToggle: boolean;
  showHighLite: boolean;
  links: Edge[];
  product: Product;
  productModel: ProductSummary;
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
  control: Control<ProductSummary>;
  fsnToggle: boolean;
  product: Product;
  productModel: ProductSummary;
  activeConcept: string | undefined;
  expandedConcepts: string[];
  setExpandedConcepts: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveConcept: React.Dispatch<React.SetStateAction<string | undefined>>;
  register: UseFormRegister<ProductSummary>;
  getValues: UseFormGetValues<ProductSummary>;
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
  getValues,
}: ProductPanelProps) {
  const theme = useTheme();
  const [conceptDiagramModalOpen, setConceptDiagramModalOpen] = useState(false);
  const links = activeConcept
    ? findRelations(productModel?.edges, activeConcept, product.conceptId)
    : [];

  const index = productModel.nodes.findIndex(
    x => x.conceptId === product.conceptId,
  );

  const [optionsIgnored, setOptionsIgnored] = useState(false);

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
    if (
      product.conceptOptions &&
      product.conceptOptions.length > 0 &&
      product.concept === null &&
      !optionsIgnored
    ) {
      return '#F04134';
    }
    if (product.newConcept) {
      return '#00A854';
    }
    return product.concept?.definitionStatus === DefinitionStatus.Primitive
      ? '#99CCFF'
      : '#CCCCFF';
  };

  return (
    <>
      <ConceptDiagramModal
        open={conceptDiagramModalOpen}
        handleClose={() => setConceptDiagramModalOpen(false)}
        newConcept={product.newConcept ? product.newConceptDetails : undefined}
        concept={product.concept}
        keepMounted={true}
      />
      <Grid>
        <Accordion
          key={'accordion-' + product.conceptId}
          data-testid="accodion-product"
          onChange={() => accordionClicked(product.conceptId)}
          expanded={expandedConcepts.includes(product.conceptId)}
        >
          <AccordionSummary
            data-testid="accodion-product-summary"
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
                  <Grid container justifyContent="flex-end" alignItems="center">
                    {product.newInTask ? (
                      <Tooltip
                        title={
                          <FormattedMessage
                            id="changed-in-task"
                            defaultMessage="Un-promoted changes in the task"
                          />
                        }
                      >
                        <NewReleases />
                      </Tooltip>
                    ) : product.newInProject ? (
                      <Tooltip
                        title={
                          <FormattedMessage
                            id="changed-in-project"
                            defaultMessage="Unreleased changes in the project"
                          />
                        }
                      >
                        <NewReleasesOutlined />
                      </Tooltip>
                    ) : null}
                    <IconButton
                      size="small"
                      onClick={() => setConceptDiagramModalOpen(true)}
                    >
                      <AccountTreeOutlined />
                    </IconButton>
                  </Grid>
                </Stack>
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
                  <Grid container justifyContent="flex-end" alignItems="center">
                    {activeConcept === product.conceptId ? (
                      <CircleIcon
                        style={{ color: theme.palette.warning.light }}
                      />
                    ) : (
                      <></>
                    )}
                    {product.newInTask ? (
                      <Tooltip
                        title={
                          <FormattedMessage
                            id="changed-in-task"
                            defaultMessage="Unpromoted changes in the task"
                          />
                        }
                      >
                        <NewReleases />
                      </Tooltip>
                    ) : product.newInProject ? (
                      <Tooltip
                        title={
                          <FormattedMessage
                            id="changed-in-project"
                            defaultMessage="Unreleased changes in the project"
                          />
                        }
                      >
                        <NewReleasesOutlined />
                      </Tooltip>
                    ) : null}
                    <IconButton
                      size="small"
                      onClick={() => setConceptDiagramModalOpen(true)}
                    >
                      <AccountTreeOutlined />
                    </IconButton>
                  </Grid>
                </Stack>
              </Grid>
            )}
          </AccordionSummary>
          <AccordionDetails key={'accordion-details-' + product.conceptId}>
            {/* A single concept exists, you do not have an option to make a new concept */}
            {product.concept && (
              <ExistingConceptDropdown
                product={product}
                fsnToggle={fsnToggle}
              />
            )}
            {/* a new concept has to be made, as one does not exist */}
            {product.concept === null &&
              product.conceptOptions &&
              product.conceptOptions.length === 0 &&
              product.newConcept && (
                <NewConceptDropdown
                  product={product}
                  index={index}
                  register={register}
                  getValues={getValues}
                  control={control}
                />
              )}
            {/* there is an option to pick a concept, but you could also create a new concept if you so desire. */}
            {product.concept === null &&
              product.conceptOptions &&
              product.conceptOptions.length > 0 &&
              product.newConcept && (
                <ConceptOptionsDropdown
                  product={product}
                  index={index}
                  register={register}
                  setOptionsIgnored={setOptionsIgnored}
                  control={control}
                  getValues={getValues}
                />
              )}
          </AccordionDetails>
        </Accordion>
      </Grid>
    </>
  );
}

interface ProductTypeGroupProps {
  productLabelItems: Product[];
  label: string;
  control: Control<ProductSummary>;
  productModel: ProductSummary;
  activeConcept: string | undefined;
  expandedConcepts: string[];
  setExpandedConcepts: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveConcept: React.Dispatch<React.SetStateAction<string | undefined>>;
  register: UseFormRegister<ProductSummary>;
  watch: UseFormWatch<ProductSummary>;
  getValues: UseFormGetValues<ProductSummary>;
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
  getValues,
}: ProductTypeGroupProps) {
  const productGroupEnum: ProductGroupType =
    ProductGroupType[label as keyof typeof ProductGroupType];

  return (
    <Grid>
      <Accordion defaultExpanded={true} data-testid={`product-group-${label}`}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography data-testid={`product-group-title-${label}`}>
            {productGroupEnum}
          </Typography>
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
                  getValues={getValues}
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
