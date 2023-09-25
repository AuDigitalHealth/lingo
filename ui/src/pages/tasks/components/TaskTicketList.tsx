import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
// import {FolderOpenIcon, Folder} from '@mui/icons-material';
import useTicketStore from '../../../stores/TicketStore';
import { TaskAssocation, Ticket } from '../../../types/tickets/ticket';
import { Task } from '../../../types/task';
import { useEffect, useState } from 'react';
import useGetTicketsByAssociations from '../../../hooks/useGetTicketsByAssociations';
import { Folder, FolderOpen } from '@mui/icons-material';

interface TaskTicketListProps {
  task: Task | null | undefined;
}
function TaskTicketList({ task }: TaskTicketListProps) {
  const { activeTicket, setActiveTicket, getTaskAssociationsByTaskId } =
    useTicketStore();

  const [taskAssociations, setTaskAssociations] = useState<TaskAssocation[]>(
    [],
  );
  const localTickets = useGetTicketsByAssociations(taskAssociations);
  useEffect(() => {
    const tempTaskAssociations = getTaskAssociationsByTaskId(task?.key);
    setTaskAssociations(tempTaskAssociations);
  }, [task]);

  const handleTicketChange = (ticket: Ticket) => {
    if (activeTicket && activeTicket.title === ticket.title) {
      setActiveTicket(null);
      return;
    }
    const newActiveTicket = localTickets.filter(individualTicket => {
      return ticket.title === individualTicket.title;
    });

    setActiveTicket(newActiveTicket[0]);
  };

  return (
    <List aria-label="tickets">
      {localTickets.map(ticket => {
        const isActiveTicket =
          activeTicket !== null && activeTicket.title === ticket.title;
        return (
          <ListItem disablePadding key={ticket.title}>
            <ListItemButton
              onClick={() => {
                handleTicketChange(ticket);
              }}
            >
              <ListItemIcon sx={{ minWidth: '56px' }}>
                {isActiveTicket ? <FolderOpen /> : <Folder />}
              </ListItemIcon>

              {isActiveTicket ? (
                <ListItemText primary={`${ticket.title}`} />
              ) : (
                <ListItemText primary={`${ticket.title}`} />
              )}
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

export default TaskTicketList;
