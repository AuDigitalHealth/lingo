import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Card, CircularProgress, Grid, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { Concept } from '../../types/concept.ts';
import { useCallback, useEffect, useState } from 'react';
import useUserStore from '../../stores/UserStore.ts';
import SearchIcon from '@mui/icons-material/Search';
import useDebounce from '../../hooks/useDebounce.tsx';
import RefsetConceptsList from './components/RefsetConceptsList.tsx';
import RefsetDetailElement from './components/RefsetDetailElement.tsx';
import ConfirmCreate from './components/ConfirmCreate.tsx';
import { useRefsetMembers } from '../../hooks/eclRefset/useRefsetMembers.tsx';
import useRefsetMemberStore from '../../stores/RefsetMemberStore.ts';

function RefsetMemberCreate() {
  const navigate = useNavigate();
  const {taskKey, projectKey} = useParams();
  const task = useUserTaskByIds();
  const { login } = useUserStore();
  const { getMemberByReferencedComponentId } = useRefsetMemberStore();

  const branch = task?.branchPath ?? `MAIN/SNOMEDCT-AU/${projectKey}/${taskKey}`

  const { isFetching: isFetchingRefsetMembers, refetch: refetchRefsetMembers } = useRefsetMembers(branch);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const [selectedConcept, setSelectedConcept] = useState<Concept>();
  const [ecl, setEcl] = useState("");

  const existingRefset = getMemberByReferencedComponentId(selectedConcept?.conceptId);  

  useEffect(() => {
    setSelectedConcept(undefined)
  }, [searchTerm])

  useEffect(() => {
    setEcl("")
  }, [selectedConcept])

  const onCreateSuccess = useCallback(() => {
    navigate("..");
    refetchRefsetMembers().catch(console.error);
  }, [navigate, refetchRefsetMembers])

  return (
    <Stack spacing={2}>

      <Typography variant="h4">Create a new query-based reference set</Typography>
      
      <Card sx={{color: 'inherit'}}>
        <Stack direction={'row'} alignItems={'center'} width={'100%'}>
          <TextField
            variant="outlined"
            value={searchTerm}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(event.target.value);
            }}
            placeholder="Search for a reference set concept"
            inputRef={(input: HTMLInputElement) => input && input.focus()}
            InputProps={{
              startAdornment: <SearchIcon />,
              endAdornment: searchTerm ? 
                <Tooltip title="Clear">
                  <IconButton onClick={() => setSearchTerm("")}>
                    <ClearIcon />
                  </IconButton>
                </Tooltip> : null
            }}
            sx={{ flex: 1 }}
          />
        </Stack>
      </Card>

      {
        debouncedSearchTerm && debouncedSearchTerm.length > 2 ?
        <RefsetConceptsList 
          branch={branch} 
          searchTerm={debouncedSearchTerm} 
          selectedConcept={selectedConcept} 
          setSelectedConcept={setSelectedConcept} 
        />
        : null
      }

      {
        selectedConcept && isFetchingRefsetMembers ?
        <Box sx={{width: '100%', display: 'flex', justifyContent: 'center'}}>
          <CircularProgress />
        </Box>
        : null
      }
      {
        selectedConcept && existingRefset ?
        <Alert severity='info' sx={{
          color: 'rgb(1, 67, 97)', 
          alignItems: 'center',
          '& .MuiAlert-message': {
            mt: 0
          },
          '& .MuiSvgIcon-root': {
            fontSize: '22px'
          }
          }}>
          {`There is an existing query-based reference set for '${selectedConcept.fsn?.term || selectedConcept.pt?.term || selectedConcept.conceptId}'. `} 
          <Link to={`../member/${existingRefset.memberId}`}>View details</Link>
        </Alert>
        : null
      }
      {
        selectedConcept && !isFetchingRefsetMembers && !existingRefset ?
        <Stack spacing={2}>
          <Grid container rowSpacing={1}>
            <Grid item mr={"3em"}>
              <Stack spacing={1}>
                <RefsetDetailElement label='Concept ID' value={selectedConcept.conceptId} />
              </Stack>
            </Grid>
            <Grid item mr={"3em"}>
              <Stack spacing={1}>
                <RefsetDetailElement label='Fully Specified Name' value={selectedConcept.fsn?.term} />
                <RefsetDetailElement label='Preferred Term' value={selectedConcept.pt?.term} />
              </Stack>
            </Grid>
            <Grid item mr={"3em"}>
              <Stack spacing={1}>
                <RefsetDetailElement label='Active' value={selectedConcept.active} />
                <RefsetDetailElement label='Primitive' value={selectedConcept.definitionStatus === "PRIMITIVE"} />
              </Stack>
            </Grid>
            <Grid item>
              <Stack spacing={1}>
                <RefsetDetailElement label='Effective Time' value={selectedConcept.effectiveTime ?? undefined} />
                <RefsetDetailElement label='Module ID' value={selectedConcept.moduleId ?? undefined} />
              </Stack>
            </Grid>
          </Grid>

          <Box sx={{width: "100%"}}>
            <Typography variant="h6" fontWeight="bold">ECL</Typography>
            <TextField 
              multiline
              fullWidth
              value={ecl}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setEcl(event.target.value);
              }}
            />
          </Box>

          <Box>
            {
              login === task?.assignee.username ?
                <ConfirmCreate 
                  concept={selectedConcept}
                  ecl={ecl}
                  branch={branch}
                  buttonDisabled={!ecl.trim()}
                  onSuccess={onCreateSuccess}
                />
              : null
            }
          </Box>
        </Stack>
        : null
      }
    </Stack>
  );
}

export default RefsetMemberCreate;
