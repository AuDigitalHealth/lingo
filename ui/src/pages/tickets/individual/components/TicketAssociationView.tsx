import {
  Button,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Stack,
  useTheme,
} from '@mui/material';
import { Ticket, TicketAssociation } from '../../../../types/tickets/ticket';
import { Add, Delete } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import { truncate } from 'lodash';
import { useState } from 'react';
import BaseModal from '../../../../components/modal/BaseModal';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader';
import BaseModalBody from '../../../../components/modal/BaseModalBody';
import BaseModalFooter from '../../../../components/modal/BaseModalFooter';
import TicketAutocomplete from '../../../tasks/components/TicketAutocomplete';
import TicketsService from '../../../../api/TicketsService';
import useTicketById from '../../../../hooks/useTicketById';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmationModal from '../../../../themes/overrides/ConfirmationModal';

function TicketAssociationView() {
  const { id } = useParams();
  const { ticket, isLoading } = useTicketById(id);
  const theme = useTheme();
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <>
      <TicketAssociationModal
        open={addModalOpen}
        toggleModal={() => setAddModalOpen(false)}
        ticket={ticket}
      />
      <Stack direction="column" width="100%" marginTop="0.5em">
        <Stack direction="row">
          <InputLabel sx={{ mt: 0.5 }}>Associated Tickets:</InputLabel>
          <Button
            sx={{ marginLeft: 'auto' }}
            variant="contained"
            color="primary"
            size="small"
            onClick={() => setAddModalOpen(true)}
            startIcon={<Add />}
            disabled={false}
          >
            Add Association
          </Button>
        </Stack>

        {ticket?.ticketSourceAssociations &&
          ticket?.ticketSourceAssociations?.length > 0 && (
            <>
              <InputLabel sx={{ mt: 0.5 }}>Linked to:</InputLabel>

              <TicketAssociationList
                ticketAssociations={ticket?.ticketSourceAssociations}
                to={true}
              />
            </>
          )}
        {ticket?.ticketTargetAssociations &&
          ticket?.ticketTargetAssociations?.length > 0 && (
            <>
              <InputLabel sx={{ mt: 0.5 }}>Linked From:</InputLabel>
              <TicketAssociationList
                ticketAssociations={ticket?.ticketTargetAssociations}
                to={false}
              />
            </>
          )}
      </Stack>
    </>
  );
}

interface TicketAssociationListProps {
  ticketAssociations: TicketAssociation[];
  to: boolean;
}

function TicketAssociationList({
  ticketAssociations,
  to,
}: TicketAssociationListProps) {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [associationToDelete, setAssociationToDelete] =
    useState<TicketAssociation | null>(null);

  const handleDeleteAssociation = () => {
    if (associationToDelete !== null) {
      void (async () => {
        await TicketsService.deleteTicketAssociation(associationToDelete.id);
        void queryClient.refetchQueries(['ticket', id]);
        setDeleteModalOpen(false);
      })();
    }
  };
  return (
    <>
      <ConfirmationModal
        open={deleteModalOpen}
        content={`Delete the association from: "${truncate(
          associationToDelete?.associationSource.title,
          { length: 50 },
        )}" to: ${truncate(associationToDelete?.associationTarget.title, { length: 50 })}?`}
        handleClose={() => {
          setDeleteModalOpen(false);
        }}
        title={'Confirm Delete Association'}
        disabled={false}
        action={'Delete'}
        handleAction={handleDeleteAssociation}
      />
      <List>
        {ticketAssociations.map(association => {
          const linkUrl = to
            ? `/dashboard/tickets/individual/${association.associationTarget.id}`
            : `/dashboard/tickets/individual/${association.associationSource.id}`;
          const title = to
            ? association.associationTarget.title
            : association.associationSource.title;
          return (
            <ListItem disablePadding>
              <Link to={linkUrl}>
                <ListItemText
                  primary={truncate(title, {
                    length: 100,
                  })}
                />
              </Link>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => {
                  setDeleteModalOpen(true);
                  setAssociationToDelete(association);
                }}
              >
                <Delete />
              </IconButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );
}

interface TicketAssociationModalProps {
  open: boolean;
  toggleModal: () => void;
  ticket?: Ticket;
}
function TicketAssociationModal({
  open,
  toggleModal,
  ticket,
}: TicketAssociationModalProps) {
  const queryClient = useQueryClient();
  const { id } = useParams();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const handleSubmit = () => {
    if (selectedTicket && ticket) {
      void (async () => {
        await TicketsService.createTicketAssociation(
          ticket.id,
          selectedTicket.id,
          {
            description: 'Bla bla',
          },
        );
        void queryClient.refetchQueries(['ticket', id]);
        toggleModal();
      })();
    }
  };

  const handleSelectedTicketChange = (ticket: Ticket | null) => {
    setSelectedTicket(ticket);
  };
  return (
    <BaseModal open={open} handleClose={toggleModal}>
      <BaseModalHeader title="Add Ticket Association" />
      <BaseModalBody>
        <TicketAutocomplete
          handleChange={handleSelectedTicketChange}
          defaultConditions={[
            {
              key: 'ticketassociation',
              operation: '!=',
              condition: 'and',
              value: ticket?.id ? ticket.id.toString() : '',
            },
          ]}
        />
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button
            color="primary"
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedTicket}
          >
            Add Association
          </Button>
        }
      />
    </BaseModal>
  );
}

export default TicketAssociationView;
