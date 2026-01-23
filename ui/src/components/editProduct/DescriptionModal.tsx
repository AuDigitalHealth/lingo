import { useParams } from 'react-router-dom';
import { Product } from '../../types/concept';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';
import { useSearchConceptByIdNoCache } from '../../hooks/api/products/useSearchConcept';
import BaseModal from '../modal/BaseModal';
import BaseModalHeader from '../modal/BaseModalHeader';
import BaseModalBody from '../modal/BaseModalBody';
import BaseModalFooter from '../modal/BaseModalFooter';
import { Button, FormControlLabel, Switch, Typography } from '@mui/material';
import { ExistingDescriptionsSection } from './ExistingDescriptionsSection';
import { useState } from 'react';
import useProjectLangRefsets from '../../hooks/api/products/useProjectLangRefsets';
import {
  useProjectFromUrlProjectPath,
  useProjectFromUrlTaskPath,
} from '../../hooks/useProjectFromUrlPath';
import useAuthoringStore from '../../stores/AuthoringStore.ts';
import { Project } from '../../types/Project.ts';

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

  const project = useProjectFromUrlProjectPath();
  const { project: projectKey } = useParams();
  const taskProject = useProjectFromUrlTaskPath();
  const branchPath = taskProject?.branchPath
    ? taskProject.branchPath
    : projectKey
      ? project?.branchPath
      : useApplicationConfigStore.getState().applicationConfig?.apDefaultBranch;
  const fullBranch = branchKey ? `${branchPath}/${branchKey}` : `${branchPath}`;
  const [displayRetiredDescriptions, setDisplayRetiredDescriptions] =
    useState(false);
  const conceptId = product.newConceptDetails ? undefined : product.conceptId;
  const { data, isLoading } = useSearchConceptByIdNoCache(
    conceptId,
    fullBranch,
  );
  const { selectedProject } = useAuthoringStore();
  const resolvedProject: Project | undefined =
    taskProject ?? project ?? selectedProject;
  const langRefsets = useProjectLangRefsets({ project: resolvedProject });

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
