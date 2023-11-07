import {
  Button,
  ButtonGroup,
  Card,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Ticket } from '../../../types/tickets/ticket';
import { Link } from 'react-router-dom';
import Description from '../../tickets/Description';
import TicketFields from '../../tickets/individual/components/TicketFields';
import { ArrowBack } from '@mui/icons-material';

interface TaskTicketProps {
  ticket: Ticket;
  onBack: () => void;
  onProductAuthoringOpen: () => void;
}

function TaskTicket({
  ticket,
  onBack,
  onProductAuthoringOpen,
}: TaskTicketProps) {
  // These all need to be tied to actions - ? Whatever these actions look like, I really have no idea at the moment.
  // For now, we just have buttons
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '450px',
        padding: '2em',
        paddingBottom: '2em',
      }}
    >
      <Stack
        direction={'row'}
        alignItems={'center'}
        sx={{ marginBottom: '1em' }}
      >
        <IconButton color="primary" aria-label="back" onClick={onBack}>
          <ArrowBack />
        </IconButton>
        <Typography align="center" variant="subtitle1" sx={{ width: '100%' }}>
          <Link to={`/dashboard/tickets/individual/${ticket.id}`}>
            {ticket.title}
          </Link>
        </Typography>
      </Stack>

      <TicketFields ticket={ticket} isCondensed={true} />
      <Divider />
      <Description ticket={ticket} />
      <ButtonGroup sx={{ marginTop: 'auto' }} orientation="vertical">
        <Button onClick={onProductAuthoringOpen}>
          Create new Product from blank template
        </Button>
        {/* <Button>Create new product from pre-populated data</Button>
        <Button>Create new product using existing product</Button>
        <Button>Edit an existing product</Button>
        <Button>Edit multiple products</Button> */}
      </ButtonGroup>
    </Card>
  );
}

export default TaskTicket;
