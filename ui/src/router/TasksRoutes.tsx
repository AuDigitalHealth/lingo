import { useEffect } from 'react';
import useTaskStore from '../stores/TaskStore.ts';
import TasksList from '../pages/tasks/components/TasksList.tsx';
import TaskEditLayout from '../pages/tasks/TaskEditLayout.tsx';
import { Route, Routes } from 'react-router-dom';
import Loading from '../components/Loading.tsx';
import useJiraUserStore from '../stores/JiraUserStore.ts';
import useTicketStore from '../stores/TicketStore.ts';
import TicketsService from '../api/TicketsService.ts';

function TasksRoutes() {
  const taskStore = useTaskStore();
  const { setTaskAssociations } = useTicketStore();
  const { myTasks, allTasks, getTasksNeedReview, getTasksRequestedReview } =
    taskStore;
  const jiraUserStore = useJiraUserStore();
  const { jiraUsers } = jiraUserStore;

  useEffect(() => {
    taskStore.fetchAllTasks().catch(err => {
      console.log(err);
    });
    taskStore.fetchTasks().catch(err => {
      console.log(err);
    });
    jiraUserStore.fetchJiraUsers().catch(err => {
      console.log(err);
    });
    TicketsService.getTaskAssociations()
      .then(taskAssociations => {
        setTaskAssociations(taskAssociations);
      })
      .catch(err => {
        console.log(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (taskStore.fetching || jiraUserStore.fetching) {
    return <Loading />;
  } else {
    return (
      <Routes>
        <Route
          path=""
          element={
            <TasksList
              tasks={myTasks}
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
