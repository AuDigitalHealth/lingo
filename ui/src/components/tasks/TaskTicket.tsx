import { Button, ButtonGroup, Card, Divider, Typography } from '@mui/material';
import { Ticket } from '../../stores/TicketStore';

interface TaskTicketProps {
  ticket: Ticket;
}

function TaskTicket({ ticket }: TaskTicketProps) {
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
      <Typography align="center" variant="subtitle1" gutterBottom>
        {ticket.name}
      </Typography>
      <Divider />
      <ButtonGroup sx={{ marginTop: 'auto' }} orientation="vertical">
        <Button>Create new Product from blank template</Button>
        <Button>Create new product from pre-populated data</Button>
        <Button>Create new product using existing product</Button>
        <Button>Edit an existing product</Button>
        <Button>Edit multiple products</Button>
      </ButtonGroup>
    </Card>
  );
}

export default TaskTicket;
