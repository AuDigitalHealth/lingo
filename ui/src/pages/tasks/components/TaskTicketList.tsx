import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import { TaskAssocation, Ticket } from '../../../types/tickets/ticket';
import { useEffect, useState } from 'react';
import useGetTicketsByAssociations from '../../../hooks/api/tickets/useGetTicketsByAssociations';
import { Add, Delete, Folder } from '@mui/icons-material';
import { Stack } from '@mui/system';
import useTaskById from '../../../hooks/useTaskById';
import TaskTicketAssociationModal from './TaskTicketAssociationModal';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal';
import { Link } from 'react-router-dom';
import useCanEditTask from '../../../hooks/useCanEditTask';
import UnableToEditTooltip from './UnableToEditTooltip';
import { getTaskAssociationsByTaskId } from '../../../hooks/useGetTaskAssociationsByTaskId';
import { useInitializeTaskAssociations } from '../../../hooks/api/useInitializeTickets';
import { useDeleteTaskAssociation } from '../../../hooks/api/tickets/useUpdateTicket';

function TaskTicketList() {
  const theme = useTheme();
  const task = useTaskById();
  const { taskAssociationsData } = useInitializeTaskAssociations();
  const deleteTaskAssociationMutation = useDeleteTaskAssociation();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [localTaskAssociations, setLocalTaskAssociations] = useState<
    TaskAssocation[]
  >([]);

  const [modalOpen, setModalOpen] = useState(false);
  const localTickets = useGetTicketsByAssociations(localTaskAssociations);

  const [deleteTicket, setDeleteTicket] = useState<Ticket>();
  const [deleteAssociation, setDeleteAssociation] = useState<TaskAssocation>();

  const { canEdit, lockDescription } = useCanEditTask();

  useEffect(() => {
    const tempTaskAssociations = getTaskAssociationsByTaskId(
      task?.key,
      taskAssociationsData,
    );
    setLocalTaskAssociations(tempTaskAssociations);
  }, [task, taskAssociationsData]);

  const handleToggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleDeleteAssociation = () => {
    if (deleteTicket === undefined || deleteAssociation === undefined) return;
    deleteTaskAssociationMutation.mutate({
      ticketId: deleteTicket.id,
      taskAssociationId: deleteAssociation.id,
    });
  };

  useEffect(() => {
    if (deleteTaskAssociationMutation.data) {
      setDeleteModalOpen(false);
    }
  }, [deleteTaskAssociationMutation.data]);

  return (
    <>
      <TaskTicketAssociationModal
        open={modalOpen}
        handleClose={handleToggleModal}
        task={task}
      />
      <ConfirmationModal
        open={deleteModalOpen}
        content={`Confirm delete for association ${deleteTicket?.title}`}
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
      <List aria-label="tickets">
        {localTaskAssociations.map(taskAssocation => {
          const ticket = localTickets.find(localTicket => {
            return localTicket.id === taskAssocation.ticketId;
          });
          if (ticket === undefined) return <></>;
          return (
            <>
              <ListItem disablePadding>
                <Link
                  to={`${ticket.id}`}
                  key={ticket.id}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <ListItemButton>
                    <ListItemIcon sx={{ minWidth: '56px' }}>
                      <Folder sx={{ color: `${theme.palette.grey[600]}` }} />
                    </ListItemIcon>

                    <ListItemText primary={`${ticket.title}`} />
                  </ListItemButton>
                </Link>
                <UnableToEditTooltip
                  canEdit={canEdit}
                  lockDescription={lockDescription}
                >
                  <IconButton
                    sx={{ marginLeft: 'auto' }}
                    color="error"
                    disabled={!canEdit}
                    onClick={() => {
                      setDeleteTicket(ticket);
                      setDeleteAssociation(taskAssocation);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Delete />
                  </IconButton>
                </UnableToEditTooltip>
              </ListItem>
            </>
          );
        })}
      </List>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <UnableToEditTooltip
          canEdit={canEdit}
          lockDescription={lockDescription}
        >
          <Button
            data-testid={'add-ticket-btn'}
            variant="contained"
            color="primary"
            size="small"
            onClick={handleToggleModal}
            startIcon={<Add />}
            disabled={!canEdit}
          >
            Add Ticket
          </Button>
        </UnableToEditTooltip>
      </Stack>
    </>
  );
}

export default TaskTicketList;
