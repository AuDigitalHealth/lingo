import { useState } from 'react';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import { Ticket } from '../../../types/tickets/ticket';
import TicketAutocomplete from './TicketAutocomplete';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import { Button } from '@mui/material';
import { Task } from '../../../types/task';
import TicketsService from '../../../api/TicketsService';
import useTicketStore from '../../../stores/TicketStore';

interface TaskTicketAssociationModal {
  open: boolean;
  handleClose: () => void;
  task: Task | null | undefined;
  existingAssociatedTickets: Ticket[];
}
export default function TaskTicketAssociationModal({
  open,
  handleClose,
  task,
  existingAssociatedTickets,
}: TaskTicketAssociationModal) {
  const { addTaskAssociations } = useTicketStore();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const handleSelectedTicketChange = (ticket: Ticket | null) => {
    setSelectedTicket(ticket);
  };

  const handleSubmit = () => {
    if (selectedTicket && task) {
      void (async () => {
        const newTaskAssociation = await TicketsService.createTaskAssociation(
          selectedTicket.id,
          task.key,
        );
        newTaskAssociation.ticketId = selectedTicket.id;
        addTaskAssociations([newTaskAssociation]);
        handleClose();
      })();
    }
  };
  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title="Add Ticket Association" />
      <BaseModalBody>
        <TicketAutocomplete
          handleChange={handleSelectedTicketChange}
          existingAssociatedTickets={existingAssociatedTickets}
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
