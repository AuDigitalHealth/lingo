import { Card, Divider, IconButton, Stack, Typography } from '@mui/material';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import Description from '../../tickets/Description';
import TicketFields from '../../tickets/individual/components/TicketFields';
import { ArrowBack } from '@mui/icons-material';
import useTicketById from '../../../hooks/useTicketById';
import Loading from '../../../components/Loading';
import ProductAuthoring from '../../products/ProductAuthoring';
import useTaskById from '../../../hooks/useTaskById';
import { Task } from '../../../types/task';
import ProductModelReadonly from '../../products/ProductModelReadonly.tsx';
import TicketProducts from '../../tickets/components/TicketProducts.tsx';

interface TaskTicketProps {
  menuOpen: boolean;
}
function TaskTicket({ menuOpen }: TaskTicketProps) {
  // These all need to be tied to actions - ? Whatever these actions look like, I really have no idea at the moment.
  // For now, we just have buttons
  const { id, ticketId } = useParams();
  const task = useTaskById();
  const ticket = useTicketById(ticketId, true);

  if (ticket === undefined) {
    return <Loading />;
  }
  return (
    <Stack flexDirection={'row'} width={'100%'} gap={3}>
      {menuOpen && (
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxWidth: '450px',
            minWidth: '450px',
            padding: '2em',
            paddingBottom: '2em',
            overflow: 'scroll',
          }}
        >
          <Stack
            direction={'row'}
            alignItems={'center'}
            sx={{ marginBottom: '1em' }}
          >
            <Link to={`/dashboard/tasks/edit/${id}`} state={{ openTab: 1 }}>
              <IconButton color="primary" aria-label="back">
                <ArrowBack />
              </IconButton>
            </Link>
            <Typography
              align="center"
              variant="subtitle1"
              sx={{ width: '100%' }}
            >
              <Link to={`/dashboard/tickets/individual/${ticket.id}`}>
                {ticket.title}
              </Link>
            </Typography>
          </Stack>

          <TicketFields ticket={ticket} isCondensed={true} />
          <Divider />
          <Description ticket={ticket} />
          <Divider />
          <TicketProducts ticket={ticket} />
        </Card>
      )}
      <Stack sx={{ width: '100%' }}>
        <Routes>
          <Route
            path="product"
            element={<ProductAuthoring ticket={ticket} task={task as Task} />}
          />
          <Route
            path="product/:id/*"
            element={<ProductModelReadonly branch={task?.branchPath} />}
          />
        </Routes>
      </Stack>
    </Stack>
  );
}

export default TaskTicket;
