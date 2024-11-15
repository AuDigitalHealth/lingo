import { Link } from 'react-router-dom';
import { TaskAssocationDto, Ticket } from '../../../../../types/tickets/ticket';
import { Button, IconButton, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import TaskAssociationModal from './TaskAssociationModal';
import { useEffect, useState } from 'react';
import ConfirmationModal from '../../../../../themes/overrides/ConfirmationModal';
import { Stack } from '@mui/system';
import UnableToEditTicketTooltip from '../../../components/UnableToEditTicketTooltip.tsx';
import { useCanEditTicket } from '../../../../../hooks/api/tickets/useCanEditTicket.tsx';
import { useDeleteTaskAssociation } from '../../../../../hooks/api/tickets/useUpdateTicket.tsx';
import { isTaskCurrent } from '../../../components/grid/helpers/isTaskCurrent.ts';
import { useAllTasks } from '../../../../../hooks/api/useAllTasks.tsx';
import { TaskTypographyTemplate } from '../../../components/grid/Templates.tsx';
import { useAllTaskAssociations } from '../../../../../hooks/api/useInitializeTickets.tsx';

interface TaskAssociationFieldInputProps {
  ticket: Ticket | undefined;
}
export default function TaskAssociationFieldInput({
  ticket,
}: TaskAssociationFieldInputProps) {
  const [taskAssociationModalOpen, setTaskAssociationModalOpen] =
    useState(false);
  const { taskAssociationsData } = useAllTaskAssociations();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const deleteTaskAssociationMutation = useDeleteTaskAssociation();
  const { allTasks } = useAllTasks();
  const isCurrent = isTaskCurrent(ticket, allTasks);
  const [taskAssociation, setTaskAssociation] = useState<
    TaskAssocationDto | null | undefined
  >(ticket?.taskAssociation);

  useEffect(() => {
    const thisTicketsTask = taskAssociationsData?.filter(taskAssociation => {
      return taskAssociation.ticketId === ticket?.id;
    });
    if (thisTicketsTask?.length === 1) {
      setTaskAssociation(thisTicketsTask[0]);
    }
  }, [taskAssociationsData, ticket]);

  const handleDeleteAssociation = () => {
    if (ticket === undefined || ticket?.taskAssociation?.id === undefined)
      return;

    deleteTaskAssociationMutation.mutate({
      ticket: ticket,
      taskAssociationId: ticket?.taskAssociation?.id,
    });
  };

  useEffect(() => {
    if (deleteTaskAssociationMutation.data) {
      setDeleteModalOpen(false);
    }
  }, [deleteTaskAssociationMutation.data]);

  const { canEdit } = useCanEditTicket(ticket);
  return (
    <>
      <Stack flexDirection="row" alignItems={'center'}>
        <Typography
          variant="caption"
          fontWeight="bold"
          sx={{ display: 'block', width: '150px' }}
        >
          Task:
        </Typography>
        {taskAssociation ? (
          <>
            {isCurrent ? (
              <Link
                to={`/dashboard/tasks/edit/${taskAssociation.taskId}/${ticket?.ticketNumber}`}
              >
                {taskAssociation.taskId}
              </Link>
            ) : (
              <TaskTypographyTemplate taskKey={taskAssociation.taskId} />
            )}
            <IconButton
              size="small"
              aria-label="delete"
              color="error"
              sx={{ mt: 0.25, marginLeft: '5px' }}
              onClick={() => {
                setDeleteModalOpen(true);
              }}
            >
              <Delete />
            </IconButton>
            <ConfirmationModal
              open={deleteModalOpen}
              content={`This will remove the ticket's association with the task (${taskAssociation.taskId}), but will not rollback any authoring changes in the task.`}
              handleClose={() => {
                setDeleteModalOpen(false);
              }}
              title={'Confirm Delete'}
              disabled={false}
              action={'Delete'}
              handleAction={() => {
                void handleDeleteAssociation();
              }}
            />
          </>
        ) : (
          <>
            <TaskAssociationModal
              open={taskAssociationModalOpen}
              ticket={ticket}
              handleClose={() => setTaskAssociationModalOpen(false)}
            />
            <UnableToEditTicketTooltip canEdit={canEdit}>
              <Button
                onClick={() => setTaskAssociationModalOpen(true)}
                color="success"
                variant="contained"
                size="small"
                disabled={!canEdit}
              >
                Add Task
              </Button>
            </UnableToEditTicketTooltip>
          </>
        )}
      </Stack>
    </>
  );
}
