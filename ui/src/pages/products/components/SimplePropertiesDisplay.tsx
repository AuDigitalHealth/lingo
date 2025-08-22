import { Fragment, useCallback, useMemo } from 'react';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore';
import {
  NonDefiningProperty,
  NonDefiningPropertyType,
} from '../../../types/product';
import { Tooltip } from '@mui/material';
import { Chip } from '@mui/material';
import { Box } from '@mui/material';
import { OpenInNew, Warning } from '@mui/icons-material';
import { Stack } from '@mui/material';
import { Typography } from '@mui/material';
import { Paper } from '@mui/material';

interface SimplePropertiesDisplayProps {
  nonDefiningProperties: NonDefiningProperty[];
  branch: string;
  labelWidth?: number | string;
  labelColor?: string;
  showWrapper?: boolean;
}

export const SimplePropertiesDisplay: React.FC<
  SimplePropertiesDisplayProps
> = ({
  nonDefiningProperties,
  branch,
  labelWidth = '100px',
  labelColor = '#184E6B',
  showWrapper = true,
}) => {
  const { applicationConfig } = useApplicationConfigStore();

  // Function to get display value for properties
  const getItemValue = useCallback((item: NonDefiningProperty): string => {
    // Handle non-defining property type items
    if ('valueObject' in item && item.valueObject) {
      return (
        (item.valueObject.conceptId || '') +
        (item.valueObject.conceptId && item.valueObject.pt?.term ? ' - ' : '') +
        (item.valueObject.pt?.term || '')
      );
    } else if ('value' in item && item.value !== undefined) {
      return String(item.value);
    }

    return '';
  }, []);

  // Define a generic grouping function for items
  const groupItemsByTitle = useCallback(
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
          // Add null/undefined check before using 'in' operator
          const itemTitle =
            item?.title ||
            (item && typeof item === 'object' && 'identifierScheme' in item
              ? item.identifierScheme
              : '') ||
            (item && typeof item === 'object' && 'name' in item
              ? item.name
              : '') ||
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
  const combinedItems = useMemo(() => {
    const allItems = [...nonDefiningProperties].filter(
      a => a.type !== NonDefiningPropertyType.REFERENCE_SET,
    );

    // Sort all items by their titles
    allItems.sort((a, b) => {
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
  const sortedReferenceSets = useMemo(() => {
    if (!nonDefiningProperties || nonDefiningProperties.length === 0) return [];

    return [...nonDefiningProperties]
      .filter(a => a.type == NonDefiningPropertyType.REFERENCE_SET)
      .sort((a, b) => {
        const titleA = String(a.title ?? '');
        const titleB = String(b.title ?? '');
        return titleA.localeCompare(titleB);
      });
  }, [nonDefiningProperties]);

  // Function to safely get display name for reference sets
  const getRefSetDisplayName = (refSet: NonDefiningProperty): string => {
    return String(refSet.title ?? 'Unknown');
  };

  // Function to safely get key for reference set items
  const getRefSetKey = (refSet: NonDefiningProperty, index: number): string => {
    return `refset-${index}-${String(refSet.title ?? '')}`;
  };

  const renderChip = (item: NonDefiningProperty) => {
    const chipStyle = {
      borderRadius: 1,
      backgroundColor: '#f0f7ff',
      borderColor: '#e0e0e0',
      '&:hover': {
        backgroundColor: '#e1f0ff',
      },
    };

    // For non-defining properties with valueObject, show term with ID tooltip
    if (
      item.type === NonDefiningPropertyType.NON_DEFINING_PROPERTY &&
      'valueObject' in item &&
      item.valueObject?.pt?.term
    ) {
      return (
        <Tooltip title={item.valueObject.conceptId || ''} arrow>
          <Chip
            label={item.valueObject.pt.term}
            size="small"
            variant="outlined"
            sx={chipStyle}
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
          {item.additionalProperties && item.additionalProperties.length > 0
            ? [...item.additionalProperties]
                .sort((a, b) => {
                  if (a.code !== b.code) {
                    return a.code.localeCompare(b.code);
                  }
                  return a.value ? a.value.localeCompare(b.value) : 0;
                })
                .map((prop, index) => (
                  <Fragment key={index}>
                    {index > 0 && <br />}
                    {prop.code}: {prop.value}
                    {prop.subProperties && (
                      <div style={{ marginLeft: '1em' }}>
                        {prop.subProperties.map((subProp, index) => (
                          <div key={index}>
                            {subProp.code}: {subProp.value}
                          </div>
                        ))}
                      </div>
                    )}
                  </Fragment>
                ))
            : 'No properties'}
        </>
      );
      const conceptId = item?.valueObject?.conceptId;
      const codeSystem = item?.codeSystem;
      const linkUrl =
        conceptId &&
        codeSystem &&
        `https://ontoserver.csiro.au/shrimp/?fhir=${encodeURIComponent(applicationConfig.fhirServerBaseUrl)}&concept=${encodeURIComponent(conceptId)}&system=${encodeURIComponent(codeSystem)}`;
      return (
        <Tooltip title={tooltipTitle} placement="top">
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
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  backgroundColor: '#e1f0ff',
                },
              }}
            >
              {item.valueObject.conceptId}
              {linkUrl && (
                <a
                  href={linkUrl}
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
                  <OpenInNew fontSize="small" sx={{ fontSize: '14px' }} />
                </a>
              )}
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
          ...chipStyle,
          backgroundColor: '#f5f5f5',
        }}
      />
    ) : null;
  };

  function getPropertyContent() {
    return (
      <Box>
        {/* Reference Sets */}
        {sortedReferenceSets.length > 0 && (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {sortedReferenceSets.map((refSet, index) => (
                <Tooltip
                  key={getRefSetKey(refSet, index)}
                  title={refSet.identifier || ''}
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
        )}

        {/* Properties */}
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
                  <Fragment key={`${itemTitle}-item-${idx}`}>
                    {renderChip(item)}
                  </Fragment>
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

export default SimplePropertiesDisplay;
