import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { useParams } from 'react-router-dom';
import { Alert, Box, Button, Card, Divider, Grid, Icon, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { Concept } from '../../types/concept.ts';
import { useEffect, useState } from 'react';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import useUserStore from '../../stores/UserStore.ts';
import EclConceptsList from './components/ECLConceptsList.tsx';
import SearchIcon from '@mui/icons-material/Search';

function RefsetMemberCreate() {
  const {taskKey, projectKey} = useParams();
  const task = useUserTaskByIds();
  const { login } = useUserStore();

  let branch = task?.branchPath ?? `MAIN/SNOMEDCT-AU/${projectKey}/${taskKey}`

  const [searchTerm, setSearchTerm] = useState("");


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
      
    </Stack>
  );
}

export default RefsetMemberCreate;
