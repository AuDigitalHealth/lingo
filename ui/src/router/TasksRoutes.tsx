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

function TasksRoutes() {
  const { myTasks, allTasks, getTasksNeedReview, getTasksRequestedReview } =
    useTaskStore();
  const [filteredMyTasks, setFilteredMyTasks] = useState<Task[]>([]);
  const { applicationConfig } = useApplicationConfigStore();
  const { jiraUsers } = useJiraUserStore();
  const { tasksLoading } = useInitializeTasks();
  const { jiraUsersIsLoading } = useInitializeJiraUsers();

  useEffect(() => {
    console.log('ehere');
    setFilteredMyTasks(
      myTasks.filter(task => {
        return task.projectKey === applicationConfig?.apProjectKey;
      }),
    );
  }, [myTasks, applicationConfig]);

  if (tasksLoading || jiraUsersIsLoading) {
    return <Loading />;
  } else {
    return (
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
          path="reviewRequested"
          element={
            <TasksList
              tasks={getTasksRequestedReview()}
              heading={'Tasks Requested Your Review'}
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
        <Route path="edit/:id" element={<TaskEditLayout />} />
        {/* not sure about this? Something that chris mentioned - you need to be able to look at the products task?
          dunno how that's different to just a regular task
        */}
        <Route path="products" element={<>products</>} />
      </Routes>
    );
  }
}

export default TasksRoutes;
