import { Drawer, IconButton } from '@mui/material';
import IndividualTicketEdit from '../../individual/IndividualTicketEdit';
import { Box, styled } from '@mui/system';
import { Close, Delete } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeleteTicket } from '../../../../hooks/api/tickets/useUpdateTicket';
import { useTicketById } from '../../../../hooks/api/tickets/useTicketById';
import { Ticket } from '../../../../types/tickets/ticket';
import { useState } from 'react';
import WarningModal from '../../../../themes/overrides/WarningModal';
import useTicketStore from '../../../../stores/TicketStore';

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
  const { ticketNumber } = useParams();
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteTicket } = useTicketStore();

  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] =
    useState(false);

  const ticket = useTicketById(ticketNumber ? ticketNumber : id, true, true);
  const ticketDeleteMutation = useDeleteTicket();

  const handleDeleteTicket = (ticket: Ticket) => {
    ticketDeleteMutation.mutate(ticket, {
      onSuccess: () => {
        deleteTicket(ticket.id);
        setDeleteConfirmationModalOpen(false);
        navigate('/dashboard/tickets/backlog');
      },
    });
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={true}
        onClose={() => navigate('/dashboard/tickets/backlog')}
      >
        <Box display={'flex'} flexDirection={'column'}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: 1 }}>
            {ticket.data && (
              <>
                <WarningModal
                  open={deleteConfirmationModalOpen}
                  handleClose={
                    ticketDeleteMutation.isPending
                      ? undefined
                      : () => setDeleteConfirmationModalOpen(false)
                  }
                  content={`Confirm delete for ${ticket.data.title}? This action cannot be undone.`}
                  handleAction={() => {
                    handleDeleteTicket(ticket.data);
                  }}
                  action="Delete Ticket"
                  reverseAction="Return To Screen"
                />
                <IconButton
                  onClick={() => {
                    setDeleteConfirmationModalOpen(true);
                  }}
                >
                  <Delete />
                </IconButton>
              </>
            )}
            <IconButton onClick={() => navigate('/dashboard/tickets/backlog')}>
              <Close />
            </IconButton>
          </Box>
          <IndividualTicketEdit ticketNumber={ticketNumber} />
        </Box>
      </Drawer>
    </>
  );
}
