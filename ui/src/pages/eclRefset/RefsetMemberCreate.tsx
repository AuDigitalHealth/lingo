import { Link, useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { Concept } from '../../types/concept.ts';
import { useCallback, useEffect, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import useDebounce from '../../hooks/useDebounce.tsx';
import RefsetConceptsList from './components/RefsetConceptsList.tsx';
import { useQueryRefsets } from '../../hooks/eclRefset/useQueryRefsets.tsx';
import useRefsetMemberStore from '../../stores/RefsetMemberStore.ts';
import ECLExpressionEditor from './components/ECLExpressionEditor.tsx';
import { useCreateRefsetMember } from '../../hooks/eclRefset/useUpdateRefsetMember.tsx';
import { RefsetMember } from '../../types/RefsetMember.ts';
import { QUERY_REFERENCE_SET } from './utils/constants.tsx';
import RefsetConceptDetails from './components/RefsetConceptDetails.tsx';
import useBranch from '../../hooks/eclRefset/useBranch.tsx';
import MainCard from '../../components/MainCard.tsx';

function RefsetMemberCreate() {
  const navigate = useNavigate();
  const { getMemberByReferencedComponentId } = useRefsetMemberStore();

  const branch = useBranch();

  const { isFetching: isFetchingRefsetMembers, refetch: refetchRefsetMembers } =
    useQueryRefsets(branch);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [searchOpen, setSearchOpen] = useState(true);

  const [selectedConcept, setSelectedConcept] = useState<Concept>();
  const [ecl, setEcl] = useState('');

  const existingRefset = getMemberByReferencedComponentId(
    selectedConcept?.conceptId,
  );

  useEffect(() => {
    setSearchOpen(true);
    setSelectedConcept(undefined);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    setEcl('');
  }, [selectedConcept]);

  const createRefsetMutation = useCreateRefsetMember(branch);
  const { isSuccess, isPending } = createRefsetMutation;

  const onCreateSuccess = useCallback(() => {
    navigate('..');
    refetchRefsetMembers().catch(console.error);
  }, [navigate, refetchRefsetMembers]);

  const createRefset = (confirmEcl: string) => {
    if (selectedConcept && confirmEcl) {
      const newMember: RefsetMember = {
        active: true,
        referencedComponentId: selectedConcept.conceptId ?? '',
        refsetId: QUERY_REFERENCE_SET,
        additionalFields: {
          query: confirmEcl,
        },
      };

      createRefsetMutation.mutate(newMember);
    }
  };

  const refSetSearch = () => {
    return (
      <>
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
          <Box
            sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
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
            <Link to={`../member/${existingRefset.memberId}`}>
              View details
            </Link>
          </Alert>
        ) : null}
        {selectedConcept && !isFetchingRefsetMembers && !existingRefset ? (
          <Stack spacing={2}>
            <RefsetConceptDetails concept={selectedConcept} />
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
            </Stack>

            <ECLExpressionEditor
              branch={branch}
              action={'create'}
              concept={selectedConcept}
              newEcl={ecl}
              setNewEcl={setEcl}
              onConfirm={createRefset}
              onSuccess={onCreateSuccess}
              actionDisabled={!ecl.trim()}
              isActionLoading={isPending}
              isActionSuccess={isSuccess}
            />
          </Stack>
        ) : null}
      </>
    );
  };

  return (
    <Stack spacing={2} pb="2em">
      <Typography variant="h4">
        Create a new query-based reference set
      </Typography>

      <MainCard sx={{ color: 'inherit', width: 'auto' }}>
        <Stack direction={'row'} alignItems={'center'} width={'100%'} gap={2}>
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
      </MainCard>
      {refSetSearch()}
    </Stack>
  );
}

export default RefsetMemberCreate;
