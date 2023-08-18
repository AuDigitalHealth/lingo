import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import useTicketStore, { Ticket } from '../../stores/TicketStore';

function TaskTicketList() {
  const { tickets, activeTicket, setActiveTicket } = useTicketStore();

  const handleTicketChange = (ticket: Ticket) => {
    if (activeTicket && activeTicket.name === ticket.name) {
      setActiveTicket(null);
      return;
    }
    const newActiveTicket = tickets.filter(individualTicket => {
      return ticket.name === individualTicket.name;
    });

    setActiveTicket(newActiveTicket[0]);
  };

  return (
    <List aria-label="tickets">
      {tickets.map(ticket => {
        const isActiveTicket =
          activeTicket !== null && activeTicket.name === ticket.name;
        return (
          <ListItem disablePadding key={ticket.name}>
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
                <ListItemText primary={`${ticket.name}`} />
              ) : (
                <ListItemText inset primary={`${ticket.name}`} />
              )}
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

export default TaskTicketList;
