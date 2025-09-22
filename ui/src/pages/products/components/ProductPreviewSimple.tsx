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
import { FormattedMessage } from 'react-intl';
import {
  AccountTreeOutlined,
  Edit,
  NewReleases,
  NewReleasesOutlined,
  NotesOutlined,
} from '@mui/icons-material';
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

interface ProductPreviewPanelProps {
  // control: Control<ProductSummary>;
  fsnToggle: boolean;
  product: Product;
  // productModel: ProductSummary;
  activeConcept: string | undefined;
  expandedConcepts: string[];
  // setExpandedConcepts: React.Dispatch<React.SetStateAction<string[]>>;
  // setActiveConcept: React.Dispatch<React.SetStateAction<string | undefined>>;
  // register: UseFormRegister<ProductSummary>;
  // getValues: UseFormGetValues<ProductSummary>;
  // idsWithInvalidName: string[];
  // setIdsWithInvalidName: (value: string[]) => void;
  // fieldBindings: FieldBindings;
  branch: string;
  // refsetMembers: RefsetMember[];
  isSimpleEdit: boolean;
  // setValue: UseFormSetValue<ProductSummary>;
  ticket?: Ticket;
}

export default function ProductPreviewSimple({
  // control,
  fsnToggle,
  // productModel,
  activeConcept,
  product,
  expandedConcepts,
  // setExpandedConcepts,
  // setActiveConcept,
  // idsWithInvalidName,
  // setIdsWithInvalidName,
  // fieldBindings,
  isSimpleEdit,
  branch,
  ticket,
}: ProductPreviewPanelProps) {
  const theme = useTheme();
  const task = useTaskByKey();
  const showReviewControls = useShowReviewControls({ task });
  const [conceptDiagramModalOpen, setConceptDiagramModalOpen] = useState(false);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { conceptReviews, isLoadingConceptReviews } =
    useConceptsForReview(branch);
  const filteredConceptReviews = conceptReviews
    ? conceptReviews.find(c => c.conceptId === product.conceptId)
    : undefined;

  const [optionsIgnored, setOptionsIgnored] = useState(false);
  const productTitle = fsnToggle
    ? (product.concept?.fsn?.term as string)
    : product.concept?.pt?.term;

  const [bgColor, setBgColor] = useState<string>(
    getColorByDefinitionStatus(product, optionsIgnored, [], []),
  );

  function showHighlite() {
    return false;
  }

  const shouldRenderDropdownAsReadonly = product.concept && product.conceptId;

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
      <Grid>
        <ProductPreviewAccordion
          key={'accordion-' + product.conceptId}
          data-testid="accodion-product"
          // onChange={() => accordionClicked(product.conceptId)}
          // expanded={expandedConcepts.includes(product.conceptId)}
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
                    <Typography>
                      <span>{productTitle}</span>
                    </Typography>
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
                    <Typography>
                      <span>{productTitle}</span>
                    </Typography>
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
              <ExistingConceptDropdown product={product} branch={branch} />
            )}
          </AccordionDetails>
        </ProductPreviewAccordion>
      </Grid>
    </>
  );
}
