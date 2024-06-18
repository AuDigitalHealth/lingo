import { Ticket } from '../../../../../types/tickets/ticket';
import { Task } from '../../../../../types/task';

function isTaskCurrent(ticket: Ticket, allTasks: Task[]) {
  const key = ticket.taskAssociation?.taskId;
  const isCurrent = allTasks.find(task => {
    return task.key === key;
  });
  return isCurrent;
}

export { isTaskCurrent };
