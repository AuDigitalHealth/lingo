import { useParams } from 'react-router-dom';
import useTicketById from '../../hooks/useTicketById';

function IndividualTicket() {
  const { id } = useParams();
  const ticket = useTicketById(id);
  console.log(ticket);
  return <div>You are on the ticket page!</div>;
}

export default IndividualTicket;
