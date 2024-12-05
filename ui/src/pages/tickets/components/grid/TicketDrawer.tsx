import { Drawer, IconButton } from '@mui/material';
import IndividualTicketEdit from '../../individual/IndividualTicketEdit';
import { Box, styled } from '@mui/system';
import { Close, Delete } from '@mui/icons-material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDeleteTicket } from '../../../../hooks/api/tickets/useUpdateTicket';
import { useTicketByTicketNumber } from '../../../../hooks/api/tickets/useTicketById';
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

export interface TicketDrawerProps {
  onDelete?: () => void;
}

export default function TicketDrawer({ onDelete }: TicketDrawerProps) {
  const { ticketNumber } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { deleteTicket } = useTicketStore();

  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] =
    useState(false);

  const ticket = useTicketByTicketNumber(ticketNumber, true);
  const ticketDeleteMutation = useDeleteTicket();

  const handleDeleteTicket = (ticket: Ticket) => {
    ticketDeleteMutation.mutate(ticket, {
      onSuccess: () => {
        deleteTicket(ticket.id);
        setDeleteConfirmationModalOpen(false);
        if (onDelete) {
          onDelete();
        } else {
          navigateBack();
        }
      },
    });
  };

  const navigateBack = () => {
    const currentPath = pathname;

    // Remove '/individual/:ticketId' from the path
    const newPath = currentPath.split('/').slice(0, -2).join('/');

    // Navigate to the new path
    navigate(newPath);
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={true}
        onClose={() => navigateBack()}
        disableEnforceFocus
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
            <IconButton onClick={() => navigateBack()}>
              <Close />
            </IconButton>
          </Box>
          <IndividualTicketEdit ticketNumber={ticketNumber} />
        </Box>
      </Drawer>
    </>
  );
}
