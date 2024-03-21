import Loading from '../components/Loading';
import { Outlet } from 'react-router-dom';
import useInitializeTickets from '../hooks/api/useInitializeTickets';
import { useInitializeJiraUsers } from '../hooks/api/useInitializeJiraUsers';

function TicketsRoutes() {
  const { ticketsLoading } = useInitializeTickets();
  const { jiraUsersIsLoading } = useInitializeJiraUsers();

  if (ticketsLoading || jiraUsersIsLoading) {
    return <Loading />;
  }
  return <Outlet />;
}

export default TicketsRoutes;
