import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QueryRefsetList from './components/QueryRefsetList.tsx';
import { Box, Button, Stack, Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { PlusCircleOutlined } from '@ant-design/icons';
import useUserStore from '../../stores/UserStore.ts';
import TickFlickRefsetList from './components/TickFlickRefsetList.tsx';
import useBranch from '../../hooks/eclRefset/useBranch.tsx';
import useSnodineTaskByKey from '../../hooks/eclRefset/useSnodineTaskByKey.tsx';

type RefsetType = 'query' | 'tickflick';

function Refsets() {
  const navigate = useNavigate();
  const { taskKey } = useParams();
  const task = useSnodineTaskByKey(taskKey);
  const { login } = useUserStore();

  const branch = useBranch();

  const [tab, setTab] = useState<RefsetType>('query');

  return (
    <Box
      sx={{
        '& .MuiTabPanel-root': {
          padding: 0,
        },
      }}
    >
      <TabContext value={tab}>
        <TabList onChange={(_, value) => setTab(value as RefsetType)}>
          <Tab label="Query-Based" value="query" />
          <Tab label="Tick and Flick" value="tickflick" />
        </TabList>
        <TabPanel value="query">
          <Box>
            <Stack sx={{ width: '100%', padding: '0em 0em 1em 1em' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<PlusCircleOutlined />}
                sx={{ marginLeft: 'auto' }}
                disabled={login !== task?.assignee.username}
                onClick={() => navigate('qs')}
              >
                Create
              </Button>
            </Stack>

            <QueryRefsetList branch={branch} />
          </Box>
        </TabPanel>
        <TabPanel value="tickflick">
          <TickFlickRefsetList branch={branch} />
        </TabPanel>
      </TabContext>
    </Box>
  );
}

export default Refsets;
