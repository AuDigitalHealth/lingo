import TasksServices from '../../../api/TasksService';
import { Task } from '../../../types/task';
import { useQuery, queryOptions } from '@tanstack/react-query';

export const getTaskByKeyQueryOptions = (taskKey: string) => {
  return queryOptions({
    queryKey: [`search-task-by-key-${taskKey}`],
    queryFn: () => TasksServices.searchTaskByKey(taskKey),
    retry: false,
  });
};

function useSearchTaskByKey(
  isCurrent: Task | undefined,
  taskKey: string | undefined,
) {
  return useQuery({
    ...getTaskByKeyQueryOptions(taskKey as string),
    enabled: isCurrent === undefined && taskKey !== undefined,
  });
}

export default useSearchTaskByKey;
