// ItemDetailsDisplay.tsx
import React, { useMemo } from 'react';
import { Box, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { NonDefiningProperty, NonDefiningPropertyType } from '../../../types/product.ts';
import { Product } from '../../../types/concept.ts';
import { AdditionalReferenceSetDisplay } from './AdditionalReferenceSetDisplay.tsx';

interface ItemDetailsDisplayProps {
  product: Product;
  branch: string;
  labelWidth?: number | string;
  labelColor?: string;
  showWrapper?: boolean;
}

export const AdditionalPropertiesDisplay: React.FC<ItemDetailsDisplayProps> = ({
  product,
  branch,
  labelWidth = '100px',
  labelColor = '#184E6B',
  showWrapper = true,
}) => {
  const { nonDefiningProperties } =
    useMemo(() => {
      const nonDefProps = product?.nonDefiningProperties || [];

      return {
        nonDefiningProperties: nonDefProps,
      };
    }, [product]);

  // Function to get display value for properties and identifiers
  const getItemValue = React.useCallback(
    (item: NonDefiningProperty): string => {
      // Handle non-defining property type items
      if ('valueObject' in item && item.valueObject) {
        return (
          (item.valueObject.conceptId || '') +
          (item.valueObject.conceptId && item.valueObject.pt?.term
            ? ' - '
            : '') +
          (item.valueObject.pt?.term || '')
        );
      } else if ('value' in item && item.value !== undefined) {
        return String(item.value);
      }

      return '';
    },
    [],
  );

  // Define a generic grouping function for items
  const groupItemsByTitle = React.useCallback(
    <
      T extends {
        title?: string;
        identifierScheme?: string;
        name?: string;
      },
    >(
      items: T[],
    ): Record<string, T[]> => {
      if (!items || items.length === 0) return {};

      return items.reduce(
        (acc, item) => {
          const itemTitle =
            item.title ||
            ('identifierScheme' in item ? item.identifierScheme : '') ||
            ('name' in item ? item.name : '') ||
            'Unknown';

          if (!acc[itemTitle]) {
            acc[itemTitle] = [];
          }
          acc[itemTitle].push(item);
          return acc;
        },
        {} as Record<string, T[]>,
      );
    },
    [],
  );

  // Combine and sort properties and identifiers
  const combinedItems = React.useMemo(() => {
    const allItems = [...nonDefiningProperties].filter(a => a.type !== NonDefiningPropertyType.REFERENCE_SET);

    // Sort all items by their titles
    allItems.sort((a, b) => {
      // Type assertion to string for proper comparison
      const titleA = String(
        a.title ||
          ('identifierScheme' in a ? a.identifierScheme : '') ||
          ('name' in a ? a.name : '') ||
          '',
      );
      const titleB = String(
        b.title ||
          ('identifierScheme' in b ? b.identifierScheme : '') ||
          ('name' in b ? b.name : '') ||
          '',
      );
      return titleA.localeCompare(titleB);
    });

    return groupItemsByTitle(allItems);
  }, [groupItemsByTitle, nonDefiningProperties]);

  // Sort reference sets
  const sortedReferenceSets = React.useMemo(() => {
    if (!nonDefiningProperties || nonDefiningProperties.length === 0) return [];

    return [...nonDefiningProperties]
    .filter(a => a.type == NonDefiningPropertyType.REFERENCE_SET)
    .sort((a, b) => {
      // Use optional chaining and provide default values with String type assertions
      const titleA = String(a.title ?? '');
      const titleB = String(b.title ?? '');
      return titleA.localeCompare(titleB);
    });
  }, [nonDefiningProperties]);

  // Function to safely get display name for reference sets
  const getRefSetDisplayName = (refSet: NonDefiningProperty): string => {
    // Use optional chaining to safely access properties that might not exist
    return String(refSet.title ?? 'Unknown');
  };

  // Function to safely get key for reference set items
  const getRefSetKey = (refSet: NonDefiningProperty, index: number): string => {
    return `refset-${index}-${String(refSet.title ?? '')}`;
  };

  const renderChip = (item: NonDefiningProperty) => {
    // For non-defining properties with valueObject, show term with ID tooltip
    if (item.type === NonDefiningPropertyType.NON_DEFINING_PROPERTY && 'valueObject' in item && item.valueObject?.pt?.term) {
      return (
        <Tooltip title={`${item.valueObject.conceptId || ''}`} arrow>
          <Chip
            label={item.valueObject.pt.term}
            size="small"
            variant="outlined"
            sx={{
              borderRadius: 1,
              backgroundColor: '#f0f7ff',
              borderColor: '#e0e0e0',
              '&:hover': {
                backgroundColor: '#e1f0ff',
              },
            }}
          />
        </Tooltip>
      );
    } else if (item.type === NonDefiningPropertyType.EXTERNAL_IDENTIFIER && 'valueObject' in item && item.valueObject?.pt?.term) {
      return (
        <Box
          sx={{
            display: 'inline-flex',
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
            '&:hover': {
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            },
          }}
        >
          <Box
            sx={{
              backgroundColor: '#f0f7ff',
              padding: '4px 8px',
              fontWeight: 'medium',
              fontSize: '0.8125rem',
              borderRight: '1px solid #e0e0e0',
              '&:hover': {
                backgroundColor: '#e1f0ff',
              },
            }}
          >
            {item.valueObject.conceptId}
          </Box>
          <Box
            sx={{
              backgroundColor: '#f0f7ff',
              padding: '4px 8px',
              fontSize: '0.8125rem',
              '&:hover': {
                backgroundColor: '#e1f0ff',
              },
            }}
          >
            {item.valueObject?.pt?.term}
          </Box>
        </Box>
      );
    }

    // Use existing getItemValue for all other cases
    const value = getItemValue(item);
    return value ? (
      <Chip
        label={value}
        size="small"
        variant="outlined"
        sx={{
          borderRadius: 1,
          backgroundColor: '#f5f5f5',
          borderColor: '#e0e0e0',
        }}
      />
    ) : null;
  };

  function getPropertyContent() {
    return (
      <Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <AdditionalReferenceSetDisplay product={product} branch={branch} />
            {sortedReferenceSets.map((refSet, index) => (
              <Tooltip
                key={getRefSetKey(refSet, index)}
                title={`${refSet.identifier || ''}`}
                arrow
              >
                <Chip
                  label={getRefSetDisplayName(refSet)}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderRadius: 1,
                    color: '#1976d2',
                    backgroundColor: 'white',
                    borderColor: '#1976d2',
                    fontWeight: 500,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Stack>

        {Object.entries(combinedItems).map(([itemTitle, items]) => (
          <Stack
            key={`${itemTitle}-items`}
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography style={{ color: labelColor, minWidth: labelWidth }}>
              {itemTitle}:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {items
                .map((item, idx) => (
                  <React.Fragment key={`${itemTitle}-item-${idx}`}>
                    {renderChip(item)}
                  </React.Fragment>
                ))
                .filter(Boolean)}
            </Box>
          </Stack>
        ))}
      </Box>
    );
  }

  return showWrapper ? (
    <Paper
      elevation={1}
      sx={{
        padding: 2,
        backgroundColor: '#ffffff',
        border: '2px solid #e0e0e0',
        borderRadius: 3,
        position: 'relative',
      }}
    >
      {getPropertyContent()}
    </Paper>
  ) : (
    <Box sx={{ mt: 2 }}>{getPropertyContent()}</Box>
  );
};

export default AdditionalPropertiesDisplay;
