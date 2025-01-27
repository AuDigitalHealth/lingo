import {
  Button,
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
import { Link } from 'react-router-dom';
import { truncate } from 'lodash';
import { useState } from 'react';
import BaseModal from '../../../../components/modal/BaseModal';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader';
import BaseModalBody from '../../../../components/modal/BaseModalBody';
import BaseModalFooter from '../../../../components/modal/BaseModalFooter';
import TicketAutocomplete from '../../../tasks/components/TicketAutocomplete';
import TicketsService from '../../../../api/TicketsService';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmationModal from '../../../../themes/overrides/ConfirmationModal';
import { StateItemDisplay } from '../../components/grid/CustomStateSelection';
import UnableToEditTicketTooltip from '../../components/UnableToEditTicketTooltip.tsx';
import {
  getTicketAssociationByTicketIdOptions,
  useTicketAssociationByTicketId,
} from '../../../../hooks/api/tickets/useTicketById.tsx';

interface TicketAssociationViewProps {
  ticket: Ticket | undefined;
}
function TicketAssociationView({ ticket }: TicketAssociationViewProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { data: associations } = useTicketAssociationByTicketId(ticket?.id);

  const sourceAssociations = associations?.filter(ass => {
    return ass.associationSource?.id === ticket?.id;
  });

  const targetAssociations = associations?.filter(ass => {
    return ass.associationTarget?.id === ticket?.id;
  });
  return (
    <>
      <TicketAssociationModal
        open={addModalOpen}
        toggleModal={() => setAddModalOpen(false)}
        ticket={ticket}
        ticketAssociations={associations}
      />
      <Stack direction="column" width="100%" marginTop="0.5em">
        <Stack
          direction="row"
          width="100%"
          justifyContent="space-between"
          alignItems="center"
        >
          <InputLabel sx={{ mt: 0.5 }}>Associated Tickets:</InputLabel>
          <UnableToEditTicketTooltip canEdit={true}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => setAddModalOpen(true)}
              startIcon={<Add />}
              disabled={false}
            >
              Add Association
            </Button>
          </UnableToEditTicketTooltip>
        </Stack>

        {sourceAssociations && sourceAssociations?.length > 0 && (
          <>
            <InputLabel sx={{ mt: 0.5 }}>Linked to:</InputLabel>

            <TicketAssociationList
              ticketId={ticket?.id}
              ticketAssociations={sourceAssociations}
              to={true}
            />
          </>
        )}
        {targetAssociations && targetAssociations.length > 0 && (
          <>
            <InputLabel sx={{ mt: 0.5 }}>Linked From:</InputLabel>
            <TicketAssociationList
              ticketId={ticket?.id}
              ticketAssociations={targetAssociations}
              to={false}
            />
          </>
        )}
      </Stack>
    </>
  );
}

interface TicketAssociationListProps {
  ticketId?: number;
  ticketAssociations: TicketAssociation[];
  to: boolean;
}

function TicketAssociationList({
  ticketId,
  ticketAssociations,
  to,
}: TicketAssociationListProps) {
  const queryClient = useQueryClient();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [associationToDelete, setAssociationToDelete] =
    useState<TicketAssociation | null>(null);

  const handleDeleteAssociation = () => {
    if (associationToDelete !== null) {
      void (async () => {
        await TicketsService.deleteTicketAssociation(associationToDelete.id);
        void queryClient.invalidateQueries({
          queryKey: getTicketAssociationByTicketIdOptions(ticketId).queryKey,
        });
        setDeleteModalOpen(false);
      })();
    }
  };
  return (
    <>
      <ConfirmationModal
        open={deleteModalOpen}
        content={`Delete the association from: "${truncate(
          associationToDelete?.associationSource?.title,
          { length: 50 },
        )}" to: ${truncate(associationToDelete?.associationTarget?.title, { length: 50 })}?`}
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
              <TableCell>Ticket Number</TableCell>
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
              const linkUrl = `/dashboard/tickets/backlog/individual/${thisAssociation.ticketNumber}`;

              const title = thisAssociation.title;
              return (
                <TableRow key={thisAssociation.id}>
                  <TableCell component="th" scope="row">
                    <Link to={linkUrl}>{thisAssociation.ticketNumber}</Link>
                  </TableCell>
                  <TableCell>
                    <Link to={linkUrl}>
                      {truncate(title, {
                        length: 100,
                      })}
                    </Link>
                  </TableCell>
                  <TableCell align="right">
                    {thisAssociation.state && (
                      <StateItemDisplay state={thisAssociation.state} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      color="error"
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
  ticketAssociations: TicketAssociation[] | undefined;
}
function TicketAssociationModal({
  open,
  toggleModal,
  ticket,
  ticketAssociations,
}: TicketAssociationModalProps) {
  const associatedIds = ticketAssociations
    ?.flatMap(ass => [ass.associationSource.id, ass.associationTarget.id])
    .filter(id => {
      return id != ticket?.id;
    });
  const queryClient = useQueryClient();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const handleSubmit = () => {
    if (selectedTicket && ticket) {
      void (async () => {
        await TicketsService.createTicketAssociation(
          ticket.id,
          selectedTicket.id,
        );
        void queryClient.invalidateQueries({
          queryKey: getTicketAssociationByTicketIdOptions(ticket?.id).queryKey,
        });
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
          disabledTooltipTitle="Ticket already associated to this ticket"
          isOptionDisabled={(option: Ticket) => {
            const includes = associatedIds?.includes(option.id);
            return includes ?? false;
          }}
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
