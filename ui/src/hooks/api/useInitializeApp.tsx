import useInitializeTickets from './useInitializeTickets';
import useInitializeTasks from './useAllTasks';
import { useJiraUsers } from './useInitializeJiraUsers';
import useAvailableProjects from './useInitializeProjects';
import { useServiceStatus } from './useServiceStatus';
export default function useInitializeApp() {
  useInitializeTasks();
  useAvailableProjects();
  const { serviceStatusIsLoading } = useServiceStatus();
  const { ticketsLoading } = useInitializeTickets();
  const { jiraUsersIsLoading } = useJiraUsers();

  return {
    appLoading: ticketsLoading || jiraUsersIsLoading || serviceStatusIsLoading,
  };
}
