import { Stack } from '@mui/system';
import useTicketByState from '../../hooks/useTicketByState';
import { State } from '../../types/tickets/ticket';
import Droppable from './Droppable';
import { TicketCard } from './TicketCard';
import { useTheme } from '@mui/material/styles';
import { Typography } from '@mui/material';

interface TicketColumnProps {
  state: State;
}
function TicketColumn({ state }: TicketColumnProps) {
  const tickets = useTicketByState({ stateId: state.id });
  const theme = useTheme();

  return (
    <Stack
      gap={3}
      sx={{
        minHeight: '100%',
        minWidth: '300px',
        width: '300px',
        maxWidth: '300px',
        backgroundColor: theme.palette.grey[200],
      }}
    >
      <Droppable
        id={state.id}
        sx={{
          minHeight: '100%',
          minWidth: '300px',
          width: '300px',
          maxWidth: '300px',
          backgroundColor: theme.palette.grey[200],
        }}
      >
        <Typography variant="subtitle1" align="center">
          {state.label}
        </Typography>
        {tickets?.map(ticket => {
          return <TicketCard ticket={ticket} key={ticket.id} />;
        })}
      </Droppable>
    </Stack>
  );
}

export default TicketColumn;
