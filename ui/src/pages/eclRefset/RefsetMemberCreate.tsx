import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
import ECLConceptsList from './components/ECLConceptsList.tsx';
import ECLBuilderThemeProvider from './themes/ECLBuilderTheme.tsx';
import ExpressionBuilder from 'ecl-builder';

function RefsetMemberCreate() {
  const navigate = useNavigate();
  const { taskKey, projectKey } = useParams();
  const task = useUserTaskByIds();
  const { login } = useUserStore();
  const { getMemberByReferencedComponentId } = useRefsetMemberStore();

  const branch =
    task?.branchPath ?? `MAIN/SNOMEDCT-AU/${projectKey}/${taskKey}`;

  const { isFetching: isFetchingRefsetMembers, refetch: refetchRefsetMembers } =
    useRefsetMembers(branch);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [searchOpen, setSearchOpen] = useState(true);

  const [selectedConcept, setSelectedConcept] = useState<Concept>();
  const [ecl, setEcl] = useState('');
  const [previewEcl, setPreviewEcl] = useState('');
  const [invalidEcl, setInvalidEcl] = useState(false);

  const existingRefset = getMemberByReferencedComponentId(
    selectedConcept?.conceptId,
  );

  const previewResults = () => {
    if (ecl !== previewEcl) {
      setInvalidEcl(false);
    }
    setPreviewEcl(ecl);
  };

  useEffect(() => {
    setSearchOpen(true);
    setSelectedConcept(undefined);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    setEcl('');
    setPreviewEcl('');
  }, [selectedConcept]);

  const onCreateSuccess = useCallback(() => {
    navigate('..');
    refetchRefsetMembers().catch(console.error);
  }, [navigate, refetchRefsetMembers]);

  return (
    <Stack spacing={2} pb="2em">
      <Typography variant="h4">
        Create a new query-based reference set
      </Typography>

      <Card sx={{ color: 'inherit' }}>
        <Stack direction={'row'} alignItems={'center'} width={'100%'}>
          <TextField
            variant="outlined"
            value={searchTerm}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(event.target.value);
            }}
            placeholder="Search for a reference set concept"
            InputProps={{
              startAdornment: <SearchIcon />,
              endAdornment: searchTerm ? (
                <Tooltip title="Clear">
                  <IconButton onClick={() => setSearchTerm('')}>
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              ) : null,
            }}
            sx={{ flex: 1 }}
          />
        </Stack>
      </Card>

      {debouncedSearchTerm && debouncedSearchTerm.length > 2 ? (
        <Box>
          <Accordion expanded={searchOpen} sx={{ border: 'none' }}>
            <AccordionSummary onClick={() => setSearchOpen(!searchOpen)}>
              <Typography>Reference set results</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: 0, border: 0 }}>
              <RefsetConceptsList
                branch={branch}
                searchTerm={debouncedSearchTerm}
                selectedConcept={selectedConcept}
                setSelectedConcept={setSelectedConcept}
              />
            </AccordionDetails>
          </Accordion>
        </Box>
      ) : null}

      {selectedConcept && isFetchingRefsetMembers ? (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : null}
      {selectedConcept && existingRefset ? (
        <Alert
          severity="info"
          sx={{
            color: 'rgb(1, 67, 97)',
            alignItems: 'center',
            '& .MuiAlert-message': {
              mt: 0,
            },
            '& .MuiSvgIcon-root': {
              fontSize: '22px',
            },
          }}
        >
          {`There is an existing query-based reference set for '${selectedConcept.fsn?.term || selectedConcept.pt?.term || selectedConcept.conceptId}'. `}
          <Link to={`../member/${existingRefset.memberId}`}>View details</Link>
        </Alert>
      ) : null}
      {selectedConcept && !isFetchingRefsetMembers && !existingRefset ? (
        <Stack spacing={2}>
          <Grid container rowSpacing={1}>
            <Grid item mr={'3em'}>
              <Stack spacing={1}>
                <RefsetDetailElement
                  label="Concept ID"
                  value={selectedConcept.conceptId}
                />
              </Stack>
            </Grid>
            <Grid item mr={'3em'}>
              <Stack spacing={1}>
                <RefsetDetailElement
                  label="Fully Specified Name"
                  value={selectedConcept.fsn?.term}
                />
                <RefsetDetailElement
                  label="Preferred Term"
                  value={selectedConcept.pt?.term}
                />
              </Stack>
            </Grid>
            <Grid item mr={'3em'}>
              <Stack spacing={1}>
                <RefsetDetailElement
                  label="Active"
                  value={selectedConcept.active}
                />
                <RefsetDetailElement
                  label="Primitive"
                  value={selectedConcept.definitionStatus === 'PRIMITIVE'}
                />
              </Stack>
            </Grid>
            <Grid item>
              <Stack spacing={1}>
                <RefsetDetailElement
                  label="Effective Time"
                  value={selectedConcept.effectiveTime ?? undefined}
                />
                <RefsetDetailElement
                  label="Module ID"
                  value={selectedConcept.moduleId ?? undefined}
                />
              </Stack>
            </Grid>
          </Grid>

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
            </Box>

            <ECLBuilderThemeProvider>
              <ExpressionBuilder
                expression={ecl}
                onChange={setEcl}
                options={{ terminologyServerUrl: '/snowstorm/fhir' }}
              />
            </ECLBuilderThemeProvider>
          </Stack>

          <Box>
            {login === task?.assignee.username ? (
              <ConfirmCreate
                concept={selectedConcept}
                ecl={ecl}
                branch={branch}
                buttonDisabled={!ecl.trim()}
                onSuccess={onCreateSuccess}
              />
            ) : null}
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              disabled={!ecl.trim()}
              onClick={() => previewResults()}
            >
              Preview
            </Button>
          </Box>

          {previewEcl ? (
            <>
              <Divider />
              <Stack
                direction="row"
                divider={<Divider orientation="vertical" flexItem />}
                justifyContent="space-between"
                pb="2em"
              >
                {invalidEcl ? (
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
                    <Box width="100%">
                      <ECLConceptsList
                        type="addition"
                        branch={branch}
                        ecl={previewEcl}
                        setInvalidEcl={setInvalidEcl}
                      />
                    </Box>
                  </>
                )}
              </Stack>
            </>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}

export default RefsetMemberCreate;
