import React, { useEffect, useMemo, useState } from 'react';
import { Product } from '../../../types/concept.ts';
import {
  Box,
  Chip,
  CircularProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRefsetMembersByComponentIds } from '../../../hooks/api/refset/useRefsetMembersByComponentIds.tsx';
import { useReferenceSetConcepts } from '../../../hooks/api/refset/useReferenceSetConcepts.tsx';

// Locally defined interface to replace the imported ReferenceSet
interface LocalReferenceSet {
  title: string;
  identifier: string;
  additionalFields?: Record<string, string>;
}

interface AdditionalReferenceSetsProps {
  product: Product;
  branch: string;
}

export const AdditionalReferenceSetDisplay = ({
  product,
  branch,
}: AdditionalReferenceSetsProps) => {
  const [referenceSets, setReferenceSets] = useState<LocalReferenceSet[]>([]);
  const CHARACTER_LIMIT = 30;

  // Only fetch refset members if this is not a new concept
  const { refsetData: refsetMembersResponse, isRefsetLoading } =
    useRefsetMembersByComponentIds(branch, [product.conceptId], {
      enabled: !product.newConcept && !!product.conceptId && !!branch,
    });

  // Get filtered reference set members
  const filteredRefsetMembers = useMemo(() => {
    // Choose the appropriate reference set members source based on product.newConcept
    const referenceSetMembers = product.newConcept
      ? product.newConceptDetails?.referenceSetMembers || []
      : refsetMembersResponse || [];

    if (!referenceSetMembers || referenceSetMembers.length === 0) {
      return [];
    }

    // Filter out reference sets that are already in product.referenceSets or excluded
    return referenceSetMembers.filter(
      member =>
        !product.referenceSets?.some(
          refSet => refSet.identifier === member.refsetId,
        ) &&
        !product.externalIdentifiers?.some(
          extId => extId.identifier === member.refsetId,
        ) &&
        member.refsetId !== '733073007', // OWL reference set
    );
  }, [
    product.newConcept,
    product.newConceptDetails?.referenceSetMembers,
    refsetMembersResponse,
    product.referenceSets,
    product.externalIdentifiers,
  ]);

  // Extract unique refsetIds for concept lookup
  const uniqueRefsetIds = useMemo(() => {
    return [...new Set(filteredRefsetMembers.map(member => member.refsetId))];
  }, [filteredRefsetMembers]);

  // Use our custom hook to fetch and cache reference set concepts
  const {
    data: refsetConceptMap,
    isLoading: isConceptsLoading,
    isFetching: isConceptsFetching,
  } = useReferenceSetConcepts(uniqueRefsetIds, branch);

  // Update reference sets when the data changes
  useEffect(() => {
    if (!filteredRefsetMembers.length) {
      setReferenceSets([]);
      return;
    }

    // If we have concept data, use it to create the reference sets
    if (refsetConceptMap) {
      const convertedReferenceSets = filteredRefsetMembers.map(member => ({
        title:
          refsetConceptMap[member.refsetId]?.pt?.term ||
          `Reference Set ${member.refsetId}`,
        identifier: member.refsetId,
        additionalFields: member.additionalFields,
      }));

      setReferenceSets(convertedReferenceSets);
    }
  }, [filteredRefsetMembers, refsetConceptMap]);

  // Determine if we're in a loading state
  const isLoading =
    (isRefsetLoading && !product.newConcept) ||
    ((isConceptsLoading || isConceptsFetching) && uniqueRefsetIds.length > 0);

  // Display loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} thickness={4} color="primary" />
        <Typography variant="body2" color="textSecondary">
          Loading reference sets...
        </Typography>
      </Box>
    );
  }

  // Don't render anything if there are no reference sets
  if (referenceSets.length === 0) {
    return null;
  }

  return (
    <>
      {referenceSets.map((refSet, index) => {
        const isLongTitle =
          refSet.title && refSet.title.length > CHARACTER_LIMIT;

        // Build tooltip content
        let tooltipContent = isLongTitle
          ? `${refSet.identifier || ''}: ${refSet.title || ''}`
          : refSet.identifier || '';

        // Add additional fields to tooltip if present
        if (
          refSet.additionalFields &&
          Object.keys(refSet.additionalFields).length > 0
        ) {
          Object.entries(refSet.additionalFields).forEach(([key, value]) => {
            tooltipContent += `\n${key}: ${value}`;
          });
        }

        return (
          <Tooltip
            key={`refset-${refSet.identifier}-${index}`}
            title={tooltipContent}
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  fontSize: '0.75rem',
                  padding: '8px',
                  whiteSpace: 'pre-line',
                  maxWidth: '300px',
                },
              },
            }}
          >
            <Chip
              label={refSet.title}
              size="small"
              variant="outlined"
              sx={{
                borderRadius: 1,
                color: 'white',
                backgroundColor: '#1976d2',
                borderColor: '#1976d2',
                fontWeight: 500,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                margin: '0 4px 4px 0',
                maxWidth: '300px',
              }}
            />
          </Tooltip>
        );
      })}
    </>
  );
};
