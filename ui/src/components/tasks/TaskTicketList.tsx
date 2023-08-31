import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import useTicketStore from '../../stores/TicketStore';
import { Ticket } from '../../types/tickets/ticket';

function TaskTicketList() {
  const { tickets, activeTicket, setActiveTicket } = useTicketStore();

  const handleTicketChange = (ticket: Ticket) => {
    if (activeTicket && activeTicket.title === ticket.title) {
      setActiveTicket(null);
      return;
    }
    const newActiveTicket = tickets.filter(individualTicket => {
      return ticket.title === individualTicket.title;
    });

    setActiveTicket(newActiveTicket[0]);
  };

  return (
    <List aria-label="tickets">
      {tickets.map(ticket => {
        const isActiveTicket =
          activeTicket !== null && activeTicket.title === ticket.title;
        return (
          <ListItem disablePadding key={ticket.title}>
            <ListItemButton
              onClick={() => {
                handleTicketChange(ticket);
              }}
            >
              {isActiveTicket && (
                <ListItemIcon sx={{ minWidth: '56px' }}>
                  <FolderOpenIcon />
                </ListItemIcon>
              )}
              {isActiveTicket ? (
                <ListItemText primary={`${ticket.title}`} />
              ) : (
                <ListItemText inset primary={`${ticket.title}`} />
              )}
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

export default TaskTicketList;
