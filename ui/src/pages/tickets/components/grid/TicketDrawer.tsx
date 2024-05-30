import { useState } from 'react';
import { TicketDto } from '../../../../types/tickets/ticket';
import { Drawer, IconButton } from '@mui/material';
import IndividualTicketEdit from '../../individual/IndividualTicketEdit';
import { Box, styled } from '@mui/system';
import { Close } from '@mui/icons-material';

interface TicketDrawerProps {
  ticket: TicketDto;
}

export const StyledFakeLink = styled('a')({
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  alignItems: 'center',
  transition: 'color 1s, text-decoration 1s',
  '&:hover': {
    textDecoration: 'underline',
    color: 'blue',
    cursor: 'pointer',
  },
});

export default function TicketDrawer({ ticket }: TicketDrawerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <StyledFakeLink onClick={() => setDrawerOpen(true)}>
        {ticket.title}
      </StyledFakeLink>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box display={'flex'} flexDirection={'column'}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: 1 }}>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <IndividualTicketEdit ticketId={ticket.id} />
        </Box>
      </Drawer>
    </>
  );
}
