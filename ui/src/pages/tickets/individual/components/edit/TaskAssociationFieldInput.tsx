import { Link } from 'react-router-dom';
import { Ticket } from '../../../../../types/tickets/ticket';
import { Button, IconButton, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import TaskAssociationModal from './TaskAssociationModal';
import { useState } from 'react';
import ConfirmationModal from '../../../../../themes/overrides/ConfirmationModal';
import { Stack } from '@mui/system';
import TicketsService from '../../../../../api/TicketsService';
import useTicketStore from '../../../../../stores/TicketStore';

interface TaskAssociationFieldInputProps {
  ticket: Ticket | undefined;
}
export default function TaskAssociationFieldInput({
  ticket,
}: TaskAssociationFieldInputProps) {
  const [taskAssociationModalOpen, setTaskAssociationModalOpen] =
    useState(false);
  const { mergeTickets } = useTicketStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleDeleteAssociation = async () => {
    if (ticket === undefined || ticket?.taskAssociation?.id === undefined)
      return;

    const responseStatus = await TicketsService.deleteTaskAssociation(
      ticket.id,
      ticket?.taskAssociation?.id,
    );

    if (responseStatus === 204) {
      ticket.taskAssociation = null;
      mergeTickets(ticket);
      setDeleteModalOpen(false);
    }
  };
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
        {ticket?.taskAssociation ? (
          <>
            <Link
              to={`/dashboard/tasks/edit/${ticket?.taskAssociation.taskId}/${ticket.id}`}
            >
              {ticket?.taskAssociation.taskId}
            </Link>
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
              content={`This will remove the ticket's association with the task (${ticket?.taskAssociation?.taskId}), but will not rollback any authoring changes in the task.`}
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
            <Button
              onClick={() => setTaskAssociationModalOpen(true)}
              color="success"
              variant="contained"
              size="small"
            >
              Add Task
            </Button>
          </>
        )}
      </Stack>
    </>
  );
}
