import { useMemo } from 'react';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore';
import { Product } from '../../../types/concept';
import { RefsetMember } from '../../../types/RefsetMember';
import { Tooltip } from '@mui/material';
import { Box } from '@mui/material';
import { OpenInNew, Warning } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { Stack } from '@mui/material';
import { Paper } from '@mui/material';
import { newConceptBorderColor } from './style/colors';

interface HistoricalAssociationsDisplayProps {
  product: Product;
  branch: string;
  labelWidth: string;
  labelColor: string;
  showWrapper: boolean;
}

export default function HistoricalAssociationsDisplay({
  product,
  branch = '',
  labelWidth = '100px',
  labelColor = '#184E6B',
  showWrapper = true,
}: HistoricalAssociationsDisplayProps) {
  const { applicationConfig } = useApplicationConfigStore();

  // Group historical associations by refsetId (association type)
  const groupedAssociations = useMemo(() => {
    const historicalAssociations = product?.historicalAssociations || [];

    if (historicalAssociations.length === 0) {
      return {};
    }

    return historicalAssociations.reduce(
      (acc, association) => {
        const refsetId = association.refsetId;
        if (!acc[refsetId]) {
          acc[refsetId] = [];
        }
        acc[refsetId].push(association);
        return acc;
      },
      {} as Record<string, RefsetMember[]>,
    );
  }, [product?.historicalAssociations]);

  // Get the display name for a refset ID
  const getRefsetDisplayName = (refsetId: string): string => {
    const enumValue = Object.values(HistoricalAssociationReferenceSet).find(
      value => value === refsetId,
    );

    if (enumValue) {
      return HistoricalAssociationDescriptions[
        enumValue as keyof typeof HistoricalAssociationDescriptions
      ]
        .replace(' association reference set', '')
        .replace(' concept association reference set', '');
    }

    return `Unknown Association (${refsetId})`;
  };

  // Render a chip for each target component
  const renderTargetChip = (association: RefsetMember, index: number) => {
    const targetComponentId = association.additionalFields?.targetComponentId;
    const referencedComponent = association.referencedComponent;

    if (!targetComponentId) {
      return null;
    }

    const displayTerm =
      referencedComponent?.pt?.term ||
      referencedComponent?.fsn?.term ||
      targetComponentId;

    const isNew = !association.released;

    const tooltipContent = (
      <>
        {isNew && (
          <div
            style={{
              fontWeight: 'bold',
              color: '#4caf50',
              marginBottom: '4px',
            }}
          >
            New Association
          </div>
        )}
        <div>
          <strong>Target:</strong> {targetComponentId}
        </div>
        {referencedComponent?.pt?.term && (
          <div>
            <strong>Preferred Term:</strong> {referencedComponent.pt.term}
          </div>
        )}
        {referencedComponent?.fsn?.term && (
          <div>
            <strong>FSN:</strong> {referencedComponent.fsn.term}
          </div>
        )}
        <div>
          <strong>Active:</strong> {association.active ? 'Yes' : 'No'}
        </div>
        {referencedComponent && (
          <div>
            <strong>Component Active:</strong>{' '}
            {referencedComponent.active ? 'Yes' : 'No'}
          </div>
        )}
        <div>
          <strong>Released:</strong> {association.released ? 'Yes' : 'No'}
        </div>
      </>
    );

    const getBorderColor = () => {
      if (isNew) return newConceptBorderColor;
      return '#e0e0e0';
    };

    const getBackgroundColor = (isHover = false) => {
      if (isNew) return isHover ? '#d4ecd4' : '#e6f7e6';
      return isHover ? '#e1f0ff' : '#f0f7ff';
    };

    return (
      <Tooltip key={`target-${index}`} title={tooltipContent} placement="top">
        <Box
          sx={{
            display: 'inline-flex',
            borderRadius: 1,
            overflow: 'hidden',
            border: `1px solid ${getBorderColor()}`,
            '&:hover': {
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            },
            ...(!isNew && { opacity: 0.7 }),
          }}
        >
          <Box
            sx={{
              backgroundColor: getBackgroundColor(false),
              padding: '4px 8px',
              fontWeight: 'medium',
              fontSize: '0.8125rem',
              borderRight: `1px solid ${getBorderColor()}`,
              display: 'flex',
              alignItems: 'center',
              '&:hover': {
                backgroundColor: getBackgroundColor(true),
              },
            }}
          >
            {targetComponentId}
          </Box>
          <Box
            sx={{
              backgroundColor: getBackgroundColor(false),
              padding: '4px 8px',
              fontSize: '0.8125rem',
              '&:hover': {
                backgroundColor: getBackgroundColor(true),
              },
            }}
          >
            {displayTerm}
          </Box>
        </Box>
      </Tooltip>
    );
  };

  // Check if there are any new associations for the legend
  const hasNewAssociations = useMemo(() => {
    return Object.values(groupedAssociations).some(associations =>
      associations.some(association => !association.released),
    );
  }, [groupedAssociations]);

  function getAssociationContent() {
    if (Object.keys(groupedAssociations).length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No historical associations found
        </Typography>
      );
    }

    return (
      <Box>
        {hasNewAssociations && (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mb: 2,
              p: 1,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Legend:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: '#e6f7e6',
                  border: '1px solid #4caf50',
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption">New associations</Typography>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: '#f0f7ff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption">Existing associations</Typography>
            </Box>
          </Box>
        )}

        {Object.entries(groupedAssociations)
          .sort(([a], [b]) =>
            getRefsetDisplayName(a).localeCompare(getRefsetDisplayName(b)),
          )
          .map(([refsetId, associations]) => (
            <Stack
              key={refsetId}
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography
                style={{
                  color: labelColor,
                  minWidth: labelWidth,
                  fontWeight: 500,
                }}
              >
                {getRefsetDisplayName(refsetId)}:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {associations
                  .map((association, index) =>
                    renderTargetChip(association, index),
                  )
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
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          color: labelColor,
          fontSize: '1.1rem',
          fontWeight: 600,
        }}
      >
        Historical Associations
      </Typography>
      {getAssociationContent()}
    </Paper>
  ) : (
    <Box sx={{ mt: 2 }}>{getAssociationContent()}</Box>
  );
}

enum HistoricalAssociationReferenceSet {
  ALTERNATIVE = '900000000000530003',
  MOVED_FROM = '900000000000525002',
  MOVED_TO = '900000000000524003',
  PARTIALLY_EQUIVALENT_TO = '1186924009',
  POSSIBLY_EQUIVALENT_TO = '900000000000523009',
  POSSIBLY_REPLACED_BY = '1186921001',
  REFERS_TO = '900000000000531004',
  REPLACED_BY = '900000000000526001',
  SAME_AS = '900000000000527005',
  SIMILAR_TO = '900000000000529008',
  WAS_A = '900000000000528000',
}

const HistoricalAssociationDescriptions = {
  [HistoricalAssociationReferenceSet.ALTERNATIVE]:
    'ALTERNATIVE association reference set',
  [HistoricalAssociationReferenceSet.MOVED_FROM]:
    'MOVED FROM association reference set',
  [HistoricalAssociationReferenceSet.MOVED_TO]:
    'MOVED TO association reference set',
  [HistoricalAssociationReferenceSet.PARTIALLY_EQUIVALENT_TO]:
    'PARTIALLY EQUIVALENT TO association reference set',
  [HistoricalAssociationReferenceSet.POSSIBLY_EQUIVALENT_TO]:
    'POSSIBLY EQUIVALENT TO association reference set',
  [HistoricalAssociationReferenceSet.POSSIBLY_REPLACED_BY]:
    'POSSIBLY REPLACED BY association reference set',
  [HistoricalAssociationReferenceSet.REFERS_TO]:
    'REFERS TO concept association reference set',
  [HistoricalAssociationReferenceSet.REPLACED_BY]:
    'REPLACED BY association reference set',
  [HistoricalAssociationReferenceSet.SAME_AS]:
    'SAME AS association reference set',
  [HistoricalAssociationReferenceSet.SIMILAR_TO]:
    'SIMILAR TO association reference set',
  [HistoricalAssociationReferenceSet.WAS_A]: 'WAS A association reference set',
} as const;
