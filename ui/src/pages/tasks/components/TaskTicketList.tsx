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
// import {FolderOpenIcon, Folder} from '@mui/icons-material';
import useTicketStore from '../../../stores/TicketStore';
import { TaskAssocation, Ticket } from '../../../types/tickets/ticket';
import { useEffect, useState } from 'react';
import useGetTicketsByAssociations from '../../../hooks/useGetTicketsByAssociations';
import { Add, Delete, Folder, FolderOpen } from '@mui/icons-material';
import { Stack } from '@mui/system';
import useTaskById from '../../../hooks/useTaskById';
import TaskTicketAssociationModal from './TaskTicketAssociationModal';
import TicketsService from '../../../api/TicketsService';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal';

function TaskTicketList() {
  const theme = useTheme();
  const task = useTaskById();
  const {
    activeTicket,
    setActiveTicket,
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
  }, [task, taskAssociations]);

  const handleTicketChange = (ticket: Ticket) => {
    if (activeTicket && activeTicket.title === ticket.title) {
      setActiveTicket(null);
      return;
    }
    const newActiveTicket = localTickets.filter(individualTicket => {
      return ticket.id === individualTicket.id;
    });

    setActiveTicket(newActiveTicket[0]);
  };

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
      setActiveTicket(null);
    }
  };
  console.log('this tickets task associations');
  console.log(localTaskAssociations);
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

          const isActiveTicket =
            activeTicket !== null && activeTicket.id === ticket?.id;

          if (ticket === undefined) return <></>;
          return (
            <>
              <ListItem disablePadding key={ticket.id}>
                <ListItemButton
                  onClick={() => {
                    handleTicketChange(ticket);
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '56px' }}>
                    {isActiveTicket ? (
                      <FolderOpen
                        sx={{ color: `${theme.palette.grey[800]}` }}
                      />
                    ) : (
                      <Folder sx={{ color: `${theme.palette.grey[600]}` }} />
                    )}
                  </ListItemIcon>

                  {isActiveTicket ? (
                    <ListItemText primary={`${ticket.title}`} />
                  ) : (
                    <ListItemText primary={`${ticket.title}`} />
                  )}
                </ListItemButton>
                <IconButton
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
