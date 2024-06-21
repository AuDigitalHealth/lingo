import { useEffect, useState } from 'react';
import { Ticket } from '../../../../../types/tickets/ticket';
import BaseModal from '../../../../../components/modal/BaseModal';
import BaseModalHeader from '../../../../../components/modal/BaseModalHeader';
import BaseModalBody from '../../../../../components/modal/BaseModalBody';
import BaseModalFooter from '../../../../../components/modal/BaseModalFooter';
import { Task } from '../../../../../types/task';
import TaskAutoComplete from './TaskAutoComplete';
import { useUpdateTaskAssociation } from '../../../../../hooks/api/tickets/useUpdateTicket';
import LoadingButton from '../../../../../components/@extended/LoadingButton';

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
  const useUpdateTaskAssociationMutation = useUpdateTaskAssociation();
  // const { addTaskAssociations, mergeTicket: mergeTickets } = useTicketStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const handleSelectedTaskChange = (task: Task | null) => {
    setSelectedTask(task);
  };

  const handleSubmit = () => {
    if (selectedTask && ticket) {
      useUpdateTaskAssociationMutation.mutate({
        ticketId: ticket.id,
        taskKey: selectedTask.key,
      });
    }
  };

  useEffect(() => {
    if (useUpdateTaskAssociationMutation.data) {
      handleClose();
    }
  }, [useUpdateTaskAssociationMutation.data]);

  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title="Add Task Association" />
      <BaseModalBody>
        <TaskAutoComplete handleChange={handleSelectedTaskChange} />
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <LoadingButton
            color="primary"
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedTask}
            loading={useUpdateTaskAssociationMutation.isPending}
          >
            Add Association
          </LoadingButton>
        }
      />
    </BaseModal>
  );
}
