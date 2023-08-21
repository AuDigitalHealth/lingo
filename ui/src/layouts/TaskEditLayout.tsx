import { Fab, Grid } from '@mui/material';

import useTaskById from '../hooks/useTaskById';
import TaskEditCard from '../components/tasks/TaskEditCard';
import TasksList from '../components/TasksList';
import TaskTicket from '../components/tasks/TaskTicket';
import { Stack } from '@mui/system';
import useTicketStore from '../stores/TicketStore';
import useJiraUserStore from '../stores/JiraUserStore.ts';
import {
  CalendarOutlined,
  CalendarTwoTone,
  InfoCircleOutlined,
  InfoCircleTwoTone,
} from '@ant-design/icons';
import IconButton from '../components/@extended/IconButton.tsx';
import { useEffect, useState } from 'react';

function TaskEditLayout() {
  const task = useTaskById();
  const { activeTicket } = useTicketStore();
  const jiraUserStore = useJiraUserStore();
  const { jiraUsers } = jiraUserStore;
  const [menuOpen, setMenuOpen] = useState(true);
  const [ticketMenuOpen, setTicketMenuOpen] = useState(true);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleTicketMenuToggle = () => {
    setTicketMenuOpen(!ticketMenuOpen);
  };

  useEffect(() => {
    const newValue = activeTicket === null ? false : true;
    setTicketMenuOpen(newValue);
  }, [activeTicket]);

  return (
    <Grid
      container
      sx={{ minHeight: 'calc(100vh - 110px)', position: 'relative' }}
    >
      <Stack spacing={2} alignItems={'center'} width={'100%'}>
        <TasksList
          tasks={task ? [task] : []}
          heading=""
          dense={true}
          naked={true}
          jiraUsers={jiraUsers}
        />
        <Stack
          sx={{ height: '100%', width: '100%' }}
          direction={'row'}
          spacing={3}
        >
          {menuOpen && <TaskEditCard />}

          {activeTicket && ticketMenuOpen && (
            <Grid item lg={3} sx={{}}>
              <TaskTicket ticket={activeTicket} />
            </Grid>
          )}
        </Stack>
      </Stack>
      <Stack
        direction="column"
        sx={{ position: 'absolute', bottom: '0', right: '0' }}
        gap={1}
      >
        <IconButton
          variant={ticketMenuOpen ? 'contained' : 'outlined'}
          color="primary"
          aria-label="toggle-task-menu"
          onClick={handleTicketMenuToggle}
        >
          <CalendarOutlined />
        </IconButton>
        <IconButton
          variant={menuOpen ? 'contained' : 'outlined'}
          color="primary"
          aria-label="toggle-menu"
          onClick={handleMenuToggle}
        >
          <InfoCircleOutlined />
        </IconButton>
      </Stack>
    </Grid>
  );
}

export default TaskEditLayout;
