import { useEffect, useState } from 'react';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import { Ticket } from '../../../types/tickets/ticket';
import TicketAutocomplete from './TicketAutocomplete';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import { Button } from '@mui/material';
import { Task } from '../../../types/task';
import { useUpdateTaskAssociation } from '../../../hooks/api/tickets/useUpdateTicket';

interface TaskTicketAssociationModal {
  open: boolean;
  handleClose: () => void;
  task: Task | null | undefined;
}
export default function TaskTicketAssociationModal({
  open,
  handleClose,
  task,
}: TaskTicketAssociationModal) {
  const updateTaskAssociationMutation = useUpdateTaskAssociation();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const handleSelectedTicketChange = (ticket: Ticket | null) => {
    setSelectedTicket(ticket);
  };

  const handleSubmit = () => {
    if (selectedTicket && task) {
      updateTaskAssociationMutation.mutate({
        ticketId: selectedTicket.id,
        taskKey: task.key,
      });
    }
  };

  useEffect(() => {
    if (updateTaskAssociationMutation.data) {
      handleClose();
    }
    // eslint-disable-next-line
  }, [updateTaskAssociationMutation.data]);
  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title="Add Ticket Association" />
      <BaseModalBody>
        <TicketAutocomplete
          disabledTooltipTitle="Ticket already has a task association"
          isOptionDisabled={(option: Ticket) => option.taskAssociation !== null}
          handleChange={handleSelectedTicketChange}
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
            data-testid={'add-ticket-association-btn'}
          >
            Add Association
          </Button>
        }
      />
    </BaseModal>
  );
}
