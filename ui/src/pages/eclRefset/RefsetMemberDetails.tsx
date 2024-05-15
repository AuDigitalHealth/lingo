import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { useParams } from 'react-router-dom';
import { useRefsetMemberById } from '../../hooks/eclRefset/useRefsetMemberById.tsx';
import {
  Box,
  Button,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { Concept } from '../../types/concept.ts';
import { useEffect, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import useUserStore from '../../stores/UserStore.ts';
import Confirm from './components/Confirm.tsx';
import RefsetDetailElement from './components/RefsetDetailElement.tsx';
import ECLExpressionEditor from './components/ECLExpressionEditor.tsx';
import { useUpdateRefsetMember } from '../../hooks/eclRefset/useUpdateRefsetMember.tsx';

function RefsetMemberDetails() {
  const { taskKey, projectKey, memberId } = useParams();
  const task = useUserTaskByIds();
  const { login } = useUserStore();

  const branch =
    task?.branchPath ?? `MAIN/SNOMEDCT-AU/${projectKey}/${taskKey}`;

  const {
    refsetMemberData: refsetMember,
    refetchRefsetMember,
    isRefsetMemberFetching,
  } = useRefsetMemberById(branch, memberId);

  const [editMode, setEditMode] = useState(false);
  const [newEcl, setNewEcl] = useState('');

  useEffect(() => {
    setNewEcl(refsetMember?.additionalFields?.query ?? '');
  }, [refsetMember, editMode]);

  const concept = refsetMember?.referencedComponent as Concept;

  const isUpdating = isRefsetMemberFetching;

  const updateRefsetMutation = useUpdateRefsetMember(branch);
  const { isSuccess, isLoading } = updateRefsetMutation;
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const updateQuery = (confirmEcl: string) => {
    if (refsetMember) {
      const newMember = {
        ...refsetMember,
        additionalFields: {
          ...refsetMember.additionalFields,
          query: confirmEcl,
        },
      };

      updateRefsetMutation.mutate(newMember);
    }
  };

  useEffect(() => {
    const refsetLabel =
      concept?.pt?.term || concept?.fsn?.term || concept?.conceptId || '';
    if (isSuccess) {
      enqueueSnackbar(
        `ECL for reference set '${refsetLabel}' was updated successfully`,
        {
          variant: 'success',
          autoHideDuration: 5000,
        },
      );
      setConfirmModalOpen(false);
      refetchRefsetMember().catch(console.error);
    }
  }, [isSuccess, concept, refetchRefsetMember]);

  const updateButton =
    login === task?.assignee.username && refsetMember ? (
      <Confirm
        open={confirmModalOpen}
        setOpen={setConfirmModalOpen}
        action="update"
        concept={concept}
        newEcl={newEcl}
        branch={branch}
        buttonDisabled={
          newEcl.trim() === refsetMember.additionalFields?.query.trim() ||
          isUpdating ||
          !newEcl.trim()
        }
        isActionLoading={isLoading}
        onConfirm={updateQuery}
      />
    ) : null;

  return (
    <Box sx={{ position: 'relative', pb: '2em' }}>
      {isRefsetMemberFetching ? <LoadingOverlay /> : null}

      {refsetMember ? (
        <Stack spacing={2}>
          <Typography variant="h4">
            {concept?.pt?.term ?? concept?.fsn?.term ?? memberId}
          </Typography>

          <Grid container rowSpacing={1}>
            <Grid item mr={'3em'}>
              <Stack spacing={1}>
                <RefsetDetailElement
                  label="Member ID"
                  value={refsetMember.memberId}
                />
                <RefsetDetailElement
                  label="Referenced Component ID"
                  value={refsetMember.referencedComponentId}
                />
              </Stack>
            </Grid>
            {concept ? (
              <Grid item mr={'3em'}>
                <Stack spacing={1}>
                  <RefsetDetailElement
                    label="Fully Specified Name"
                    value={concept.fsn?.term}
                  />
                  <RefsetDetailElement
                    label="Preferred Term"
                    value={concept.pt?.term}
                  />
                </Stack>
              </Grid>
            ) : null}
            <Grid item>
              <Stack spacing={1}>
                <RefsetDetailElement
                  label="Active"
                  value={refsetMember.active}
                />
                <RefsetDetailElement
                  label="Released"
                  value={refsetMember.released}
                />
              </Stack>
            </Grid>
          </Grid>

          <Box sx={{ width: '100%' }}>
            <Typography variant="h6" fontWeight="bold">
              ECL
            </Typography>
            <TextField
              multiline
              fullWidth
              value={refsetMember.additionalFields?.query}
              InputProps={{
                readOnly: true,
              }}
            />
          </Box>

          {!editMode ? (
            <Box sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
              >
                Edit ECL
              </Button>
            </Box>
          ) : (
            <>
              <Divider />
              <Stack spacing={1}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h5">ECL Expression Builder</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={() => setEditMode(false)}
                  >
                    Close
                  </Button>
                </Box>
              </Stack>

              <ECLExpressionEditor
                branch={branch}
                refsetId={refsetMember.referencedComponentId}
                previousEcl={refsetMember?.additionalFields?.query}
                actionButton={updateButton}
                newEcl={newEcl}
                setNewEcl={setNewEcl}
              />
            </>
          )}
        </Stack>
      ) : null}
    </Box>
  );
}

export default RefsetMemberDetails;
