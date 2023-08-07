import useTaskStore from '../stores/TaskStore';
import TaskItem from './TaskItem';

interface TaskListProps {
  listAllTasks?:boolean;
}
function TasksList({ listAllTasks }: TaskListProps) {
  const { tasks, allTasks } = useTaskStore();
   if(listAllTasks){
    return (
      <>
        {allTasks?.map(task => {
          return <TaskItem task={task} key={task.key}/>;
        })}
      </>
    );
   }
  return (
    <>
      {tasks?.map(task => {
        return <TaskItem task={task} key={task.key} />;
      })}
    </>
  );

  
}

export default TasksList;
