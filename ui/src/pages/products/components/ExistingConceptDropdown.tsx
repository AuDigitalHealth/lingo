import { Product, ProductSummary } from '../../../types/concept.ts';
import { Stack } from '@mui/system';
import { Link, Tooltip, Typography } from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import React from 'react';
import AdditionalPropertiesDisplay from './AdditionalPropertiesDisplay.tsx';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';
import { ProductRetireUpdate } from './ProductRetireUpdate.tsx';
import { Control, UseFormSetValue } from 'react-hook-form';
import HistoricalAssociationsDisplay from './HistoricalAssociationsDisplay.tsx';

interface ExistingConceptDropdownProps {
  product: Product;
  branch: string;
  control: Control<ProductSummary>;
  index: number;
  setValue?: UseFormSetValue<ProductSummary>;
}

function ExistingConceptDropdown({
  product,
  branch,
  control,
  index,
  setValue,
}: ExistingConceptDropdownProps) {
  const { applicationConfig } = useApplicationConfigStore();
  const snowstormBaseUrl = applicationConfig.apApiBaseUrl;

  const branchParts = branch.split('/');
  const edition = branchParts.slice(0, 3).join('/');
  const release = branchParts[3] || '';

  const conceptBrowserUrl = `${snowstormBaseUrl}/browser/?perspective=full&conceptId1=${product.conceptId}&edition=${edition}&release=${release}&languages=en`;

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
      <Stack direction="row" spacing={2}>
        <Typography style={{ color: '#184E6B' }}>FSN:</Typography>
        <Typography>{product.concept?.fsn?.term}</Typography>
      </Stack>
      <Stack direction="row" spacing={2} mb={1}>
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
    </div>
  );
}
export default ExistingConceptDropdown;
