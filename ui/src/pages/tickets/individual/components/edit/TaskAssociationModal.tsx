import { useState } from 'react';
import { Ticket } from '../../../../../types/tickets/ticket';
import useTicketStore from '../../../../../stores/TicketStore';
import TicketsService from '../../../../../api/TicketsService';
import BaseModal from '../../../../../components/modal/BaseModal';
import BaseModalHeader from '../../../../../components/modal/BaseModalHeader';
import BaseModalBody from '../../../../../components/modal/BaseModalBody';
import BaseModalFooter from '../../../../../components/modal/BaseModalFooter';
import { Button } from '@mui/material';
import { Task } from '../../../../../types/task';
import TaskAutoComplete from './TaskAutoComplete';

interface TaskAssociationModalProps {
  open: boolean;
  handleClose: () => void;
  ticket: Ticket | undefined;
}
export default function TaskAssociationModal({
  open,
  handleClose,
  ticket,
}: TaskAssociationModalProps) {
  const { addTaskAssociations, mergeTickets } = useTicketStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const handleSelectedTaskChange = (task: Task | null) => {
    setSelectedTask(task);
  };

  const handleSubmit = () => {
    if (selectedTask && ticket) {
      void (async () => {
        const newTaskAssociation = await TicketsService.createTaskAssociation(
          ticket.id,
          selectedTask.key,
        );
        newTaskAssociation.ticketId = ticket.id;
        addTaskAssociations([newTaskAssociation]);
        ticket.taskAssociation = newTaskAssociation;
        mergeTickets(ticket);
        handleClose();
      })();
    }
  };
  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title="Add Task Association" />
      <BaseModalBody>
        <TaskAutoComplete handleChange={handleSelectedTaskChange} />
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button
            color="primary"
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedTask}
          >
            Add Association
          </Button>
        }
      />
    </BaseModal>
  );
}
