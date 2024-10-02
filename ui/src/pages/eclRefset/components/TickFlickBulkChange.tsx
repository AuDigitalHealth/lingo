import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import BaseModal from '../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../components/modal/BaseModalHeader.tsx';
import BaseModalFooter from '../../../components/modal/BaseModalFooter.tsx';
import { useReplaceMembersBulk } from '../../../hooks/eclRefset/useUpdateRefsetMember.tsx';
import { enqueueSnackbar } from 'notistack';
import SyncOutlined from '@ant-design/icons/lib/icons/SyncOutlined';
import useUserTaskByIds from '../../../hooks/eclRefset/useUserTaskByIds.tsx';
import useUserStore from '../../../stores/UserStore.ts';
import { useRefsetConceptIds } from '../../../hooks/eclRefset/useRefsetConceptIds.tsx';
import { useValidateConcepts } from '../../../hooks/eclRefset/useValidateConcepts.tsx';
import { Query, useQueryClient } from '@tanstack/react-query';
import LinearWithLabel from '../../../components/@extended/progress/LinearWithLabel.tsx';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import TickFlickSyncConceptsModal from './TickFlickSyncConceptsModal.tsx';

interface TickFlickBulkChangeProps {
  branch: string;
  referenceSet: string;
}

export default function TickFlickBulkChange({
  branch,
  referenceSet,
}: TickFlickBulkChangeProps) {
  const task = useUserTaskByIds();
  const { login } = useUserStore();
  const queryClient = useQueryClient();

  const [bulkChangeModalOpen, setBulkChangeModalOpen] = useState(false);

  const handleClose = () => setBulkChangeModalOpen(false);

  const [isEditing, setIsEditing] = useState(true);
  const [passedValidation, setPassedValidation] = useState(false);

  const replaceMutation = useReplaceMembersBulk(branch, referenceSet);
  const {
    isSuccess: isReplaceSuccess,
    isPending: isReplacePending,
    reset: resetReplace,
  } = replaceMutation;
  useEffect(() => {
    if (isReplaceSuccess) {
      enqueueSnackbar(`Reference set updated successfully.`, {
        variant: 'success',
        autoHideDuration: 5000,
      });

      setPassedValidation(false);
      setIsEditing(true);
      setSelectedConceptIdsText('');
      setUniqueConceptIds([]);
      setAllowInactives(false);
      setInvalidConceptIds(undefined);

      handleClose();

      resetReplace();
      queryClient
        .invalidateQueries({
          predicate: (query: Query) =>
            (query.queryKey[0] as string).startsWith(
              `concept-${branch}-^ ${referenceSet}`,
            ),
        })
        .catch(console.error);
    }
  }, [isReplaceSuccess, branch, referenceSet, resetReplace, queryClient]);

  const {
    data: currConceptIds,
    isFetching: currConceptIdsFetching,
    progress: currConceptIdsProgress,
  } = useRefsetConceptIds(branch, !isEditing ? referenceSet : '');

  const [selectedConceptIdsText, setSelectedConceptIdsText] = useState('');
  const [uniqueConceptIds, setUniqueConceptIds] = useState(Array<string>());
  const [conceptsToRetire, setConceptsToRetire] = useState<string[]>();
  const [conceptsToAdd, setConceptsToAdd] = useState<string[]>();

  useEffect(() => {
    setConceptsToRetire(
      currConceptIds?.filter(c => !uniqueConceptIds.includes(c)),
    );
    setConceptsToAdd(
      currConceptIds
        ? uniqueConceptIds.filter(c => !currConceptIds.includes(c))
        : undefined,
    );
  }, [currConceptIds, uniqueConceptIds]);

  const [allowInactives, setAllowInactives] = useState(false);
  const [invalidConceptIds, setInvalidConceptIds] = useState<string[]>();

  const {
    validateConceptIds,
    validateLoading,
    progress: validateProgress,
  } = useValidateConcepts(branch);

  const getPreview = () => {
    setIsEditing(false);
    setPassedValidation(false);
    setInvalidConceptIds([]);

    const conceptIds = selectedConceptIdsText
      .trim()
      .split('\n')
      .reduce((accumulator, conceptId, idx, arr) => {
        conceptId = conceptId.trim();
        if (!!conceptId && arr.indexOf(conceptId) === idx)
          accumulator.push(conceptId);
        return accumulator;
      }, Array<string>());

    setUniqueConceptIds(conceptIds);

    setTimeout(() => {
      validateConceptIds(conceptIds, allowInactives)
        .then(validIds => {
          const invalidIds = validIds
            ? conceptIds.filter(c => !validIds.includes(c))
            : undefined;
          setInvalidConceptIds(invalidIds);
          if (invalidIds && !invalidIds.length) {
            // No invalid IDs found
            setPassedValidation(true);
          }
        })
        .catch(console.error);
    }, 0);
  };

  const confirmBulkChange = () => {
    if (conceptsToAdd && conceptsToRetire) {
      replaceMutation.mutate({
        addConceptIds: conceptsToAdd,
        retireConceptIds: conceptsToRetire,
      });
    }
  };

  const [progressPercent, setProgressPercent] = useState<number>();
  useEffect(() => {
    const retrieved =
      currConceptIdsProgress.retrieved + validateProgress.retrieved;
    const total = currConceptIdsProgress.total + validateProgress.total;
    // estimate half weighting for validation progress if size of current refset is still being fetched
    setProgressPercent(
      total
        ? (retrieved / total) * (currConceptIdsProgress.total ? 100 : 50)
        : undefined,
    );
  }, [currConceptIdsProgress, validateProgress]);

  const previewComplete =
    isReplacePending ||
    (passedValidation && !currConceptIdsFetching && currConceptIds);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<SyncOutlined />}
        disabled={login !== task?.assignee.username}
        onClick={() => setBulkChangeModalOpen(true)}
      >
        Sync With List
      </Button>
      <BaseModal
        open={bulkChangeModalOpen}
        handleClose={isReplacePending ? undefined : handleClose}
      >
        <BaseModalHeader title={'Sync With List'} />
        <BaseModalBody
          sx={{
            padding: 0,
            width: 800,
          }}
        >
          <Stack
            width="100%"
            spacing={1}
            sx={{
              maxHeight: '80vh',
              padding: '1em',
            }}
          >
            <Stack direction="row" spacing={1} width="100%" pt="8px">
              <TextField
                multiline
                fullWidth
                maxRows={24}
                label="Concept IDs"
                value={selectedConceptIdsText}
                helperText={
                  !uniqueConceptIds.length
                    ? ''
                    : `${uniqueConceptIds.length} concept ID${uniqueConceptIds.length !== 1 ? 's' : ''}`
                }
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setSelectedConceptIdsText(event.target.value);
                }}
                disabled={
                  validateLoading ||
                  currConceptIdsFetching ||
                  (passedValidation && !!currConceptIds)
                }
                sx={{
                  '& .MuiInputLabel-root': {
                    lineHeight: '1.4375em',
                  },
                }}
              />

              {invalidConceptIds && invalidConceptIds.length ? (
                <TextField
                  multiline
                  maxRows={24}
                  label={`Invalid concept IDs`}
                  error
                  value={invalidConceptIds?.join('\n')}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    width: '30em',
                  }}
                />
              ) : null}

              {previewComplete && conceptsToAdd && conceptsToRetire ? (
                <Stack spacing={2} width="30em">
                  <TextField
                    multiline
                    maxRows={10}
                    label="Additions"
                    color="success"
                    value={conceptsToAdd.join('\n')}
                    InputProps={{
                      readOnly: true,
                    }}
                    helperText={
                      <Stack
                        direction="row"
                        width="100%"
                        justifyContent="space-between"
                        component="span"
                      >
                        <Box component="span">{`${conceptsToAdd.length} concept${conceptsToAdd.length !== 1 ? 's' : ''}`}</Box>
                        {conceptsToAdd.length ? (
                          <TickFlickSyncConceptsModal
                            conceptIds={conceptsToAdd}
                            title="Additions"
                          />
                        ) : null}
                      </Stack>
                    }
                    sx={theme => ({
                      '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline':
                        {
                          borderColor: theme.palette.success.main,
                        },
                      '& .MuiInputLabel-outlined': {
                        color: theme.palette.success.main,
                      },
                    })}
                  />
                  <TextField
                    multiline
                    maxRows={10}
                    label="Deletions"
                    color="error"
                    value={conceptsToRetire.join('\n')}
                    InputProps={{
                      readOnly: true,
                    }}
                    helperText={
                      <Stack
                        direction="row"
                        width="100%"
                        justifyContent="space-between"
                        component="span"
                      >
                        <Box component="span">{`${conceptsToRetire.length} concept${conceptsToRetire.length !== 1 ? 's' : ''}`}</Box>
                        {conceptsToRetire.length ? (
                          <TickFlickSyncConceptsModal
                            conceptIds={conceptsToRetire}
                            title="Deletions"
                          />
                        ) : null}
                      </Stack>
                    }
                    sx={theme => ({
                      '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline':
                        {
                          borderColor: theme.palette.error.main,
                        },
                      '& .MuiInputLabel-outlined': {
                        color: theme.palette.error.main,
                      },
                    })}
                  />
                </Stack>
              ) : null}
            </Stack>

            {previewComplete && conceptsToRetire && conceptsToAdd ? (
              <Stack
                direction="row"
                sx={{
                  whiteSpace: 'pre-wrap',
                  '& .MuiTypography-root': { fontWeight: 'bold' },
                }}
              >
                <Typography>This change will </Typography>
                <Typography
                  sx={theme => ({
                    color: theme.palette.error.main,
                  })}
                >
                  retire {conceptsToRetire.length} concepts
                </Typography>
                <Typography> and </Typography>
                <Typography
                  sx={theme => ({
                    color: theme.palette.success.main,
                  })}
                >
                  add {conceptsToAdd.length} concepts
                </Typography>
                <Typography>. Do you wish to continue?</Typography>
              </Stack>
            ) : null}
          </Stack>
        </BaseModalBody>
        <BaseModalFooter
          startChildren={
            <>
              {previewComplete ? (
                <Button
                  variant="contained"
                  onClick={() => {
                    setIsEditing(true);
                    setPassedValidation(false);
                    setUniqueConceptIds([]);
                  }}
                  disabled={isReplacePending}
                  startIcon={<EditIcon />}
                >
                  Keep Editing
                </Button>
              ) : (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allowInactives}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setAllowInactives(event.target.checked)
                      }
                      sx={{ marginLeft: '8px' }}
                    />
                  }
                  label="Allow inactive concepts"
                />
              )}
            </>
          }
          endChildren={
            <Stack direction="row" spacing={1} alignItems="center">
              {!isReplacePending &&
              (currConceptIdsFetching || validateLoading) &&
              !invalidConceptIds?.length &&
              progressPercent !== undefined ? (
                <Box width="10rem">
                  <LinearWithLabel value={progressPercent}></LinearWithLabel>
                </Box>
              ) : null}
              {previewComplete ? (
                <LoadingButton
                  variant="contained"
                  loading={isReplacePending}
                  loadingPosition="start"
                  color="success"
                  startIcon={<CheckIcon />}
                  disabled={!conceptsToAdd?.length && !conceptsToRetire?.length}
                  onClick={() => confirmBulkChange()}
                  sx={{ color: '#fff', textTransform: 'none' }}
                >
                  Confirm Sync
                </LoadingButton>
              ) : (
                <LoadingButton
                  variant="contained"
                  loading={
                    validateLoading ||
                    (passedValidation && currConceptIdsFetching)
                  }
                  loadingPosition="start"
                  startIcon={<VisibilityIcon />}
                  disabled={!selectedConceptIdsText.trim()}
                  onClick={() => getPreview()}
                  sx={{ color: '#fff', textTransform: 'none' }}
                >
                  Preview
                </LoadingButton>
              )}
              <Button
                variant="contained"
                onClick={handleClose}
                color="error"
                disabled={isReplacePending}
              >
                Cancel
              </Button>
            </Stack>
          }
        />
      </BaseModal>
    </>
  );
}
