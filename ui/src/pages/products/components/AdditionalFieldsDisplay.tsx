import React from 'react';
import { Typography, Box, Tooltip } from '@mui/material';
import { AdditionalFields } from '../../../types/product.ts';

interface AdditionalFieldsDisplayProps {
  value: string;
  additionalFields?: AdditionalFields;
}

const AdditionalFieldsDisplay: React.FC<AdditionalFieldsDisplayProps> = ({
  value,
  additionalFields,
}) => {
  const isLink = value && value.includes('://');
  const additionalFieldsDisplay = additionalFields
    ? Object.entries(additionalFields)
        .map(([key, field]) => `${key.toUpperCase()}: ${field?.value ?? ''}`)
        .filter(v => v)
        .join(' | ')
    : '';

  const shouldTruncate = value.length > 40;
  const displayValue = shouldTruncate ? `${value.slice(0, 40)}…` : value;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
      <Typography
        variant="body2"
        sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}
      >
        {/* Main value with tooltip if truncated */}
        <Tooltip title={shouldTruncate ? value : ''}>
          <Box
            component="span"
            sx={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: '40px',
              ...(isLink && { textDecoration: 'underline' }),
            }}
          >
            {displayValue}
          </Box>
        </Tooltip>

        {/* Pipe + additional fields */}
        {additionalFieldsDisplay && (
          <Box component="span" sx={{ color: 'text.secondary', ml: 0.5 }}>
            | {additionalFieldsDisplay}
          </Box>
        )}
      </Typography>
    </Box>
  );
};

export default AdditionalFieldsDisplay;
