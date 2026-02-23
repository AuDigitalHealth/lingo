import { Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTicketAuthoringHistory } from '../../../hooks/api/products/useTicketAuthoringHistory';

interface TicketAuthoringHistoryDisplayProps {
  conceptId: string | undefined;
}

function TicketLinks({ ticketNumbers }: { ticketNumbers: string[] }) {
  if (ticketNumbers.length === 0) {
    return <Typography>None</Typography>;
  }

  return (
    <Typography>
      {ticketNumbers.map((ticketNumber, index) => (
        <span key={ticketNumber}>
          <Link to={`/dashboard/tickets/backlog/individual/${ticketNumber}`}>
            {ticketNumber}
          </Link>
          {index < ticketNumbers.length - 1 && ', '}
        </span>
      ))}
    </Typography>
  );
}

function TicketAuthoringHistoryDisplay({
  conceptId,
}: TicketAuthoringHistoryDisplayProps) {
  const { isLoading, ticketAuthoringHistory, isError } =
    useTicketAuthoringHistory(conceptId);

  if (!conceptId || isLoading || isError || !ticketAuthoringHistory) {
    return null;
  }

  const { creates, updates } = ticketAuthoringHistory;

  return (
    <>
      <Stack direction="row" spacing={2}>
        <Typography style={{ color: '#184E6B' }}>Authoring Tickets:</Typography>
        <TicketLinks ticketNumbers={creates} />
      </Stack>
      <Stack direction="row" spacing={2}>
        <Typography style={{ color: '#184E6B' }}>Update Tickets:</Typography>
        <TicketLinks ticketNumbers={updates} />
      </Stack>
    </>
  );
}

export default TicketAuthoringHistoryDisplay;
