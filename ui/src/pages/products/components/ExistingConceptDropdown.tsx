import { Product } from '../../../types/concept.ts';
import { Stack } from '@mui/system';
import { IconButton, Link, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { sortExternalIdentifiers } from '../../../utils/helpers/tickets/additionalFieldsUtils.ts';
import {
  extractSemanticTag,
  removeSemanticTagFromTerm,
} from '../../../utils/helpers/ProductPreviewUtils.ts';
import { ContentCopy } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';

interface ExistingConceptDropdownProps {
  product: Product;
}

function ExistingConceptDropdown({ product }: ExistingConceptDropdownProps) {
  const semanticTag = extractSemanticTag(product.concept?.fsn?.term)
    ?.trim()
    .toLocaleLowerCase();

  const termWithoutTag = removeSemanticTagFromTerm(product.concept?.fsn?.term);

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
        <span style={{ color: '#184E6B' }}>Concept Id:</span>
        <Link>{product.conceptId}</Link>
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
      {(product.externalIdentifiers || product.label === 'CTPP') && (
        <Stack direction="row" spacing={2}>
          <Typography style={{ color: '#184E6B' }}>Artg Ids:</Typography>

          <Typography>
            {sortExternalIdentifiers(
              product.externalIdentifiers ? product.externalIdentifiers : [],
            )
              ?.map(artg => artg.identifierValue)
              .join(', ')}
          </Typography>
        </Stack>
      )}
    </div>
  );
}
export default ExistingConceptDropdown;
