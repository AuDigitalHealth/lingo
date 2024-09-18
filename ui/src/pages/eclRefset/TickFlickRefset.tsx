import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { useParams } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import { useConceptById } from '../../hooks/eclRefset/useConceptsById.tsx';
import RefsetConceptDetails from './components/RefsetConceptDetails.tsx';
import TickFlickMembersList from './components/TickFlickMembersList.tsx';
import TickFlickAdd from './components/TickFlickAdd.tsx';
import { useRefsetHasInactives } from '../../hooks/eclRefset/useRefsetHasInactives.tsx';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import CircleIcon from '@mui/icons-material/Circle';
import { useConceptsByEcl } from '../../hooks/eclRefset/useConceptsByEcl.tsx';
import { QUERY_REFERENCE_SET } from './utils/constants.tsx';

function TickFlickRefset() {
  const { taskKey, projectKey, conceptId } = useParams();
  const task = useUserTaskByIds();

  const branch =
    task?.branchPath ?? `MAIN/SNOMEDCT-AU/${projectKey}/${taskKey}`;

  const { conceptData: concept, isConceptFetching } = useConceptById(
    branch,
    conceptId,
  );

  const { data: inactiveData } = useRefsetHasInactives(
    branch,
    concept ? [concept] : [],
  );
  const { data: queryRefsetData } = useConceptsByEcl(
    branch,
    `^ ${QUERY_REFERENCE_SET}`,
    {
      limit: 200,
    },
  );

  return (
    <Box sx={{ position: 'relative', pb: '2em' }}>
      {isConceptFetching ? <LoadingOverlay /> : null}

      {conceptId && concept ? (
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h4">
              {concept?.pt?.term ?? concept?.fsn?.term ?? conceptId}
            </Typography>
            {inactiveData.length && inactiveData[0] === 'loading' ? (
              <CircularProgress size="20px" />
            ) : inactiveData.length && inactiveData[0] ? (
              <Tooltip title="Refset contains inactive concepts">
                <ChangeHistoryIcon fontSize="medium" color="error" />
              </Tooltip>
            ) : null}
            {queryRefsetData?.items &&
            queryRefsetData.items.some(q => q.conceptId === conceptId) ? (
              <Tooltip title="Refset has a query specification">
                <CircleIcon fontSize="small" />
              </Tooltip>
            ) : null}
          </Stack>

          <RefsetConceptDetails concept={concept} />

          <Stack>
            <TickFlickAdd branch={branch} referenceSet={conceptId} />
          </Stack>
          <TickFlickMembersList branch={branch} referenceSet={conceptId} />
        </Stack>
      ) : null}
    </Box>
  );
}

export default TickFlickRefset;
