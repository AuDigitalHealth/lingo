import { Product, ProductSummary } from '../../../types/concept.ts';
import { Stack } from '@mui/system';
import { IconButton, Link, Tooltip, Typography } from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import React from 'react';
import { sortNonDefiningProperties } from '../../../utils/helpers/tickets/additionalFieldsUtils.ts';
import {
  extractSemanticTag,
  removeSemanticTagFromTerm,
  removeSemanticTagFromTermSemTagUndefined,
} from '../../../utils/helpers/ProductPreviewUtils.ts';
import { ContentCopy } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import AdditionalPropertiesDisplay from './AdditionalPropertiesDisplay.tsx';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';
import { ProductRetireUpdate } from './ProductRetireUpdate.tsx';
import { Control, UseFormSetValue } from 'react-hook-form';
import HistoricalAssociationsDisplay from './HistoricalAssociationsDisplay.tsx';
import TicketAuthoringHistoryDisplay from './TicketAuthoringHistoryDisplay.tsx';

interface ExistingConceptDropdownProps {
  productModel: ProductSummary;
  product: Product;
  branch: string;
  control: Control<ProductSummary>;
  index: number;
  setValue?: UseFormSetValue<ProductSummary>;
}

function ExistingConceptDropdown({
  productModel,
  product,
  branch,
  control,
  index,
  setValue,
}: ExistingConceptDropdownProps) {
  const { applicationConfig } = useApplicationConfigStore();
  const snowstormBaseUrl = applicationConfig.apApiBaseUrl;

  const isSubject = productModel?.subjects?.some(
    s => s.conceptId === product.conceptId,
  );

  const branchParts = branch.split('/');
  const edition = branchParts.slice(0, 3).join('/');
  const release = branchParts[3] || '';

  const conceptBrowserUrl = `${snowstormBaseUrl}/browser/?perspective=full&conceptId1=${product.conceptId}&edition=${edition}&release=${release}&languages=en`;

  const semanticTag = extractSemanticTag(product.concept?.fsn?.term)
    ?.trim()
    .toLocaleLowerCase();

  const termWithoutTag = removeSemanticTagFromTermSemTagUndefined(
    product.concept?.fsn?.term,
  );

  const handleCopy = () => {
    if (product.concept?.fsn?.term) {
      void navigator.clipboard.writeText(product.concept.fsn.term).then(() => {
        enqueueSnackbar(`Copied '${product.concept?.fsn?.term}' to Clipboard`, {
          variant: 'info',
          autoHideDuration: 3000,
        });
      });
    }
  };

  return (
    <div key={`${product.conceptId}-div`}>
      <Stack direction="row" spacing={2}>
        <Typography style={{ color: '#184E6B' }}>Concept Id:</Typography>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span">{product.conceptId}</Typography>
          <Tooltip title="Open in TS Browser" arrow>
            <Link
              href={conceptBrowserUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'flex',
                alignItems: 'center',
                ml: 1,
                color: '#1976d2',
                '&:hover': {
                  color: '#0f5baa',
                },
              }}
            >
              <OpenInNew fontSize="small" />
            </Link>
          </Tooltip>
        </div>
      </Stack>
      <Stack direction="row" spacing={2} alignItems={'center'}>
        <Typography style={{ color: '#184E6B' }}>FSN:</Typography>
        <Typography>
          {termWithoutTag ? termWithoutTag : product.concept?.fsn?.term}
        </Typography>
        <Tooltip title="Copy with Semantic Tag">
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              padding: 0, // Reduce padding to fit closer to text
              '& .MuiSvgIcon-root': {
                fontSize: '1rem', // Match the default Typography font size (usually 1rem = 16px)
              },
            }}
          >
            <ContentCopy />
          </IconButton>
        </Tooltip>
      </Stack>
      {semanticTag && (
        <Stack direction="row" spacing={2}>
          <Typography style={{ color: '#184E6B' }}>Semantic Tag:</Typography>
          <Typography>{semanticTag}</Typography>
        </Stack>
      )}
      <Stack direction="row" spacing={2}>
        <Typography style={{ color: '#184E6B' }}>Preferred Term:</Typography>
        <Typography>{product.concept?.pt?.term}</Typography>
      </Stack>
      {setValue && (
        <ProductRetireUpdate
          product={product}
          control={control}
          index={index}
          setValue={setValue}
          branch={branch}
        />
      )}
      <AdditionalPropertiesDisplay
        product={product}
        branch={branch}
        showWrapper={false}
      />
      <HistoricalAssociationsDisplay
        product={product}
        branch={branch}
        labelWidth="100px"
        labelColor="#184E6B"
        showWrapper={false}
      />
      {isSubject && (
        <TicketAuthoringHistoryDisplay conceptId={product.conceptId} />
      )}
    </div>
  );
}
export default ExistingConceptDropdown;
