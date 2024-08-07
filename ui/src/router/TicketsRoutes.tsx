import Loading from '../components/Loading';
import { Outlet } from 'react-router-dom';

interface TicketsRoutesProps {
  ticketsLoading: boolean;
  jiraUsersIsLoading: boolean;
}
function TicketsRoutes({
  ticketsLoading,
  jiraUsersIsLoading,
}: TicketsRoutesProps) {
  if (ticketsLoading || jiraUsersIsLoading) {
    return <Loading />;
  }
  return <Outlet />;
}

export default TicketsRoutes;
