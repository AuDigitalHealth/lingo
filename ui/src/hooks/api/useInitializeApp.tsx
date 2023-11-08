import useInitializeTickets from './useInitializeTickets';
import useInitializeTasks from './useInitializeTasks';
import { useInitializeJiraUsers } from './useInitializeJiraUsers';
import useInitializeConcepts from './useInitializeConcepts.tsx';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore.ts';

export default function useInitializeApp() {
  const { tasksLoading } = useInitializeTasks();
  const { ticketsLoading } = useInitializeTickets();
  const { jiraUsersIsLoading } = useInitializeJiraUsers();
  const { conceptsLoading } = useInitializeConcepts(
    useApplicationConfigStore.getState().applicationConfig
      ?.apDefaultBranch as string,
  );
  return {
    appLoading:
      tasksLoading || ticketsLoading || jiraUsersIsLoading || conceptsLoading,
  };
}
