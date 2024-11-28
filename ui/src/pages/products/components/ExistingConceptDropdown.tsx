import { Product } from '../../../types/concept.ts';
import { Stack } from '@mui/system';
import { Link, Typography } from '@mui/material';
import React from 'react';
import { sortExternalIdentifiers } from '../../../utils/helpers/tickets/additionalFieldsUtils.ts';

interface ExistingConceptDropdownProps {
  product: Product;
}

function ExistingConceptDropdown({ product }: ExistingConceptDropdownProps) {
  return (
    <div key={`${product.conceptId}-div`}>
      <Stack direction="row" spacing={2}>
        <span style={{ color: '#184E6B' }}>Concept Id:</span>
        <Link>{product.conceptId}</Link>
      </Stack>
      <Stack direction="row" spacing={2}>
        <Typography style={{ color: '#184E6B' }}>FSN:</Typography>
        <Typography>{product.concept?.fsn?.term}</Typography>
      </Stack>
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
