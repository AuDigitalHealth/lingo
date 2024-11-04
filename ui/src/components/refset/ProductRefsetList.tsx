import React from 'react';

import { useSearchConceptByIds } from '../../hooks/api/products/useSearchConcept';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';
import {
  Avatar,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import Loading from '../Loading';

import { useParams } from 'react-router-dom';

import MedicationIcon from '@mui/icons-material/Medication';
import { RefsetMember } from '../../types/RefsetMember.ts';

interface ProductRefsetListProps {
  refsetMembers: RefsetMember[];
}

export default function ProductRefsetList({
  refsetMembers,
}: ProductRefsetListProps) {
  const { branchKey } = useParams();

  const { applicationConfig } = useApplicationConfigStore();
  const fullBranch = `/${applicationConfig.apDefaultBranch}${branchKey ? `/${branchKey}` : ''}`;

  const { conceptData, isConceptLoading } = useSearchConceptByIds(
    refsetMembers.flatMap(r => r.refsetId),
    fullBranch,
  );

  if (isConceptLoading) {
    return <Loading />;
  } else {
    return (
      <>
        <Box sx={{ maxHeight: '400px', overflow: 'auto', maxWidth: '90%' }}>
          <List>
            {conceptData &&
              [...conceptData]
                .sort((a, b) =>
                  (a.pt?.term || '').localeCompare(b.pt?.term || ''),
                )
                .map(item => (
                  <ListItem key={item.conceptId}>
                    <ListItemAvatar>
                      <Avatar>
                        <MedicationIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <Box>
                      <ListItemText primary={`${item.pt?.term}`} />
                      <ListItemText secondary={`${item.conceptId}`} />
                    </Box>
                  </ListItem>
                ))}
          </List>
        </Box>
      </>
    );
  }
}
