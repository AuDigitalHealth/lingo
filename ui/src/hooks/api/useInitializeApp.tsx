import useInitializeTickets from './useInitializeTickets';
import useInitializeTasks from './useInitializeTasks';
import { useInitializeJiraUsers } from './useInitializeJiraUsers';
import useInitializeProjects from './useInitializeProjects';
import { useServiceStatus } from './useServiceStatus';
export default function useInitializeApp() {
  useInitializeTasks();
  useInitializeProjects();
  const { serviceStatusIsLoading } = useServiceStatus();
  const { ticketsLoading } = useInitializeTickets();
  const { jiraUsersIsLoading } = useInitializeJiraUsers();

  return {
    appLoading: ticketsLoading || jiraUsersIsLoading || serviceStatusIsLoading,
  };
}
