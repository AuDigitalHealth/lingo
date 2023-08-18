import { Grid } from '@mui/material';

import useTaskById from '../hooks/useTaskById';
import TaskEditCard from '../components/tasks/TaskEditCard';
import TasksList from '../components/TasksList';
import TaskTicket from '../components/tasks/TaskTicket';
import { Stack } from '@mui/system';
import useTicketStore from '../stores/TicketStore';

function TaskEditLayout() {
  const task = useTaskById();
  const { activeTicket } = useTicketStore();

  return (
    <Grid container sx={{ minHeight: 'calc(100vh - 110px)' }}>
      <Stack spacing={2} alignItems={'center'} width={'100%'}>
        <TasksList
          tasks={task ? [task] : []}
          heading=""
          dense={true}
          naked={true}
        />
        <Stack
          sx={{ height: '100%', width: '100%' }}
          direction={'row'}
          spacing={3}
        >
          <TaskEditCard />

          {activeTicket && (
            <Grid item lg={3} sx={{}}>
              <TaskTicket ticket={activeTicket} />
            </Grid>
          )}
        </Stack>
      </Stack>
    </Grid>
  );
}

export default TaskEditLayout;
