import { TicketDto } from '../../../../types/tickets/ticket';
import { Drawer, IconButton } from '@mui/material';
import IndividualTicketEdit from '../../individual/IndividualTicketEdit';
import { Box, styled } from '@mui/system';
import { Close } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTicketById } from '../../../../hooks/useTicketById';

export const StyledFakeLink = styled('a')({
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  alignItems: 'center',
  transition: 'color 0.5s, text-decoration 0.5s',
  '&:hover': {
    textDecoration: 'underline',
    color: 'blue',
    cursor: 'pointer',
  },
});

export default function TicketDrawer() {
  const { ticketId } = useParams();
  const ticketIdAsNumber = parseInt(ticketId as string);
  // const [drawerOpen, setDrawerOpen] = useState(true);
  const navigate = useNavigate();
  console.log(ticketId);
  return (
    <>
      <Drawer
        anchor="right"
        open={true}
        onClose={() => navigate('/dashboard/tickets/backlog')}
      >
        <Box display={'flex'} flexDirection={'column'}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: 1 }}>
            <IconButton onClick={() => navigate('/dashboard/tickets/backlog')}>
              <Close />
            </IconButton>
          </Box>
          <IndividualTicketEdit ticketId={ticketIdAsNumber} />
        </Box>
      </Drawer>
    </>
  );
}
