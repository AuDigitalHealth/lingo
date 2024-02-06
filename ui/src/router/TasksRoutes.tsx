import { Outlet } from 'react-router-dom';
import Loading from '../components/Loading.tsx';

import useInitializeTasks from '../hooks/api/useInitializeTasks.tsx';
import { useInitializeJiraUsers } from '../hooks/api/useInitializeJiraUsers.tsx';
import useApplicationConfigStore from '../stores/ApplicationConfigStore.ts';
import useInitializeConcepts from '../hooks/api/useInitializeConcepts.tsx';

function TasksRoutes() {
  const { applicationConfig } = useApplicationConfigStore();
  useInitializeTasks();
  const { jiraUsersIsLoading } = useInitializeJiraUsers();

  const { conceptsLoading } = useInitializeConcepts(
    applicationConfig?.apDefaultBranch,
  );

  if (jiraUsersIsLoading || conceptsLoading) {
    return <Loading />;
  } else {
    return (
      <>
        <Outlet />
      </>
    );
  }
}

export default TasksRoutes;
