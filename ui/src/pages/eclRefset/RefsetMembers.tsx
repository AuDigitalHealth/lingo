import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { useNavigate, useParams } from 'react-router-dom';
import RefsetMemberList from './components/RefsetMemberList.tsx';
import { Box, Button, Stack } from '@mui/material';
import { PlusCircleOutlined } from '@ant-design/icons';
import useUserStore from '../../stores/UserStore.ts';

function RefsetMembers() {
  const navigate = useNavigate();
  const { taskKey, projectKey } = useParams();
  const task = useUserTaskByIds();
  const { login } = useUserStore();

  const branch =
    task?.branchPath ?? `MAIN/SNOMEDCT-AU/${projectKey}/${taskKey}`;

  return (
    <Box>
      <Stack sx={{ width: '100%', padding: '0em 0em 1em 1em' }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<PlusCircleOutlined />}
          sx={{ marginLeft: 'auto' }}
          disabled={login !== task?.assignee.username}
          onClick={() => navigate('create')}
        >
          Create
        </Button>
      </Stack>

      <RefsetMemberList heading="Query Reference Sets" branch={branch} />
    </Box>
  );
}

export default RefsetMembers;
