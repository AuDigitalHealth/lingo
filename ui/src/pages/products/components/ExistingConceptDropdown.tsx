import { Product } from '../../../types/concept.ts';
import { Stack } from '@mui/system';
import { Link, Typography } from '@mui/material';
import React from 'react';
import AdditionalPropertiesDisplay from './AdditionalPropertiesDisplay.tsx';

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
      <AdditionalPropertiesDisplay
        externalIdentifiers={product.externalIdentifiers}
        nonDefiningProperties={product.nonDefiningProperties}
        referenceSets={product.referenceSets}
      />
    </div>
  );
}
export default ExistingConceptDropdown;