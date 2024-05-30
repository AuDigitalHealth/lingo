import { TicketDto } from "../../../../types/tickets/ticket";

interface TicketDrawerProps  {
    ticket: TicketDto;
}

export default function TicketDrawer({ticket} : TicketDrawerProps){

    return (
        <div>{ticket.title}</div>
    )
}