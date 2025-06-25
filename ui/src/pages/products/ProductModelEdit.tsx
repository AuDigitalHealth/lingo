import {
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  Concept,
  DefinitionStatus,
  Edge,
  hasDescriptionChange,
  Product,
  Product7BoxBGColour,
  ProductSummary
} from '../../types/concept.ts';
import {
  cleanBrandPackSizeDetails,
  cleanDevicePackageDetails,
  cleanPackageDetails,
  containsNewConcept,
  filterByLabel,
  findProductUsingId,
  findRelations,
  getProductDisplayName,
  isDeviceType,
  isFsnToggleOn,
  OWL_EXPRESSION_ID
} from '../../utils/helpers/conceptUtils.ts';
import { styled, useTheme } from '@mui/material/styles';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack } from '@mui/system';
import LinkViews from './components/LinkViews.tsx';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import Loading from '../../components/Loading.tsx';
import {
  Control,
  useForm,
  UseFormGetValues,
  UseFormRegister,
  UseFormWatch,
  useWatch
} from 'react-hook-form';

import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CircleIcon from '@mui/icons-material/Circle';
import {
  ActionType,
  BrandPackSizeCreationDetails,
  BulkProductCreationDetails,
  DevicePackageDetails,
  MedicationPackageDetails,
  ProductSaveDetails,
  ProductGroupType,
  ProductType
} from '../../types/product.ts';
import { Ticket } from '../../types/tickets/ticket.ts';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import useCanEditTask from '../../hooks/useCanEditTask.tsx';
import UnableToEditTooltip from '../tasks/components/UnableToEditTooltip.tsx';
import { useServiceStatus } from '../../hooks/api/useServiceStatus.tsx';
import CustomTabPanel from './components/CustomTabPanel.tsx';
import {
  getTicketBulkProductActionsByTicketIdOptions,
  getTicketProductsByTicketIdOptions,
  useTicketByTicketNumber
} from '../../hooks/api/tickets/useTicketById.tsx';
import useTaskById from '../../hooks/useTaskById.tsx';
import useAuthoringStore from '../../stores/AuthoringStore.ts';
import { uniqueFsnValidator, uniquePtValidator } from '../../types/productValidations.ts';
import WarningModal from '../../themes/overrides/WarningModal.tsx';
import { closeSnackbar } from 'notistack';
import ConceptDiagramModal from '../../components/conceptdiagrams/ConceptDiagramModal.tsx';
import { AccountTreeOutlined } from '@mui/icons-material';
import { validateProductSummaryNodes } from '../../types/productValidationUtils.ts';
import { useQueryClient } from '@tanstack/react-query';
import {
  getBulkAuthorBrandOptions,
  getBulkAuthorPackSizeOptions
} from '../../hooks/api/tickets/useTicketProduct.tsx';
import { bulkAuthorBrands, bulkAuthorPackSizes } from '../../types/queryKeys.ts';
import { isNameContainsKeywords } from '../../../cypress/e2e/helpers/product.ts';
import { useFieldBindings } from '../../hooks/api/useInitializeConfig.tsx';
import { FieldBindings } from '../../types/FieldBindings.ts';
import {
  useRefsetMembersByComponentIds
} from '../../hooks/api/refset/useRefsetMembersByComponentIds.tsx';
import { RefsetMember } from '../../types/RefsetMember.ts';
import productService from '../../api/ProductService.ts';
import ExistingConceptDropdown from './components/ExistingConceptDropdown.tsx';
import NewConceptDropdown from './components/NewConceptDropdown.tsx';
import { ProductStatusIndicators } from './components/ProductStatusIndicators.tsx';

interface ProductModelEditProps {
  productCreationDetails?: ProductSaveDetails;
  productModel: ProductSummary;
  handleClose?:
    | ((event: object, reason: 'backdropClick' | 'escapeKeyDown') => void)
    | (() => void);
  readOnlyMode: boolean;
  branch: string;
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
  const [idsWithInvalidName, setIdsWithInvalidName] = useState<string[]>([]);
  const { fieldBindingIsLoading, fieldBindings } = useFieldBindings(branch);

  const { refsetData, isRefsetLoading } = useRefsetMembersByComponentIds(
    branch,
    productModel.nodes
      .filter(i => parseInt(i.conceptId) > 0)
      .flatMap(i => i.conceptId),
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    watch,
    formState: { isSubmitting },
  } = useForm<ProductSummary>({
    defaultValues: {
      nodes: [],
      edges: [],
    },
  });

