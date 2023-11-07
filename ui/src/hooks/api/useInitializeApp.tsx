import useInitializeTickets from './useInitializeTickets';
import useInitializeTasks from './useInitializeTasks';
import { useInitializeJiraUsers } from './useInitializeJiraUsers';
import useInitializeConcepts from './useInitializeConcepts.tsx';
import { getOrDefaultBranch } from '../../utils/helpers/conceptUtils.ts';

export default function useInitializeApp() {
  const { tasksLoading } = useInitializeTasks();
  const { ticketsLoading } = useInitializeTickets();
  const { jiraUsersIsLoading } = useInitializeJiraUsers();
  const { conceptsLoading } = useInitializeConcepts(getOrDefaultBranch());
  return {
    appLoading:
      tasksLoading || ticketsLoading || jiraUsersIsLoading || conceptsLoading,
  };
}
