import {
  Box,
  Button, Grid,
  IconButton,
  InputLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import { StateItemDisplay } from '../../components/grid/CustomStateSelection';
import useCanEditTicket from "../../../../hooks/api/tickets/useCanEditTicket.tsx";
import UnableToEditTicketTooltip from "../../components/UnableToEditTicketTooltip.tsx";

function TicketAssociationView() {
  const { id } = useParams();
  const { ticket } = useTicketById(id);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [canEdit] = useCanEditTicket(ticket?.id.toString());

  return (
    <>
      <TicketAssociationModal
        open={addModalOpen}
        toggleModal={() => setAddModalOpen(false)}
        ticket={ticket}
      />
      <Stack direction="column" width="100%" marginTop="0.5em">
        <Stack direction="row" width="100%" justifyContent="space-between" alignItems="center">
          <InputLabel sx={{ mt: 0.5 }}>Associated Tickets:</InputLabel>
            <UnableToEditTicketTooltip canEdit={canEdit}>
              <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => setAddModalOpen(true)}
                  startIcon={<Add />}
                  disabled={!canEdit}
              >
                Add Association
              </Button>
            </UnableToEditTicketTooltip>
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
      <TableContainer
        component={Paper}
        sx={{ marginTop: '1em', marginBottom: '1em' }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Ticket Title</TableCell>
              <TableCell align="right" sx={{ width: '100px' }}>
                State
              </TableCell>
              <TableCell align="right" sx={{ width: '100px' }}>
                Delete
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ticketAssociations.map(association => {
              const thisAssociation = to
                ? association.associationTarget
                : association.associationSource;
              const linkUrl = `/dashboard/tickets/individual/${thisAssociation.id}`;

              const title = thisAssociation.title;
              return (
                <TableRow key={thisAssociation.id}>
                  <TableCell component="th" scope="row">
                    <Link to={linkUrl}>
                      {truncate(title, {
                        length: 100,
                      })}
                    </Link>
                  </TableCell>
                  <TableCell align="right">
                    <StateItemDisplay localState={thisAssociation.state} />
                  </TableCell>
                  <TableCell align="right">
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
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
