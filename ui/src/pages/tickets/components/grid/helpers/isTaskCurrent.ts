import { Ticket } from '../../../../../types/tickets/ticket';
import { Task } from '../../../../../types/task';

function isTaskCurrent(
  ticket: Ticket | undefined,
  allTasks: Task[] | undefined,
) {
  if (ticket === undefined) return false;
  const key = ticket.taskAssociation?.taskId;
  const isCurrent = allTasks?.find(task => {
    return task.key === key;
  });
  return isCurrent;
}

export { isTaskCurrent };
