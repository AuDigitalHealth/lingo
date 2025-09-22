import {
  Control,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import {
  Concept,
  Edge,
  hasDescriptionChange,
  Product,
  ProductSummary,
} from '../../../types/concept.ts';
import React, { useState } from 'react';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import { RefsetMember } from '../../../types/RefsetMember.ts';
import { useTheme } from '@mui/material/styles';
import {
  findProductUsingId,
  findRelations,
  isNewConcept,
} from '../../../utils/helpers/conceptUtils.ts';
import ConceptDiagramModal from '../../../components/conceptdiagrams/ConceptDiagramModal.tsx';
import {
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack } from '@mui/system';
import LinkViews from './LinkViews.tsx';
import { AccountTreeOutlined, Edit, NotesOutlined } from '@mui/icons-material';
import CircleIcon from '@mui/icons-material/Circle';
import ExistingConceptDropdown from './ExistingConceptDropdown.tsx';
import NewConceptDropdown from './NewConceptDropdown.tsx';

import { useParams } from 'react-router-dom';
import { useTicketByTicketNumber } from '../../../hooks/api/tickets/useTicketById.tsx';
import useTaskByKey from '../../../hooks/useTaskByKey.tsx';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
import { ProductType } from '../../../types/product.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import CustomTabPanel from './CustomTabPanel.tsx';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import { ProductPreviewAccordion } from './ProductPreviewAccordion.tsx';
import {
  getColorByDefinitionStatus,
  isNameContainsKeywords,
} from '../../../utils/helpers/ProductPreviewUtils.ts';
import ProductEditModal from '../../../components/editProduct/ProductEditModal.tsx';
import { ProductStatusIndicators } from './ProductStatusIndicators.tsx';
import { ProductRetireView } from './ProductRetireView.tsx';
import { useConceptsForReview } from '../../../hooks/api/task/useConceptsForReview.js';
import ConceptReviews from './reviews/ConceptReviews.tsx';
import ProductLoader from './ProductLoader.tsx';
import { useShowReviewControls } from '../../../hooks/api/task/useReviews.tsx';
import DescriptionModal from '../../../components/editProduct/DescriptionModal.tsx';
import { Product7BoxBGColour } from './style/colors.ts';

interface ProductPreviewPanelProps {
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
  isSimpleEdit: boolean;
  setValue: UseFormSetValue<ProductSummary>;
  ticket?: Ticket;
}

function ProductPreviewPanel({
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
  isSimpleEdit,
  setValue,
  branch,
  ticket,
}: ProductPreviewPanelProps) {
  const theme = useTheme();
  const task = useTaskByKey();
  const showReviewControls = useShowReviewControls({ task });
  const [conceptDiagramModalOpen, setConceptDiagramModalOpen] = useState(false);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [conceptRefsetModalOpen, setConceptRefsetModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { conceptReviews, isLoadingConceptReviews } =
    useConceptsForReview(branch);
  const filteredConceptReviews = conceptReviews
    ? conceptReviews.find(c => c.conceptId === product.conceptId)
    : undefined;

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
  const isSubject = productModel.subjects.some(
    s => s.conceptId === product.conceptId,
  );
  const productTitle = fsnToggle
    ? (product.concept?.fsn?.term as string)
    : product.concept?.pt?.term;

  const populateInvalidNameIds = (bgColor: string) => {
    if (bgColor) {
      if (bgColor === Product7BoxBGColour.INVALID && !optionsIgnored) {
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
  const isEditingCTPP = isSimpleEdit && product.label === 'CTPP';
  const shouldRenderDropdownAsReadonly = product.concept && product.conceptId;

  const ctppId = productModel.subjects.find(subj => {
    return subj.conceptId;
  })?.conceptId;

  if (isLoadingConceptReviews) {
    <ProductLoader message={'Loading'} />;
  }

  return (
    <>
      <ConceptDiagramModal
        open={conceptDiagramModalOpen}
        handleClose={() => setConceptDiagramModalOpen(false)}
        newConcept={
          product.newConceptDetails ? product.newConceptDetails : undefined
        }
        product={product}
        keepMounted={true}
        branch={branch}
      />
      <DescriptionModal
        handleClose={() => setDescriptionModalOpen(false)}
        open={descriptionModalOpen}
        product={product}
        keepMounted={false}
        branch={branch}
      />
      {isSimpleEdit && ticket && (
        <ProductEditModal
          isCtpp={isEditingCTPP}
          open={editModalOpen}
          handleClose={() => setEditModalOpen(false)}
          product={product}
          keepMounted={false}
          branch={branch}
          ticket={ticket}
          sevenBoxConceptId={ctppId}
        />
      )}

      <Grid>
        <ProductPreviewAccordion
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
                    {isNewConcept(product) ? (
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
                        optionsIgnored={optionsIgnored}
                        isSubject={isSubject}
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
                          <span
                            style={{
                              fontWeight: isSubject ? 'bold' : 'normal',
                            }}
                          >
                            {productTitle}
                          </span>
                        </Typography>
                      </Tooltip>
                    )}
                  </Grid>
                  <Grid container justifyContent="flex-end" alignItems="center">
                    {showReviewControls && (
                      <ConceptReviews
                        conceptReview={filteredConceptReviews}
                        branch={branch}
                        ticket={ticket}
                      />
                    )}
                    <ProductStatusIndicators product={product} />
                    <ProductRetireView
                      product={product}
                      index={index}
                      control={control}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setConceptDiagramModalOpen(true)}
                    >
                      <AccountTreeOutlined />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDescriptionModalOpen(true)}
                    >
                      <NotesOutlined />
                    </IconButton>
                    {isSimpleEdit && (
                      <IconButton
                        size="small"
                        onClick={() => setEditModalOpen(true)}
                      >
                        <Edit />
                      </IconButton>
                    )}
                  </Grid>
                </Stack>
              </Grid>
            ) : (
              <Grid xs={40} item={true}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Grid item xs={10}>
                    {isNewConcept(product) ? (
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
                        optionsIgnored={optionsIgnored}
                        isSubject={isSubject}
                      />
                    ) : (
                      <Typography>
                        <span
                          style={{
                            fontWeight: isSubject ? 'bold' : 'normal',
                          }}
                        >
                          {productTitle}
                        </span>
                      </Typography>
                    )}
                  </Grid>
                  <Grid container justifyContent="flex-end" alignItems="center">
                    {showReviewControls && (
                      <ConceptReviews
                        conceptReview={filteredConceptReviews}
                        branch={branch}
                        ticket={ticket}
                      />
                    )}

                    {activeConcept === product.conceptId ? (
                      <CircleIcon
                        style={{ color: theme.palette.warning.light }}
                      />
                    ) : (
                      <></>
                    )}
                    <ProductStatusIndicators product={product} />
                    <ProductRetireView
                      product={product}
                      index={index}
                      control={control}
                    />

                    <IconButton
                      size="small"
                      onClick={() => setConceptDiagramModalOpen(true)}
                    >
                      <AccountTreeOutlined />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDescriptionModalOpen(true)}
                    >
                      <NotesOutlined />
                    </IconButton>
                    {isSimpleEdit && (
                      <IconButton
                        size="small"
                        onClick={() => setEditModalOpen(true)}
                      >
                        <Edit />
                      </IconButton>
                    )}
                  </Grid>
                </Stack>
              </Grid>
            )}
          </AccordionSummary>
          <AccordionDetails key={'accordion-details-' + product.conceptId}>
            {/* A single concept exists, you do not have an option to make a new concept */}
            {shouldRenderDropdownAsReadonly && (
              <ExistingConceptDropdown
                product={product}
                branch={branch}
                control={control}
                index={index}
                setValue={setValue}
              />
            )}
            {/* a new concept has to be made, as one does not exist */}
            {product.concept === null &&
              product.conceptOptions &&
              product.conceptOptions.length === 0 &&
              isNewConcept(product) && (
                <NewConceptDropdown
                  product={product}
                  index={index}
                  register={register}
                  getValues={getValues}
                  control={control}
                  fieldBindings={fieldBindings}
                  branch={branch}
                  setValue={setValue}
                />
              )}
            {/*there is an option to pick a concept, but you could also create a new concept if you so desire.*/}
            {product.concept === null &&
              product.conceptOptions &&
              product.conceptOptions.length > 0 &&
              isNewConcept(product) && (
                <ConceptOptionsDropdown
                  product={product}
                  index={index}
                  register={register}
                  setOptionsIgnored={setOptionsIgnored}
                  control={control}
                  getValues={getValues}
                  fieldBindings={fieldBindings}
                  branch={branch}
                  setValue={setValue}
                />
              )}
          </AccordionDetails>
        </ProductPreviewAccordion>
      </Grid>
    </>
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
  fieldBindings: FieldBindings;
  branch: string;
  setValue: UseFormSetValue<ProductSummary>;
}
function ConceptOptionsDropdown({
  product,
  index,
  register,
  setOptionsIgnored,
  getValues,
  control,
  fieldBindings,
  branch,
  setValue,
}: ConceptOptionsDropdownProps) {
  const { ticketNumber } = useParams();
  const { data: ticket } = useTicketByTicketNumber(ticketNumber, true);

  const task = useTaskByKey();
  const { serviceStatus } = useServiceStatus();

  const {
    productPreviewDetails,
    devicePreviewDetails,
    previewMedicationProduct,
    previewDeviceProduct,
    selectedProductType,
    selectedConceptIdentifiers,
    setSelectedConceptIdentifiers,
  } = useAuthoringStore();

  const [tabValue, setTabValue] = React.useState(0);
  const [selectedConcept, setSelectedConcept] = useState<Concept>();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setOptionsIgnored(newValue === 1 ? true : false);
    setTabValue(newValue);
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
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

    const updatedConcepts = [
      ...(selectedConceptIdentifiers ?? []),
      selectedConcept?.conceptId,
    ];
    tempProductPreviewDetails.selectedConceptIdentifiers = updatedConcepts;
    setSelectedConceptIdentifiers(updatedConcepts);

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
    const updatedConcepts = [
      ...(selectedConceptIdentifiers ?? []),
      selectedConcept?.conceptId,
    ];
    tempProductPreviewDetails.selectedConceptIdentifiers = updatedConcepts;
    setSelectedConceptIdentifiers(updatedConcepts);

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
            fieldBindings={fieldBindings}
            branch={branch}
            setValue={setValue}
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
  optionsIgnored,
  isEditMode,
  isSubject,
}: {
  control?: Control<ProductSummary>;
  index: number;
  fsnToggle: boolean;
  showHighLite: boolean;
  links: Edge[];
  product: Product;
  productModel: ProductSummary;
  activeConcept: string | undefined;
  handleChangeColor: (value: string) => void;
  partialNameCheckKeywords?: string[];
  nameGeneratorErrorKeywords?: string[];
  optionsIgnored: boolean;
  isEditMode: boolean;
  isSubject?: boolean;
}) {
  let pt = useWatch({
    control,
    name: `nodes[${index}].newConceptDetails.preferredTerm` as 'nodes.0.newConceptDetails.preferredTerm',
  });

  let fsn = useWatch({
    control,
    name: `nodes[${index}].newConceptDetails.fullySpecifiedName` as 'nodes.0.newConceptDetails.fullySpecifiedName',
  });

  if (!control) {
    fsn = product.fullySpecifiedName as string;
    pt = product.preferredTerm as string;
  }

  if (isNewConcept(product) && isEditMode) {
    if (
      (fsn &&
        nameGeneratorErrorKeywords &&
        isNameContainsKeywords(fsn, nameGeneratorErrorKeywords)) ||
      (pt &&
        nameGeneratorErrorKeywords &&
        isNameContainsKeywords(pt, nameGeneratorErrorKeywords))
    ) {
      handleChangeColor(Product7BoxBGColour.INVALID);
    } else if (
      (fsn &&
        partialNameCheckKeywords &&
        isNameContainsKeywords(fsn, partialNameCheckKeywords)) ||
      (pt &&
        partialNameCheckKeywords &&
        isNameContainsKeywords(pt, partialNameCheckKeywords))
    ) {
      handleChangeColor(Product7BoxBGColour.INCOMPLETE);
    } else if (
      fsn &&
      partialNameCheckKeywords &&
      !isNameContainsKeywords(fsn, partialNameCheckKeywords) &&
      pt &&
      !isNameContainsKeywords(pt, partialNameCheckKeywords) &&
      product.conceptOptions.length === 0
    ) {
      handleChangeColor(Product7BoxBGColour.NEW);
    } else if (
      fsn &&
      partialNameCheckKeywords &&
      !isNameContainsKeywords(fsn, partialNameCheckKeywords) &&
      pt &&
      !isNameContainsKeywords(pt, partialNameCheckKeywords) &&
      product.conceptOptions.length > 0 &&
      optionsIgnored
    ) {
      handleChangeColor(Product7BoxBGColour.INCOMPLETE);
    } else if (product.conceptOptions.length > 0 && !optionsIgnored) {
      handleChangeColor(Product7BoxBGColour.INVALID);
    }
  } else if (
    product.conceptOptions &&
    product.conceptOptions.length > 0 &&
    product.concept === null &&
    !optionsIgnored
  ) {
    handleChangeColor(Product7BoxBGColour.INVALID);
  } else if (
    product.conceptOptions &&
    product.conceptOptions.length > 0 &&
    product.concept === null &&
    optionsIgnored
  ) {
    handleChangeColor(Product7BoxBGColour.INCOMPLETE);
  } else if (
    product.propertyUpdate ||
    product.statedFormChanged ||
    product.inferredFormChanged ||
    hasDescriptionChange(product)
  ) {
    handleChangeColor(Product7BoxBGColour.PROPERTY_CHANGE);
  }

  if (showHighLite && control) {
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
          <span
            style={{
              fontWeight: isSubject ? 'bold' : 'normal',
            }}
          >
            {fsnToggle ? fsn : pt}
          </span>
        </Typography>
      </Tooltip>
    );
  }

  return (
    <Typography>
      <span
        style={{
          fontWeight: isSubject ? 'bold' : 'normal',
        }}
      >
        {fsnToggle ? fsn : pt}
      </span>
    </Typography>
  );
  // end of ProductHeaderWatch
}
export default ProductPreviewPanel;
