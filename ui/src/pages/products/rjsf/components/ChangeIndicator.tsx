import React, { useId } from 'react';
import { Box, Tooltip, Typography, Divider, Chip, Stack } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { isEqual } from 'lodash';
import { hasAdditionalFields, hasConceptId } from '../helpers/helpers.ts';

interface ChangeIndicatorProps {
  id: string;
  value: any;
  originalValue: any;
  alwaysShow?: boolean;
  comparator?: (a: any, b: any) => boolean;
  displayArraySize?: boolean;
}

const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({
  value,
  originalValue,
  alwaysShow = false,
  comparator = (a, b) => isEqual(a, b),
  id,
  displayArraySize,
}) => {
  const hasChanged = !comparator(value, originalValue);
  if (!alwaysShow || !hasChanged) return null;

  const renderValue = (v: any): string[] => {
    if (v == null || v === '') return ['—'];

    if (Array.isArray(v)) {
      if (v.length === 0) return ['—'];
      return v.map(item => {
        if (hasConceptId(item)) {
          return formatConcept(item);
        }
        if (hasAdditionalFields(item)) {
          return formatAdditionalFieldValues(item);
        }
        if (typeof item === 'string' || typeof item === 'number')
          return String(item);
        return JSON.stringify(item);
      });
    }

    if (hasConceptId(v)) {
      return [formatConcept(v)];
    }
    if (hasAdditionalFields(v)) {
      return [formatAdditionalFieldValues(v)];
    }

    if (typeof v === 'string' || typeof v === 'number') return [String(v)];
    return [JSON.stringify(v)];
  };

  const originalItems = renderValue(originalValue);
  const modifiedItems = renderValue(value);

  return (
    <Tooltip
      key={`tooltip-diff-${id}`}
      componentsProps={{
        tooltip: {
          sx: theme => ({
            backgroundColor:
              theme.palette.mode === 'dark' ? '#f9f9f9' : '#ffffff',
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[3],
            borderRadius: 2,
            maxWidth: 420,
            p: 1.2,
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      }}
      title={
        <Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}
          >
            {displayArraySize
              ? 'Array Size Change Detected'
              : 'Field Change Detected'}
          </Typography>
          <Divider sx={{ mb: 1 }} />

          {/* Original row */}
          <Stack
            direction="row"
            alignItems="center"
            flexWrap="wrap"
            spacing={0.8}
            mb={1}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              Original:
            </Typography>
            {originalItems.map((item, idx) => (
              <Chip
                key={`orig-${idx}`}
                label={truncateWithTooltip(item)}
                variant="outlined"
                size="small"
                sx={{
                  backgroundColor: '#f5f5f5',
                  color: 'text.primary',
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Stack>

          {/* Modified row */}
          <Stack
            direction="row"
            alignItems="center"
            flexWrap="wrap"
            spacing={0.8}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              Modified:
            </Typography>
            {modifiedItems.map((item, idx) => (
              <Chip
                key={`mod-${idx}`}
                label={truncateWithTooltip(item)}
                color="warning"
                variant="filled"
                size="small"
                sx={{
                  backgroundColor: '#fff3e0',
                  color: '#d32f2f',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Stack>
        </Box>
      }
    >
      <WarningAmberIcon
        color="warning"
        fontSize="small"
        sx={{ ml: 0.8, cursor: 'pointer', verticalAlign: 'middle' }}
      />
    </Tooltip>
  );
};
function formatConcept(v: any): string {
  const term = v?.pt?.term || v?.term || 'Unnamed';
  return `${term} (${v.conceptId})`;
}

function formatAdditionalFieldValues(v: any): string {
  const additionalFieldsDisplay = v.additionalFields
    ? Object.entries(v.additionalFields)
        .map(([key, field]) => `${key.toUpperCase()}: ${field?.value ?? ''}`)
        .filter(v => v)
        .join(' | ')
    : '';
  return `${v.value} | ${additionalFieldsDisplay}`;
}

export default ChangeIndicator;

function truncateWithTooltip(value: string, maxLength = 40): JSX.Element {
  const shouldTruncate = value.length > maxLength;
  const displayValue = shouldTruncate ? `${value.slice(0, maxLength)}…` : value;

  return (
    <Tooltip title={shouldTruncate ? value : ''}>
      <Box
        component="span"
        sx={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          maxWidth: `${maxLength}ch`,
          display: 'inline-block',
          verticalAlign: 'middle',
        }}
      >
        {displayValue}
      </Box>
    </Tooltip>
  );
}
