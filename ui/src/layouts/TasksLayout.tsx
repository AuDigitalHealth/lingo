import { useEffect } from 'react';
import useTaskStore from '../stores/TaskStore';
import TasksList from '../components/TasksList';
import { Route, Routes } from 'react-router-dom';

function TasksLayout() {
  const taskStore = useTaskStore();

  useEffect(() => {
    taskStore.fetchTasks().catch(err => {
      console.log(err)
    });
  }, []);
  
  if( taskStore.fetching ){
    return (
      <>fetching</>
    )
  } else {
    return (
      <Routes>
        <Route path=""
          element={
            <TasksList />
          }
        />
        <Route path="all"
          element={
            <>all</>
          }
        />
        <Route path="edit/:id"
          element={
            <>edit</>
          }
        />
        {/* not sure about this? Something that chris mentioned - you need to be able to look at the products task?
          dunno how that's different to just a regular task
        */}
        <Route path="products"
          element={
            <>products</>
          }
          />
      </Routes>
    )
  }
  
}

export default TasksLayout;
