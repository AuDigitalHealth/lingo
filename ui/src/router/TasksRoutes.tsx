import useTaskStore from '../stores/TaskStore.ts';
import TasksList from '../pages/tasks/components/TasksList.tsx';
import TaskEditLayout from '../pages/tasks/TaskEditLayout.tsx';
import { Route, Routes } from 'react-router-dom';
import Loading from '../components/Loading.tsx';
import useJiraUserStore from '../stores/JiraUserStore.ts';
import useInitializeTasks from '../hooks/api/useInitializeTasks.tsx';
import { useInitializeJiraUsers } from '../hooks/api/useInitializeJiraUsers.tsx';
import useApplicationConfigStore from '../stores/ApplicationConfigStore.ts';
import { useEffect, useState } from 'react';
import { Task } from '../types/task.ts';
import useUserStore from '../stores/UserStore.ts';
import { userExistsInList } from '../utils/helpers/userUtils.ts';
import useInitializeConcepts from '../hooks/api/useInitializeConcepts.tsx';

function TasksRoutes() {
  const { allTasks, getTasksNeedReview } = useTaskStore();
  const [filteredMyTasks, setFilteredMyTasks] = useState<Task[]>([]);
  const { applicationConfig } = useApplicationConfigStore();
  const { email, login } = useUserStore();
  const { jiraUsers } = useJiraUserStore();
  const { tasksLoading } = useInitializeTasks();
  const { jiraUsersIsLoading } = useInitializeJiraUsers();

  const { conceptsLoading } = useInitializeConcepts(
    applicationConfig?.apDefaultBranch,
  );

  useEffect(() => {
    // all tasks that the user is the assignee for, or the user is an assigned reviewer for
    setFilteredMyTasks(
      allTasks.filter(task => {
        if (
          task.assignee.email === email &&
          task.projectKey === applicationConfig?.apProjectKey
        ) {
          return true;
        }
        if (userExistsInList(task.reviewers, login)) {
          return true;
        }
      }),
    );
  }, [allTasks, applicationConfig, email, login]);

  if (tasksLoading || jiraUsersIsLoading || conceptsLoading) {
    return <Loading />;
  } else {
    return (
      <>
        <Routes>
          <Route
            path=""
            element={
              <TasksList
                tasks={filteredMyTasks}
                heading={'My Tasks'}
                jiraUsers={jiraUsers}
              />
            }
          />
          <Route
            path="all"
            element={
              <TasksList
                tasks={allTasks}
                heading={'Tasks'}
                jiraUsers={jiraUsers}
              />
            }
          />
          <Route
            path="needReview"
            element={
              <TasksList
                tasks={getTasksNeedReview()}
                heading={'Tasks Requiring Review'}
                jiraUsers={jiraUsers}
              />
            }
          />
          <Route path="edit/:id/*" element={<TaskEditLayout />} />
        </Routes>
      </>
    );
  }
}

export default TasksRoutes;
