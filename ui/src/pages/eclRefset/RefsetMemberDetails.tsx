import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { useParams } from 'react-router-dom';
import { useRefsetMemberById } from '../../hooks/eclRefset/useRefsetMemberById.tsx';
import {
  Alert,
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Concept } from '../../types/concept.ts';
import { useCallback, useEffect, useRef, useState } from 'react';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import useUserStore from '../../stores/UserStore.ts';
import EclConceptsList from './components/ECLConceptsList.tsx';
import ConfirmUpdate from './components/ConfirmUpdate.tsx';
import RefsetDetailElement from './components/RefsetDetailElement.tsx';
import ECLBuilderThemeProvider from './themes/ECLBuilderTheme.tsx';
// import ExpressionBuilder from 'ecl-builder/src/index.ts';
import ExpressionBuilder from 'ecl-builder';

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
  const [previewEcl, setPreviewEcl] = useState('');
  const [addInvalidEcl, setAddInvalidEcl] = useState(false);
  const [delInvalidEcl, setDelInvalidEcl] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNewEcl(refsetMember?.additionalFields?.query ?? '');
    setPreviewEcl('');
  }, [refsetMember, editMode]);

  const previewChanges = () => {
    if (newEcl !== previewEcl) {
      setAddInvalidEcl(false);
      setDelInvalidEcl(false);
    }
    setPreviewEcl(newEcl);
  };

  const getAdditionsEcl = () => {
    const refsetId = refsetMember?.referencedComponentId;
    return refsetId && previewEcl
      ? `(${previewEcl}) MINUS (^ ${refsetId})`
      : '';
  };
  const getDeletionsEcl = () => {
    const refsetId = refsetMember?.referencedComponentId;
    return refsetId && previewEcl
      ? `(^ ${refsetId}) MINUS (${previewEcl})`
      : '';
  };

  const concept = refsetMember?.referencedComponent as Concept;

  const isUpdating = isRefsetMemberFetching;

  const onUpdateSuccess = useCallback(() => {
    refetchRefsetMember().catch(console.error);
  }, [refetchRefsetMember]);

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

                <ECLBuilderThemeProvider>
                  <ExpressionBuilder
                    expression={newEcl}
                    onChange={setNewEcl}
                    options={{ terminologyServerUrl: '/snowstorm/fhir' }}
                  />
                </ECLBuilderThemeProvider>
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  {login === task?.assignee.username ? (
                    <ConfirmUpdate
                      refsetMember={refsetMember}
                      newEcl={newEcl}
                      branch={branch}
                      buttonDisabled={
                        newEcl.trim() ===
                          refsetMember.additionalFields?.query ||
                        isUpdating ||
                        !newEcl.trim()
                      }
                      onSuccess={onUpdateSuccess}
                    />
                  ) : null}
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    disabled={
                      newEcl.trim() === refsetMember.additionalFields?.query ||
                      isUpdating ||
                      !newEcl.trim()
                    }
                    onClick={() => {
                      previewChanges();
                      setTimeout(() => {
                        previewRef.current?.scrollIntoView({
                          behavior: 'smooth',
                        });
                      });
                    }}
                  >
                    Preview
                  </Button>
                </Box>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    disabled={newEcl === refsetMember.additionalFields?.query}
                    onClick={() =>
                      setNewEcl(refsetMember.additionalFields?.query ?? '')
                    }
                  >
                    Reset
                  </Button>
                </Box>
              </Box>

              {previewEcl ? (
                <>
                  <Divider />
                  <Stack
                    direction="row"
                    divider={<Divider orientation="vertical" flexItem />}
                    justifyContent="space-between"
                    ref={previewRef}
                  >
                    {addInvalidEcl || delInvalidEcl ? (
                      <Alert
                        severity="error"
                        sx={{
                          color: 'rgb(95, 33, 32)',
                          alignItems: 'center',
                          width: '100%',
                          '& .MuiSvgIcon-root': {
                            fontSize: '22px',
                          },
                          '& .MuiAlert-message': {
                            mt: 0,
                          },
                        }}
                      >
                        Error: Check ECL expression
                      </Alert>
                    ) : (
                      <>
                        <Box width="49%">
                          <EclConceptsList
                            type="addition"
                            branch={branch}
                            ecl={getAdditionsEcl()}
                            setInvalidEcl={setAddInvalidEcl}
                          />
                        </Box>
                        <Box width="49%">
                          <EclConceptsList
                            type="deletion"
                            branch={branch}
                            ecl={getDeletionsEcl()}
                            setInvalidEcl={setDelInvalidEcl}
                          />
                        </Box>
                      </>
                    )}
                  </Stack>
                </>
              ) : null}
            </>
          )}
        </Stack>
      ) : null}
    </Box>
  );
}

export default RefsetMemberDetails;
