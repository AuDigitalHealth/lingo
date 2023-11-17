import useInitializeTickets from './useInitializeTickets';
import useInitializeTasks from './useInitializeTasks';
import { useInitializeJiraUsers } from './useInitializeJiraUsers';
import useInitializeProjects from './useInitializeProjects';
export default function useInitializeApp() {
  const { tasksLoading } = useInitializeTasks();
  const { projectsLoading } = useInitializeProjects();
  const { ticketsLoading } = useInitializeTickets();
  const { jiraUsersIsLoading } = useInitializeJiraUsers();

  return {
    appLoading:
      tasksLoading || ticketsLoading || jiraUsersIsLoading || projectsLoading,
  };
}
