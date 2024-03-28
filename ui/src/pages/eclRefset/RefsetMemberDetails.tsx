import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { useParams } from 'react-router-dom';
import { useRefsetMemberById } from '../../hooks/eclRefset/useRefsetMemberById.tsx';
import { Alert, Box, Button, Divider, Grid, Icon, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Concept } from '../../types/concept.ts';
import { useEffect, useState } from 'react';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import useUserStore from '../../stores/UserStore.ts';
import EclConceptsList from './components/ECLConceptsList.tsx';
import ConfirmUpdate from './components/ConfirmUpdate.tsx';

function RefsetMemberDetails() {
  const {taskKey, projectKey, memberId} = useParams();
  const task = useUserTaskByIds();
  const { login } = useUserStore();

  let branch = task?.branchPath ?? `MAIN/SNOMEDCT-AU/${projectKey}/${taskKey}`

  const { refsetMemberData: refsetMember, refetchRefsetMember, isRefsetMemberFetching } = useRefsetMemberById(branch, memberId);

  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [newEcl, setNewEcl] = useState("");
  const [previewEcl, setPreviewEcl] = useState('');
  const [addInvalidEcl, setAddInvalidEcl] = useState(false);
  const [delInvalidEcl, setDelInvalidEcl] = useState(false);

  useEffect(() => {
    setNewEcl(refsetMember?.additionalFields?.query ?? "")
    setPreviewEcl("");
    setPreviewMode(false);
  }, [refsetMember, editMode])


  const previewChanges = () => {
    if (newEcl !== previewEcl) {
      setAddInvalidEcl(false);
      setDelInvalidEcl(false);
    }
    setPreviewEcl(newEcl);
    setPreviewMode(true);
  }

  const getAdditionsEcl = () => {
    let refsetId = refsetMember?.referencedComponentId
    return refsetId && previewEcl ? `(${previewEcl}) MINUS (^ ${refsetId})` : "";
  }
  const getDeletionsEcl = () => {
    let refsetId = refsetMember?.referencedComponentId
    return refsetId && previewEcl ? `(^ ${refsetId}) MINUS (${previewEcl})` : "";
  }

  const concept = refsetMember?.referencedComponent as Concept;
  

  const isUpdating = isRefsetMemberFetching;

  return (
    <Box sx={{position: 'relative'}}>
      {isRefsetMemberFetching ?
      <LoadingOverlay />
      : null}

      {refsetMember ?
      <Stack spacing={2}>
        <Typography variant="h4">{concept?.pt?.term ?? concept?.fsn?.term ?? memberId}</Typography>

        <Grid container rowSpacing={1}>
          <Grid item mr={"3em"}>
            <Stack spacing={1}>
              <RefsetDetailElement label='Member ID' value={refsetMember.memberId} />
              <RefsetDetailElement label='Referenced Component ID' value={refsetMember.referencedComponentId} />
            </Stack>
          </Grid>
          {
            concept ?
            <Grid item mr={"3em"}>
              <Stack spacing={1}>
                <RefsetDetailElement label='Fully Specified Name' value={concept.fsn?.term} />
                <RefsetDetailElement label='Preferred Term' value={concept.pt?.term} />
              </Stack>
            </Grid>
            : null
          }
          <Grid item>
            <Stack spacing={1}>
              <RefsetDetailElement label='Active' value={refsetMember.active} />
              <RefsetDetailElement label='Released' value={refsetMember.released} />
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{width: "100%"}}>
          <Typography variant="h6" fontWeight="bold">ECL</Typography>
          <TextField 
            multiline
            fullWidth
            value={refsetMember.additionalFields?.query}
            InputProps={{
              readOnly: true
            }}
          />
        </Box>

        {
          !editMode ?
          <Box sx={{textAlign: 'right'}}>
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
              Edit ECL
            </Button>
          </Box>
          : 
          <>
            <Divider />
            <Box sx={{width: "100%"}}>
              <Typography variant="h6" fontWeight="bold">New ECL Expression</Typography>
              <TextField
                multiline
                fullWidth
                inputRef={(input) => input && input.focus()}
                onFocus={(e) =>
                    e.currentTarget.setSelectionRange(
                    e.currentTarget.value.length,
                    e.currentTarget.value.length
                )}
                value={newEcl}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setNewEcl(event.target.value);
                }}
                disabled={previewMode}
                InputProps={{
                  endAdornment: (
                    newEcl !== refsetMember.additionalFields?.query && !isUpdating ?
                    <Tooltip title="Reset">
                      <IconButton
                        disabled={previewMode}
                        onClick={() => setNewEcl(refsetMember.additionalFields?.query)}
                      >
                        <RestartAltIcon />
                      </IconButton>
                    </Tooltip>
                    : null)
                }}
              />
            </Box>

            <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
              <Box>
                {
                  login === task?.assignee.username ?
                    <ConfirmUpdate 
                      refsetMember={refsetMember}
                      newEcl={newEcl}
                      branch={branch}
                      buttonDisabled={newEcl.trim() === refsetMember.additionalFields?.query || isUpdating || !newEcl}
                      onSuccess={() => {
                        refetchRefsetMember();
                      }}
                    />
                  : null
                }
                {
                  previewMode ?
                  <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setPreviewMode(false)}>
                    Continue Editing
                  </Button>
                  : 
                  <Button 
                    variant="outlined" 
                    startIcon={<VisibilityIcon />} 
                    disabled={newEcl.trim() === refsetMember.additionalFields?.query || isUpdating || !newEcl}
                    onClick={() => previewChanges()}
                  >
                    Preview
                  </Button>
                }
              </Box>
              <Box>
                <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => setEditMode(false)}>
                  Close
                </Button>
              </Box>
            </Box>
            
            {previewEcl ?
            <>
              <Divider />
              <Stack 
                direction="row"
                divider={<Divider orientation="vertical" flexItem />}
                justifyContent="space-between"
                pb="2em"
              >
                {
                  addInvalidEcl || delInvalidEcl ?
                  <Alert severity="error" sx={{
                    color: "rgb(95, 33, 32)",
                    alignItems: 'center',
                    width: '100%',
                    '& .MuiSvgIcon-root': {
                      fontSize: '22px'
                    },
                    '& .MuiAlert-message': {
                      mt: 0
                    }
                  }}
                  >
                    Error: Check ECL expression
                  </Alert>
                  : 
                  <>
                    <Box width="49%">
                      <EclConceptsList type='addition' branch={branch} ecl={getAdditionsEcl()} setInvalidEcl={setAddInvalidEcl}/>
                    </Box>
                    <Box width="49%">
                      <EclConceptsList type='deletion' branch={branch} ecl={getDeletionsEcl()} setInvalidEcl={setDelInvalidEcl}/>
                    </Box>
                  </>
                }
              </Stack>
            </>
            : null}
          </>
        }
      </Stack>

      : null}
    </Box>
  );
}

interface RefsetDetailElementProps {
  label: string;
  value?: string | boolean;
}

function RefsetDetailElement({label, value}: RefsetDetailElementProps) {
  return (
    <Box>
      <Typography variant="h6" fontWeight="bold">{label}</Typography>
      {
        value === undefined ?
        <Typography variant="body1" sx={{visibility: 'hidden'}}>undefined</Typography> :

        typeof value === "boolean" ? 
        <Icon fontSize="inherit" sx={{"& .MuiSvgIcon-root": {fontSize: 'inherit'}}}>{value ? <CheckIcon /> : <CloseIcon />}</Icon> 
        : <Typography variant="body1">{value}</Typography>
      }
      
    </Box>
  )
}

export default RefsetMemberDetails;
