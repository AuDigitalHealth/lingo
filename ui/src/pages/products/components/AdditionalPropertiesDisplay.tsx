// ItemDetailsDisplay.tsx
import React, { useMemo } from 'react';
import { Box, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { NonDefiningProperty, NonDefiningPropertyType } from '../../../types/product.ts';
import { Product } from '../../../types/concept.ts';
import { AdditionalReferenceSetDisplay } from './AdditionalReferenceSetDisplay.tsx';
import WarningIcon from '@mui/icons-material/Warning';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

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
  const { applicationConfig } = useApplicationConfigStore();

  const { nonDefiningProperties, newProperties, removedProperties, newReferenceSets, removedReferenceSets } = useMemo(() => {
    const nonDefProps = product?.nonDefiningProperties || [];
    const originalProps = product?.originalNode?.node?.nonDefiningProperties || [];

    // Identify new properties (in current but not in original)
    const newProps = nonDefProps.filter(
      current => !originalProps.some(original => 
        original.identifier === current.identifier && 
        original.title === current.title && original.value === current.value
        && original.valueObject?.conceptId === current.valueObject?.conceptId
        && original.relationshipType === current.relationshipType
      )
    );

    // Identify removed properties (in original but not in current)
    const removedProps = originalProps.filter(
      original => !nonDefProps.some(current => 
        current.identifier === original.identifier && 
        current.title === original.title && current.value === original.value
        && current.valueObject?.conceptId === original.valueObject?.conceptId
        && current.relationshipType === original.relationshipType
      )
    );

    // Identify new reference sets (in current but not in original)
    const newRefSets = nonDefProps
      .filter(prop => prop.type === NonDefiningPropertyType.REFERENCE_SET)
      .filter(current => 
        !originalProps.some(original => 
          original.type === NonDefiningPropertyType.REFERENCE_SET &&
          original.identifier === current.identifier && 
          original.title === current.title
        )
      );

    // Identify removed reference sets (in original but not in current)
    const removedRefSets = originalProps
      .filter(prop => prop.type === NonDefiningPropertyType.REFERENCE_SET)
      .filter(original => 
        !nonDefProps.some(current => 
          current.type === NonDefiningPropertyType.REFERENCE_SET &&
          current.identifier === original.identifier && 
          current.title === original.title
        )
      );

    return {
      nonDefiningProperties: nonDefProps,
      newProperties: newProps,
      removedProperties: removedProps,
      newReferenceSets: newRefSets,
      removedReferenceSets: removedRefSets,
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
    const allItems = [...nonDefiningProperties].filter(
      a => a.type !== NonDefiningPropertyType.REFERENCE_SET,
    );

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

  const renderChip = (item: NonDefiningProperty, isNew = false, isRemoved = false) => {
    // Determine styling based on whether the property is new or removed
    const getChipStyle = () => {
      if (isNew) {
        return {
          borderRadius: 1,
          backgroundColor: '#e6f7e6', // Light green for new properties
          borderColor: '#4caf50',
          '&:hover': {
            backgroundColor: '#d4ecd4',
          },
        };
      } else if (isRemoved) {
        return {
          borderRadius: 1,
          backgroundColor: '#ffebee', // Light red for removed properties
          borderColor: '#f44336',
          textDecoration: 'line-through',
          '&:hover': {
            backgroundColor: '#ffdde0',
          },
        };
      } else {
        return {
          borderRadius: 1,
          backgroundColor: '#f0f7ff',
          borderColor: '#e0e0e0',
          '&:hover': {
            backgroundColor: '#e1f0ff',
          },
        };
      }
    };

    // For non-defining properties with valueObject, show term with ID tooltip
    if (
      item.type === NonDefiningPropertyType.NON_DEFINING_PROPERTY &&
      'valueObject' in item &&
      item.valueObject?.pt?.term
    ) {
      return (
        <Tooltip 
          title={`${item.valueObject.conceptId || ''}${isNew ? ' (New)' : ''}${isRemoved ? ' (Removed)' : ''}`} 
          arrow
        >
          <Chip
            label={item.valueObject.pt.term}
            size="small"
            variant="outlined"
            sx={getChipStyle()}
          />
        </Tooltip>
      );
    } else if (
      item.type === NonDefiningPropertyType.EXTERNAL_IDENTIFIER &&
      'valueObject' in item &&
      item.valueObject?.pt?.term
    ) {
      const tooltipTitle = (
        <>
          {isNew && <div style={{ fontWeight: 'bold', color: '#4caf50' }}>New property</div>}
          {isRemoved && <div style={{ fontWeight: 'bold', color: '#f44336' }}>Removed property</div>}
          {item.additionalProperties &&
          Object.keys(item.additionalProperties).length > 0 ? (
            <>
              {Object.entries(item.additionalProperties).map(
                ([key, value], index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <br />}
                    {key}: {value}
                  </React.Fragment>
                ),
              )}
            </>
          ) : (
            'No properties'
          )}
        </>
      );

      return (
        <Tooltip
          title={tooltipTitle}
          placement="top"
        >
          <Box
            sx={{
              display: 'inline-flex',
              borderRadius: 1,
              overflow: 'hidden',
              border: `1px solid ${isNew ? '#4caf50' : isRemoved ? '#f44336' : '#e0e0e0'}`,
              '&:hover': {
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              },
              ...(isRemoved && { textDecoration: 'line-through' }),
            }}
          >
            <Box
              sx={{
                backgroundColor: isNew ? '#e6f7e6' : isRemoved ? '#ffebee' : '#f0f7ff',
                padding: '4px 8px',
                fontWeight: 'medium',
                fontSize: '0.8125rem',
                borderRight: `1px solid ${isNew ? '#4caf50' : isRemoved ? '#f44336' : '#e0e0e0'}`,
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  backgroundColor: isNew ? '#d4ecd4' : isRemoved ? '#ffdde0' : '#e1f0ff',
                },
              }}
            >
              {item.additionalProperties?.inactive === 'true' && (
                <Tooltip title="This code is inactive" arrow placement="bottom">
                  <WarningIcon
                    fontSize="small"
                    color="warning"
                    sx={{ marginRight: '4px', fontSize: '16px' }}
                  />
                </Tooltip>
              )}
              {item.valueObject.conceptId}
              <a
                href={`https://ontoserver.csiro.au/shrimp/?fhir=${encodeURIComponent(applicationConfig.fhirServerBaseUrl)}&concept=${encodeURIComponent(item.valueObject.conceptId)}&system=${encodeURIComponent(item.codeSystem)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'inherit',
                  marginLeft: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onClick={e => e.stopPropagation()}
                title="Open in Shrimp browser"
              >
                <OpenInNewIcon fontSize="small" sx={{ fontSize: '14px' }} />
              </a>
            </Box>
            <Box
              sx={{
                backgroundColor: isNew ? '#e6f7e6' : isRemoved ? '#ffebee' : '#f0f7ff',
                padding: '4px 8px',
                fontSize: '0.8125rem',
                '&:hover': {
                  backgroundColor: isNew ? '#d4ecd4' : isRemoved ? '#ffdde0' : '#e1f0ff',
                },
              }}
            >
              {item.valueObject?.pt?.term}
            </Box>
          </Box>
        </Tooltip>
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
          ...getChipStyle(),
          backgroundColor: isNew ? '#e6f7e6' : isRemoved ? '#ffebee' : '#f5f5f5',
        }}
      />
    ) : null;
  };

  function getPropertyContent() {
    // Only show legend if there are differences (new or removed properties or reference sets)
    const showLegend = newProperties.length > 0 || removedProperties.length > 0 || 
                       newReferenceSets.length > 0 || removedReferenceSets.length > 0;

    return (
      <Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <AdditionalReferenceSetDisplay product={product} branch={branch} />
            {sortedReferenceSets.map((refSet, index) => {
              // Check if this reference set is new
              const isNew = newReferenceSets.some(
                newRef => newRef.identifier === refSet.identifier && newRef.title === refSet.title
              );

              return (
                <Tooltip
                  key={getRefSetKey(refSet, index)}
                  title={`${refSet.identifier || ''}${isNew ? ' (New)' : ''}`}
                  arrow
                >
                  <Chip
                    label={getRefSetDisplayName(refSet)}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      color: isNew ? '#4caf50' : '#1976d2',
                      backgroundColor: isNew ? '#e6f7e6' : 'white',
                      borderColor: isNew ? '#4caf50' : '#1976d2',
                      fontWeight: 500,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        </Stack>

        {/* Display removed reference sets */}
        {removedReferenceSets.length > 0 && (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Typography style={{ color: labelColor, minWidth: labelWidth }}>
              Removed Reference Sets:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {removedReferenceSets.map((refSet, index) => (
                <Tooltip
                  key={`removed-${getRefSetKey(refSet, index)}`}
                  title={`${refSet.identifier || ''} (Removed)`}
                  arrow
                >
                  <Chip
                    label={getRefSetDisplayName(refSet)}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      color: '#f44336',
                      backgroundColor: '#ffebee',
                      borderColor: '#f44336',
                      fontWeight: 500,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      textDecoration: 'line-through',
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Stack>
        )}

        {/* Legend for property and reference set changes */}
        {showLegend && product?.originalNode?.node && (
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 2, 
              p: 1, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 1,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Changes from original:
            </Typography>
            {(newProperties.length > 0 || newReferenceSets.length > 0) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    backgroundColor: '#e6f7e6', 
                    border: '1px solid #4caf50',
                    borderRadius: 1 
                  }} 
                />
                <Typography variant="caption">
                  New {newProperties.length > 0 && newReferenceSets.length > 0 
                    ? 'properties & reference sets' 
                    : newProperties.length > 0 
                      ? 'properties' 
                      : 'reference sets'}
                </Typography>
              </Box>
            )}
            {(removedProperties.length > 0 || removedReferenceSets.length > 0) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    backgroundColor: '#ffebee', 
                    border: '1px solid #f44336',
                    borderRadius: 1,
                    textDecoration: 'line-through'
                  }} 
                />
                <Typography variant="caption" sx={{ textDecoration: 'line-through' }}>
                  Removed {removedProperties.length > 0 && removedReferenceSets.length > 0 
                    ? 'properties & reference sets' 
                    : removedProperties.length > 0 
                      ? 'properties' 
                      : 'reference sets'}
                </Typography>
              </Box>
            )}
          </Box>
        )}

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
                    {renderChip(
                      item, 
                      newProperties.some(p => p.identifier === item.identifier && p.title === item.title),
                      false
                    )}
                  </React.Fragment>
                ))
                .filter(Boolean)}
            </Box>
          </Stack>
        ))}

        {/* Display removed properties */}
        {removedProperties.length > 0 && (
          <Box sx={{ mt: 3, mb: 1, borderTop: '1px dashed #ccc', pt: 2 }}>

            {/* Group removed properties by title */}
            {Object.entries(groupItemsByTitle(removedProperties)).map(([itemTitle, items]) => (
              <Stack
                key={`removed-${itemTitle}-items`}
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
                      <React.Fragment key={`removed-${itemTitle}-item-${idx}`}>
                        {renderChip(item, false, true)}
                      </React.Fragment>
                    ))
                    .filter(Boolean)}
                </Box>
              </Stack>
            ))}
          </Box>
        )}
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
