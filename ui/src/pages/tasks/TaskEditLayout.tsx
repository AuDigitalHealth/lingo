import { Grid } from '@mui/material';

import useTaskById from '../../hooks/useTaskById.tsx';
import TaskEditCard from './components/TaskEditCard.tsx';
import TasksList from './components/TasksList.tsx';
import TaskTicket from './components/TaskTicket.tsx';
import { Stack } from '@mui/system';
import useTicketStore from '../../stores/TicketStore.ts';
import useJiraUserStore from '../../stores/JiraUserStore.ts';
import { InfoCircleOutlined } from '@ant-design/icons';
import IconButton from '../../components/@extended/IconButton.tsx';
import { useEffect, useState } from 'react';
import ProductAuthoring from '../products/ProductAuthoring.tsx';

function TaskEditLayout() {
  const task = useTaskById();
  const { activeTicket, setActiveTicket } = useTicketStore();
  const jiraUserStore = useJiraUserStore();
  const { jiraUsers } = jiraUserStore;
  const [menuOpen, setMenuOpen] = useState(true);
  const [firstOpen, setFirstOpen] = useState(true);
  const [productAuthoringOpen, setProductAuthoringOpen] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    if (firstOpen) {
      setActiveTicket(null);
      setFirstOpen(false);
    }
  }, []);

  return (
    <Stack
      sx={{
        minHeight: 'calc(100vh - 110px)',
        position: 'relative',
        width: '100%',
      }}
    >
      <Stack
        spacing={2}
        alignItems={'center'}
        width={'100%'}
        maxHeight={'calc(100vh - 110px)'}
      >
        <TasksList
          tasks={task ? [task] : []}
          heading="Task Details"
          dense={true}
          naked={true}
          jiraUsers={jiraUsers}
        />
        <Stack
          sx={{
            width: '100%',
            height: 'calc(100vh - 110px)',
            overflow: 'scroll',
          }}
          direction={'row'}
          spacing={3}
        >
          {menuOpen && activeTicket && (
            <Grid item lg={3} sx={{}}>
              <TaskTicket
                ticket={activeTicket}
                onBack={() => setActiveTicket(null)}
                onProductAuthoringOpen={() => setProductAuthoringOpen(true)}
              />
            </Grid>
          )}
          {menuOpen && !activeTicket && <TaskEditCard />}
          {productAuthoringOpen && activeTicket && (
            <Stack sx={{ width: '100%' }}>
              <ProductAuthoring />
            </Stack>
          )}
        </Stack>
      </Stack>

      {/* The buttons that will always float to the bottom right */}
      <Stack
        direction="column"
        sx={{ position: 'absolute', bottom: '0', right: '0' }}
        gap={1}
      >
        <IconButton
          variant={menuOpen ? 'contained' : 'outlined'}
          color="primary"
          aria-label="toggle-menu"
          onClick={handleMenuToggle}
        >
          <InfoCircleOutlined />
        </IconButton>
      </Stack>
    </Stack>
  );
}

export default TaskEditLayout;
