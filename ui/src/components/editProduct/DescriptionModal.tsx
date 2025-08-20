import { useParams } from 'react-router-dom';
import { Product } from '../../types/concept';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';
import {
  useSearchConceptById,
  useSearchConceptByIdNoCache,
} from '../../hooks/api/products/useSearchConcept';
import BaseModal from '../modal/BaseModal';
import BaseModalHeader from '../modal/BaseModalHeader';
import BaseModalBody from '../modal/BaseModalBody';
import BaseModalFooter from '../modal/BaseModalFooter';
import { Button } from '@mui/material';
import { ExistingDescriptionsSection } from './ExistingDescriptionsSection';
import { useMemo, useState } from 'react';
import useProjectLangRefsets from '../../hooks/api/products/useProjectLangRefsets';
import useAvailableProjects, {
  getProjectFromKey,
} from '../../hooks/api/useInitializeProjects';
import { Typography } from '@mui/material';
import { FormControlLabel } from '@mui/material';
import { Switch } from '@mui/material';

interface DescriptionModalProps {
  open: boolean;
  handleClose: () => void;
  product: Product;
  keepMounted: boolean;
  branch: string;
}
export default function DescriptionModal({
  open,
  handleClose,
  product,
  keepMounted,
  branch,
}: DescriptionModalProps) {
  const { branchKey } = useParams();
  const { applicationConfig } = useApplicationConfigStore();
  const fullBranch = branchKey
    ? `${applicationConfig.apDefaultBranch}/${branchKey}`
    : `${applicationConfig.apDefaultBranch}`;
  const [displayRetiredDescriptions, setDisplayRetiredDescriptions] =
    useState(false);
  const conceptId = product.newConceptDetails ? undefined : product.conceptId;
  const { data, isLoading } = useSearchConceptByIdNoCache(
    conceptId,
    fullBranch,
  );
  const { data: projects } = useAvailableProjects();
  const project = getProjectFromKey(applicationConfig?.apProjectKey, projects);
  const langRefsets = useProjectLangRefsets({ project: project });

  return (
    <BaseModal open={open} handleClose={handleClose} keepMounted={keepMounted}>
      <BaseModalHeader title={'Descriptions'} />
      <BaseModalBody sx={{ overflow: 'auto' }}>
        {conceptId === undefined && (
          <Typography>New Concept, nothing to display.</Typography>
        )}
        <ExistingDescriptionsSection
          displayRetiredDescriptions={displayRetiredDescriptions}
          isFetching={isLoading}
          nonDefiningProperties={product.nonDefiningProperties}
          descriptions={data?.descriptions}
          isCtpp={false}
          dialects={langRefsets}
          title={''}
          product={product}
          branch={branch}
          displayMode="text"
          showBorder={false}
        />
        <FormControlLabel
          control={
            <Switch
              color="primary"
              checked={displayRetiredDescriptions}
              onChange={() => {
                setDisplayRetiredDescriptions(!displayRetiredDescriptions);
              }}
              disabled={false}
            />
          }
          label="Display Retired Descriptions"
          labelPlacement="start"
          sx={{
            '& .MuiSwitch-root': {
              padding: 0,
            },
            paddingRight: '5em',
          }}
        />
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button variant="contained" onClick={() => handleClose()}>
            Close
          </Button>
        }
      />
    </BaseModal>
  );
}
