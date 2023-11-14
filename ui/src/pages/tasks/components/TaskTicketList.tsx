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
import useTicketStore from '../../../stores/TicketStore';
import { TaskAssocation, Ticket } from '../../../types/tickets/ticket';
import { useEffect, useState } from 'react';
import useGetTicketsByAssociations from '../../../hooks/useGetTicketsByAssociations';
import { Add, Delete, Folder } from '@mui/icons-material';
import { Stack } from '@mui/system';
import useTaskById from '../../../hooks/useTaskById';
import TaskTicketAssociationModal from './TaskTicketAssociationModal';
import TicketsService from '../../../api/TicketsService';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal';
import { Link } from 'react-router-dom';

function TaskTicketList() {
  const theme = useTheme();
  const task = useTaskById();
  const {
    getTaskAssociationsByTaskId,
    taskAssociations,
    deleteTaskAssociation,
  } = useTicketStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [localTaskAssociations, setLocalTaskAssociations] = useState<
    TaskAssocation[]
  >([]);

  const [modalOpen, setModalOpen] = useState(false);
  const localTickets = useGetTicketsByAssociations(localTaskAssociations);

  const [deleteTicket, setDeleteTicket] = useState<Ticket>();
  const [deleteAssociation, setDeleteAssociation] = useState<TaskAssocation>();

  useEffect(() => {
    const tempTaskAssociations = getTaskAssociationsByTaskId(task?.key);
    setLocalTaskAssociations(tempTaskAssociations);
  }, [task, taskAssociations, getTaskAssociationsByTaskId]);

  const handleToggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleDeleteAssociation = async () => {
    if (deleteTicket === undefined || deleteAssociation === undefined) return;

    const responseStatus = await TicketsService.deleteTaskAssociation(
      deleteTicket.id,
      deleteAssociation.id,
    );

    if (responseStatus === 204) {
      deleteTaskAssociation(deleteAssociation.id);
      setDeleteModalOpen(false);
    }
  };

  return (
    <>
      <TaskTicketAssociationModal
        open={modalOpen}
        handleClose={handleToggleModal}
        task={task}
        existingAssociatedTickets={localTickets}
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
                <IconButton
                  sx={{ marginLeft: 'auto' }}
                  color="error"
                  onClick={() => {
                    setDeleteTicket(ticket);
                    setDeleteAssociation(taskAssocation);
                    setDeleteModalOpen(true);
                  }}
                >
                  <Delete />
                </IconButton>
              </ListItem>
            </>
          );
        })}
      </List>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={handleToggleModal}
          startIcon={<Add />}
        >
          Add Ticket
        </Button>
      </Stack>
    </>
  );
}

export default TaskTicketList;
