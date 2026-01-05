import useInitializeTickets from './useInitializeTickets';
import useInitializeTasks from './task/useAllTasks';
import { useJiraUsers } from './useInitializeJiraUsers';
import useAvailableProjects from './useInitializeProjects';
import { useServiceStatus } from './useServiceStatus';
export default function useInitializeApp() {
  useInitializeTasks();
  useAvailableProjects();
  const { serviceStatusIsLoading } = useServiceStatus();
  const { ticketsLoading } = useInitializeTickets();
  const { jiraUsersIsLoading } = useJiraUsers();
  const projects = useAvailableProjects();

  return {
    appLoading:
      ticketsLoading ||
      jiraUsersIsLoading ||
      serviceStatusIsLoading ||
      projects.isLoading,
  };
}
