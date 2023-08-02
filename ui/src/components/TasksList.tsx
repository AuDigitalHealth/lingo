import useTaskStore from '../stores/TaskStore';
import TaskItem from './TaskItem';

function TasksList() {
  const { tasks } = useTaskStore();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1em',
        padding: '1em',
      }}
    >
      {tasks?.map(task => {
        return <TaskItem task={task} key={task.key}/>;
      })}
    </div>
  );
}

export default TasksList;
