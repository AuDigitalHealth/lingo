// ItemDetailsDisplay.tsx
import React from 'react';
import { Box, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { ExternalIdentifier, NonDefiningProperty, ReferenceSet } from '../../../types/product.ts';

interface ItemDetailsDisplayProps {
  externalIdentifiers?: ExternalIdentifier[];
  nonDefiningProperties?: NonDefiningProperty[];
  referenceSets?: ReferenceSet[];
  labelWidth?: number | string;
  labelColor?: string;
  showWrapper?: boolean;
}

export const AdditionalPropertiesDisplay: React.FC<ItemDetailsDisplayProps> = ({
                                                                        externalIdentifiers = [],
                                                                        nonDefiningProperties = [],
                                                                        referenceSets = [],
                                                                        labelWidth = '100px',
                                                                        labelColor = '#184E6B',
                                                                        showWrapper = true
                                                                      }) => {

  // Function to get display value for properties and identifiers
  const getItemValue = React.useCallback((item: ExternalIdentifier | NonDefiningProperty): string => {
    // Handle external identifier type items
    if ('identifierValueObject' in item && item.identifierValueObject) {
      return (item.identifierValueObject.conceptId || '') +
        (item.identifierValueObject.conceptId && item.identifierValueObject.pt?.term ? " - " : "") +
        (item.identifierValueObject.pt?.term || '');
    } else if ('identifierValue' in item && item.identifierValue !== undefined) {
      return String(item.identifierValue);
    }

    // Handle non-defining property type items
    if ('valueObject' in item && item.valueObject) {
      return (item.valueObject.conceptId || '') +
        (item.valueObject.conceptId && item.valueObject.pt?.term ? " - " : "") +
        (item.valueObject.pt?.term || '');
    } else if ('value' in item && item.value !== undefined) {
      return String(item.value);
    }

    return '';
  }, []);

  // Define a generic grouping function for items
  const groupItemsByTitle = React.useCallback(<T extends { title?: string, identifierScheme?: string, name?: string }>(
    items: T[]
  ): Record<string, T[]> => {
    if (!items || items.length === 0) return {};

    return items.reduce((acc, item) => {
      const itemTitle = item.title ||
        ('identifierScheme' in item ? item.identifierScheme : '') ||
        ('name' in item ? item.name : '') ||
        'Unknown';

      if (!acc[itemTitle]) {
        acc[itemTitle] = [];
      }
      acc[itemTitle].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }, []);

  // Combine and sort properties and identifiers
  const combinedItems = React.useMemo(() => {
    const allItems = [
      ...externalIdentifiers,
      ...nonDefiningProperties
    ];

    // Sort all items by their titles
    allItems.sort((a, b) => {
      // Type assertion to string for proper comparison
      const titleA = String(a.title ||
        ('identifierScheme' in a ? a.identifierScheme : '') ||
        ('name' in a ? a.name : '') ||
        '');
      const titleB = String(b.title ||
        ('identifierScheme' in b ? b.identifierScheme : '') ||
        ('name' in b ? b.name : '') ||
        '');
      return titleA.localeCompare(titleB);
    });

    return groupItemsByTitle(allItems);
  }, [externalIdentifiers, nonDefiningProperties, groupItemsByTitle]);

  // Sort reference sets
  const sortedReferenceSets = React.useMemo(() => {
    if (!referenceSets || referenceSets.length === 0) return [];

    return [...referenceSets].sort((a, b) => {
      // Use optional chaining and provide default values with String type assertions
      const titleA = String(a.title ?? '');
      const titleB = String(b.title ?? '');
      return titleA.localeCompare(titleB);
    });
  }, [referenceSets]);

  // Function to safely get display name for reference sets
  const getRefSetDisplayName = (refSet: ReferenceSet): string => {
    // Use optional chaining to safely access properties that might not exist
    return String(refSet.title ?? 'Unknown');
  };

  // Function to safely get key for reference set items
  const getRefSetKey = (refSet: ReferenceSet, index: number): string => {
    return `refset-${index}-${String(refSet.title ?? '')}`;
  };

  const renderChip = (item: ExternalIdentifier | NonDefiningProperty) => {
    // For non-defining properties with valueObject, show term with ID tooltip
    if ('valueObject' in item && item.valueObject?.pt?.term) {
      return (
        <Tooltip title={`${item.valueObject.conceptId || ''}`} arrow>
          <Chip
            label={item.valueObject.pt.term}
            size="small"
            variant="outlined"
            sx={{ borderRadius: 1, backgroundColor: '#f0f7ff', borderColor: '#e0e0e0',
              '&:hover': {
                backgroundColor: '#e1f0ff'
              } }}
          />
        </Tooltip>
      );
    }

    if ('identifierValueObject' in item && item.identifierValueObject?.pt?.term) {
      return (
        <Box
          sx={{
            display: 'inline-flex',
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
            '&:hover': {
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }
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
                  backgroundColor: '#e1f0ff'
                }
              }}
            >
              {item.identifierValueObject.conceptId}
            </Box>
            <Box
              sx={{
                backgroundColor: '#f0f7ff',
                padding: '4px 8px',
                fontSize: '0.8125rem',
                '&:hover': {
                  backgroundColor: '#e1f0ff'
                }
              }}
            >
              {item.identifierValueObject?.pt?.term}
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
        sx={{ borderRadius: 1, backgroundColor: '#f5f5f5', borderColor: '#e0e0e0' }}
      />
    ) : null;
  };


  // Check if there's any content to display
  const hasContent = Object.keys(combinedItems).length > 0 || sortedReferenceSets.length > 0;

  // If there's no content, return null or an empty fragment
  if (!hasContent) {
    return null; // or return <></>;
  }

  function getPropertyContent() {
    return <Box>
      {sortedReferenceSets.length > 0 && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Typography style={{ color: labelColor, minWidth: labelWidth, fontWeight: 500 }}>
            Refsets:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sortedReferenceSets.map((refSet, index) => (
              <Chip
                key={getRefSetKey(refSet, index)}
                label={getRefSetDisplayName(refSet)}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: 1,
                  color: '#1976d2',
                  backgroundColor: 'white',
                  borderColor: '#1976d2',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              />
            ))}
          </Box>
        </Stack>
      )}

      {Object.entries(combinedItems).map(([itemTitle, items]) => (
        <Stack key={`${itemTitle}-items`} direction="row" spacing={2} alignItems="center"
               sx={{ mb: 1 }}>
          <Typography style={{ color: labelColor, minWidth: labelWidth }}>{itemTitle}:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {items.map((item, idx) => (
              <React.Fragment key={`${itemTitle}-item-${idx}`}>
                {renderChip(item)}
              </React.Fragment>
            )).filter(Boolean)}
          </Box>
        </Stack>
      ))}
    </Box>;
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
    getPropertyContent()
  );

};


export default AdditionalPropertiesDisplay;