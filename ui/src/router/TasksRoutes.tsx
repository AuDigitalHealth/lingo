import { Outlet } from 'react-router-dom';
import Loading from '../components/Loading.tsx';

import useInitializeTasks from '../hooks/api/task/useAllTasks.js';
import { useJiraUsers } from '../hooks/api/useInitializeJiraUsers.tsx';
import useApplicationConfigStore from '../stores/ApplicationConfigStore.ts';
import useInitializeConcepts from '../hooks/api/useInitializeConcepts.tsx';
import { useInitializeSelectedProject } from '../hooks/api/useInitializeProjects.tsx';

function TasksRoutes() {
  const { applicationConfig } = useApplicationConfigStore();
  useInitializeTasks();
  const { jiraUsersIsLoading } = useJiraUsers();

  useInitializeConcepts(applicationConfig?.apDefaultBranch);
  const { isLoading } = useInitializeSelectedProject();
  if (jiraUsersIsLoading || isLoading) {
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