  const { canEdit, lockDescription } = useCanEditTask();

  const { setForceNavigation, selectedProductType, selectedActionType } =
    useAuthoringStore();
  const location = useLocation();
  const queryClient = useQueryClient();

  const invalidateQueriesById = (conceptId: string, branch: string) => {
    const bulkPackSizeQuery = getBulkAuthorPackSizeOptions(
      conceptId,
      branch,
    ).queryKey;
    void queryClient.invalidateQueries({ queryKey: bulkPackSizeQuery });
    const bulkBrandQuery = getBulkAuthorBrandOptions(
      conceptId,
      branch,
    ).queryKey;
    void queryClient.invalidateQueries({ queryKey: bulkBrandQuery });
  };

  const invalidateQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: [bulkAuthorPackSizes],
      exact: false,
    });
    void queryClient.invalidateQueries({
      queryKey: [bulkAuthorBrands],
      exact: false,
    });
  };

  const onSubmit = async (data: ProductSummary) => {
    if (errorKey) {
      closeSnackbar(errorKey);
      setErrorKey(undefined);
    }
    setLastValidatedData(data);
    const errKey = await validateProductSummaryNodes(
      data.nodes,
      branch,
      serviceStatus,
    );
    if (errKey) {
      setErrorKey(errKey as string);
      return;
    }
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
        productService
          .createDeviceProduct(productCreationDetails, branch)
          .then(v => {
            if (handleClose) handleClose({}, 'escapeKeyDown');
            setLoading(false);
            if (ticket) {
              void queryClient.invalidateQueries({
                queryKey: getTicketProductsByTicketIdOptions(
                  ticket.id.toString(),
                ).queryKey,
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
              `Product creation failed for [${usedData.subjects?.map(subject => subject?.preferredTerm || '').join(', ')}]`,
              serviceStatus,
            );
            setErrorKey(snackbarKey as string);
          });
      } else if (selectedActionType === ActionType.newMedication || selectedActionType === ActionType.newVaccine || selectedActionType === ActionType.newNutritionalProduct) {
        productCreationDetails.packageDetails = cleanPackageDetails(
          productCreationDetails.packageDetails as MedicationPackageDetails,
        );
        productService
          .saveMedicationProduct(productCreationDetails, branch)
          .then(v => {
            if (handleClose) handleClose({}, 'escapeKeyDown');
            setLoading(false);
            if (ticket) {
              void queryClient.invalidateQueries({
                queryKey: getTicketProductsByTicketIdOptions(
                  ticket.id.toString(),
                ).queryKey,
              });
            }
            invalidateQueries();
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
              `Product creation failed for [${usedData.subjects?.map(subject => subject?.preferredTerm || '').join(', ')}]`,
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
        productService
          .createNewMedicationBrandPackSizes(bulkProductCreationDetails, branch)
          .then(v => {
            if (handleClose) handleClose({}, 'escapeKeyDown');
            setLoading(false);
            if (ticket) {
              void queryClient.invalidateQueries({
                queryKey: getTicketBulkProductActionsByTicketIdOptions(
                  ticket.id.toString(),
                ).queryKey,
              });
            }
            invalidateQueriesById(
              bulkProductCreationDetails.details.productId,
              branch,
            );
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
              `Product creation failed for [${usedData.subjects?.map(subject => subject?.preferredTerm || '').join(', ')}]`,
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

  if (isLoading || fieldBindingIsLoading || isRefsetLoading) {
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
                      idsWithInvalidName={idsWithInvalidName}
                      setIdsWithInvalidName={setIdsWithInvalidName}
                      fieldBindings={fieldBindings}
                      branch={branch}
                      refsetData={refsetData}
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
                      idsWithInvalidName={idsWithInvalidName}
                      setIdsWithInvalidName={setIdsWithInvalidName}
                      fieldBindings={fieldBindings}
                      branch={branch}
                      refsetData={refsetData}
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
                      idsWithInvalidName={idsWithInvalidName}
                      setIdsWithInvalidName={setIdsWithInvalidName}
                      fieldBindings={fieldBindings}
                      branch={branch}
                      refsetData={refsetData}
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
                      disabled={
                        !newConceptFound ||
                        !canEdit ||
                        isSubmitting ||
                        idsWithInvalidName.length > 0
                      }
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

interface NewConceptDropdownFieldProps {
  register: UseFormRegister<ProductSummary>;
  originalValue: string;
  fieldName: string;
  legend: string;
  getValues: UseFormGetValues<ProductSummary>;
  dataTestId: string;
  control: Control<ProductSummary>;
}

interface ConceptOptionsDropdownProps {
  control: Control<ProductSummary>;
  product: Product;
  index: number;
  register: UseFormRegister<ProductSummary>;
  handleConceptOptionsSubmit?: (concept: Concept) => void;
  setOptionsIgnored: (bool: boolean) => void;
  getValues: UseFormGetValues<ProductSummary>;
  branch: string;
}

function ConceptOptionsDropdown({
  product,
  index,
  register,
  setOptionsIgnored,
  getValues,
  control,
  branch,
}: ConceptOptionsDropdownProps) {
  const { ticketNumber } = useParams();
  const { data: ticket } = useTicketByTicketNumber(ticketNumber, true);

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
            branch={branch}
          />
        )}
      </CustomTabPanel>
    </>
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
  handleChangeColor,
  partialNameCheckKeywords,
  nameGeneratorErrorKeywords,
}: {
  control: Control<ProductSummary>;
  index: number;
  fsnToggle: boolean;
  showHighLite: boolean;
  links: Edge[];
  product: Product;
  productModel: ProductSummary;
  activeConcept: string | undefined;
  handleChangeColor: (value: string) => void;
  partialNameCheckKeywords: string[];
  nameGeneratorErrorKeywords: string[];
}) {
  const pt = useWatch({
    control,
    name: `nodes[${index}].newConceptDetails.preferredTerm` as 'nodes.0.newConceptDetails.preferredTerm',
  });

  const fsn = useWatch({
    control,
    name: `nodes[${index}].newConceptDetails.fullySpecifiedName` as 'nodes.0.newConceptDetails.fullySpecifiedName',
  });
  if (product.newConcept) {
    if (
      (fsn && isNameContainsKeywords(fsn, nameGeneratorErrorKeywords)) ||
      (pt && isNameContainsKeywords(pt, nameGeneratorErrorKeywords))
    ) {
      handleChangeColor(Product7BoxBGColour.INVALID);
    } else if (
      (fsn && isNameContainsKeywords(fsn, partialNameCheckKeywords)) ||
      (pt && isNameContainsKeywords(pt, partialNameCheckKeywords))
    ) {
      handleChangeColor(Product7BoxBGColour.INCOMPLETE);
    } else {
      handleChangeColor(Product7BoxBGColour.NEW);
    }
  } else if (
    product.propertyUpdate ||
    product.inferredFormChanged ||
    product.statedFormChanged ||
    hasDescriptionChange(product)
  ) {
    handleChangeColor(Product7BoxBGColour.PROPERTY_CHANGE);
  }

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
  idsWithInvalidName: string[];
  setIdsWithInvalidName: (value: string[]) => void;
  fieldBindings: FieldBindings;
  branch: string;
  refsetMembers: RefsetMember[];
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
  idsWithInvalidName,
  setIdsWithInvalidName,
  fieldBindings,
  branch,
}: ProductPanelProps) {
  const theme = useTheme();
  const [conceptDiagramModalOpen, setConceptDiagramModalOpen] = useState(false);

  const links = activeConcept
    ? findRelations(productModel?.edges, activeConcept, product.conceptId)
    : [];

  const index = productModel.nodes.findIndex(
    x => x.conceptId === product.conceptId,
  );
  const partialNameCheckKeywords = fieldBindings
    ? (
        fieldBindings.bindingsMap.get(
          'product.nameGenerator.incompleteNameCheck.keywords',
        ) as string
      ).split(',')
    : [];

  const nameGeneratorErrorKeywords = fieldBindings
    ? (
        fieldBindings.bindingsMap.get(
          'product.nameGenerator.error.keywords',
        ) as string
      ).split(',')
    : [];

  const [optionsIgnored, setOptionsIgnored] = useState(false);
  const populateInvalidNameIds = (bgColor: string) => {
    if (bgColor) {
      if (bgColor === Product7BoxBGColour.INVALID) {
        if (!idsWithInvalidName.includes(product.conceptId)) {
          const temp = [...idsWithInvalidName];
          temp.push(product.conceptId);
          setIdsWithInvalidName(temp);
        }
      } else if (idsWithInvalidName.includes(product.conceptId)) {
        setIdsWithInvalidName(
          idsWithInvalidName.filter(id => id !== product.conceptId),
        );
      }
    }
  };
  const [bgColor, setBgColor] = useState<string>(
    getColorByDefinitionStatus(
      product,
      optionsIgnored,
      partialNameCheckKeywords,
      nameGeneratorErrorKeywords,
    ),
  );
  populateInvalidNameIds(bgColor);

  function showHighlite() {
    return links.length > 0;
  }

  const handleChangeColor = (color: string) => {
    populateInvalidNameIds(color);
    setBgColor(color);
  };

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

  return (
    <>
      <ConceptDiagramModal
        open={conceptDiagramModalOpen}
        handleClose={() => setConceptDiagramModalOpen(false)}
        newConcept={product.newConcept ? product.newConceptDetails : undefined}
        product={product}
        keepMounted={true}
        branch={branch}
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
              backgroundColor: bgColor,
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
                        handleChangeColor={handleChangeColor}
                        partialNameCheckKeywords={partialNameCheckKeywords}
                        nameGeneratorErrorKeywords={nameGeneratorErrorKeywords}
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
                    <ProductStatusIndicators product={product} />
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
                        handleChangeColor={handleChangeColor}
                        partialNameCheckKeywords={partialNameCheckKeywords}
                        nameGeneratorErrorKeywords={nameGeneratorErrorKeywords}
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
                    <ProductStatusIndicators product={product} />
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
              <ExistingConceptDropdown product={product} branch={branch} />
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
                  fieldBindings={fieldBindings}
                  branch={branch}
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
                  branch={branch}
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
  idsWithInvalidName: string[];
  setIdsWithInvalidName: (value: string[]) => void;
  fieldBindings: FieldBindings;
  branch: string;
  refsetData: RefsetMember[] | undefined;
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
  idsWithInvalidName,
  setIdsWithInvalidName,
  fieldBindings,
  branch,
  refsetData,
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
              const productRefSetMembers = p.newConcept
                ? p.newConceptDetails?.referenceSetMembers
                    ?.filter(r => r.refsetId !== OWL_EXPRESSION_ID)
                    .flatMap(r => r) || []
                : refsetData?.filter(
                    r =>
                      r.referencedComponentId === p.conceptId &&
                      r.refsetId !== OWL_EXPRESSION_ID,
                  ) || [];
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
                  idsWithInvalidName={idsWithInvalidName}
                  setIdsWithInvalidName={setIdsWithInvalidName}
                  fieldBindings={fieldBindings}
                  branch={branch}
                  refsetMembers={productRefSetMembers}
                />
              );
            })}
          </div>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
const getColorByDefinitionStatus = (
  product: Product,
  optionsIgnored: boolean,
  partialNameCheckKeywords: string[],
  nameGeneratorErrorKeywords: string[],
): string => {
  if (
    product.conceptOptions &&
    product.conceptOptions.length > 0 &&
    product.concept === null &&
    !optionsIgnored
  ) {
    return Product7BoxBGColour.INVALID;
  }
  if (product.newConcept) {
    if (
      (product.fullySpecifiedName &&
        isNameContainsKeywords(
          product.fullySpecifiedName.trim(),
          nameGeneratorErrorKeywords,
        )) ||
      (product.preferredTerm &&
        isNameContainsKeywords(
          product.preferredTerm.trim(),
          nameGeneratorErrorKeywords,
        ))
    ) {
      return Product7BoxBGColour.INVALID;
    } else if (
      (product.fullySpecifiedName &&
        isNameContainsKeywords(
          product.fullySpecifiedName.trim(),
          partialNameCheckKeywords,
        )) ||
      (product.preferredTerm &&
        isNameContainsKeywords(
          product.preferredTerm.trim(),
          partialNameCheckKeywords,
        ))
    ) {
      return Product7BoxBGColour.INCOMPLETE;
    }
    return Product7BoxBGColour.NEW;
  } else if (product.propertyUpdate) {
    return Product7BoxBGColour.PROPERTY_CHANGE;
  }
  return product.concept?.definitionStatus === DefinitionStatus.Primitive
    ? Product7BoxBGColour.PRIMITIVE
    : Product7BoxBGColour.FULLY_DEFINED;
};
export default ProductModelEdit;
