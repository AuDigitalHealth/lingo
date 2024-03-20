import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { useParams } from 'react-router-dom';
import { useRefsetMemberById } from '../../hooks/eclRefset/useRefsetMemberById.tsx';
import { Box, Button, Divider, Grid, Icon, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Concept } from '../../types/concept.ts';
import { useEffect, useState } from 'react';
import { useUpdateRefsetMember } from '../../hooks/eclRefset/useUpdateRefsetMember.tsx';
import { LoadingButton } from '@mui/lab';
import { RefsetMember } from '../../types/RefsetMember.ts';
import { enqueueSnackbar } from 'notistack';
import LoadingOverlay from './components/LoadingOverlay.tsx';


function RefsetMemberDetails() {
  const {taskKey, projectKey, memberId} = useParams();
  const task = useUserTaskByIds();

  let branch = task?.branchPath ?? `MAIN/SNOMEDCT-AU/${projectKey}/${taskKey}`

  const { refsetMemberData, refetchRefsetMember, isRefsetMemberFetching } = useRefsetMemberById(branch, memberId);

  const [refsetMember, setRefsetMember] = useState<RefsetMember>();
  const [editMode, setEditMode] = useState(false);
  const [newEcl, setNewEcl] = useState("")

  useEffect(() => {
    setRefsetMember(refsetMemberData ?? undefined)
  }, [refsetMemberData])

  useEffect(() => {
    setNewEcl(refsetMember?.additionalFields?.query ?? "")
  }, [refsetMember])

  const updateRefsetMutation = useUpdateRefsetMember(branch); 
  const { isError, isSuccess, data, isLoading } = updateRefsetMutation;

  const updateQuery = () => {
    if (refsetMember) {
      let newMember = {...refsetMember, additionalFields: {
        ...refsetMember.additionalFields,
        query: newEcl
      }}

      updateRefsetMutation.mutate(newMember);
    }
  }

  const concept = refsetMember?.referencedComponent as Concept;
  
  useEffect(() => {
    if (isSuccess) {
      // setEditMode(false);
      enqueueSnackbar(
        `ECL for reference set '${concept?.pt?.term || refsetMember?.referencedComponentId}' was updated successfully`,
        {
          variant: 'success',
          autoHideDuration: 5000
        },
      );
      refetchRefsetMember();
    }
  }, [data, isSuccess, isError, setEditMode]);

  const isUpdating = isRefsetMemberFetching || isLoading;

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
              <Typography variant="h6" fontWeight="bold">New ECL</Typography>
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
                InputProps={{
                  endAdornment: (
                    newEcl !== refsetMember.additionalFields?.query && !isUpdating ?
                    <Tooltip title="Reset">
                      <IconButton
                        onClick={() => setNewEcl(refsetMember.additionalFields?.query)}
                        edge="end"
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
                <LoadingButton 
                  loading={isLoading}
                  variant="contained" 
                  startIcon={<CheckIcon />} 
                  onClick={() => updateQuery()} 
                  disabled={newEcl === refsetMember.additionalFields?.query || isUpdating || !newEcl}
                  sx={{mr: "1em", color: '#fff'}}
                >
                  Update
                </LoadingButton>
                <Button 
                  variant="outlined" 
                  startIcon={<VisibilityIcon />} 
                  disabled={newEcl === refsetMember.additionalFields?.query || isUpdating || !newEcl}
                  onClick={() => console.log('preview')}
                >
                  Preview
                </Button>
              </Box>
              <Box>
                <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => setEditMode(false)}>
                  Close
                </Button>
              </Box>
            </Box>

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
