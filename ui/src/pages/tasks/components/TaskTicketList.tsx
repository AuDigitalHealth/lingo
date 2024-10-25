import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import { TaskAssocation, Ticket } from '../../../types/tickets/ticket';
import React, { useEffect, useState } from 'react';
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
import { useAllTaskAssociations } from '../../../hooks/api/useInitializeTickets';
import { useDeleteTaskAssociation } from '../../../hooks/api/tickets/useUpdateTicket';
import { useTicketByTicketNumber } from '../../../hooks/api/tickets/useTicketById.tsx';
import Loading from '../../../components/Loading.tsx';

function TaskTicketList() {
  const task = useTaskById();
  const { taskAssociationsData } = useAllTaskAssociations();
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
      ticket: deleteTicket,
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
          if (ticket === undefined)
            return (
              <React.Fragment key={taskAssocation.ticketId}></React.Fragment>
            );
          return (
            <TaskTicketPage
              key={taskAssocation.ticketId}
              ticket={ticket}
              taskAssocation={taskAssocation}
              setDeleteTicket={setDeleteTicket}
              lockDescription={lockDescription}
              canEdit={canEdit}
              setDeleteAssociation={setDeleteAssociation}
              setDeleteModalOpen={setDeleteModalOpen}
            />
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
interface TaskTicketPageProps {
  ticket: Ticket;
  taskAssocation: TaskAssocation;
  canEdit: boolean;
  lockDescription: string;
  setDeleteTicket: (value: Ticket) => void;
  setDeleteAssociation: (value: TaskAssocation) => void;
  setDeleteModalOpen: (value: boolean) => void;
}
function TaskTicketPage({
  ticket,
  taskAssocation,
  canEdit,
  lockDescription,
  setDeleteTicket,
  setDeleteAssociation,
  setDeleteModalOpen,
}: TaskTicketPageProps) {
  const useTicketQuery = useTicketByTicketNumber(ticket.ticketNumber, true);
  const theme = useTheme();
  if (useTicketQuery.data) {
    return (
      <ListItem
        disablePadding
        key={useTicketQuery.data.id}
        sx={{ width: '100%', display: 'flex', flexDirection: 'row' }}
      >
        <ListItem>
          <Link
            to={`${useTicketQuery.data.ticketNumber}`}
            key={useTicketQuery.data.ticketNumber}
            style={{ textDecoration: 'none' }}
          >
            <ListItemIcon sx={{ minWidth: '56px' }}>
              <IconButton>
                <Folder sx={{ color: `${theme.palette.grey[600]}` }} />
              </IconButton>
            </ListItemIcon>
          </Link>
          {/* Ticket number and title stacked */}
          <ListItemText
            primary={
              <>
                {/* Ticket Number */}
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ userSelect: 'text' }}
                >
                  {useTicketQuery.data.ticketNumber}
                </Typography>
                {/* Title */}
                <Typography variant="body1">
                  {useTicketQuery.data.title}
                </Typography>
                {/*Highlight tickets under review that have no products (status: completed) and no bulk products.*/}
                {useTicketQuery.data.state?.label === 'Review' &&
                  useTicketQuery.data.products?.every(p => !p.conceptId) &&
                  useTicketQuery.data.bulkProductActions?.length === 0 && (
                    <Typography variant="body2" color="orange">
                      Missing saved product data
                    </Typography>
                  )}
              </>
            }
          />
        </ListItem>

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
    );
  } else {
    return <Loading />;
  }
}

export default TaskTicketList;
