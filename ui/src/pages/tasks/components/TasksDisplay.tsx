import { useCallback, useEffect, useState } from 'react';
import { useAllTasks } from '../../../hooks/api/useAllTasks';
import TasksList from './TasksList';
import { Task, TaskStatus } from '../../../types/task';
import useUserStore from '../../../stores/UserStore';
import { useApplicationConfig } from '../../../hooks/api/useInitializeConfig';
import { userExistsInList } from '../../../utils/helpers/userUtils';
import useAvailableProjects, {
  getProjectFromKey,
} from '../../../hooks/api/useInitializeProjects';

interface TasksDisplayProps {
  path?: '' | '/all' | '/needReview' | '/snodine';
  propTasks?: Task[];
  heading: string;
  dense?: boolean;
  // disable search, filter's etc
  naked?: boolean;
  showActionBar?: boolean;
  displayProject?: boolean;
  displayTickets?: boolean;
  isSnodineList?: boolean;
  taskCreateRedirectUrl: string;
}

function TasksDisplay({
  path,
  heading,
  displayProject,
  taskCreateRedirectUrl,
}: TasksDisplayProps) {
  const { email, login } = useUserStore();
  const { applicationConfig } = useApplicationConfig();
  const { allTasks, allTasksIsLoading } = useAllTasks();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  const { data: projects } = useAvailableProjects();
  const project = getProjectFromKey(applicationConfig?.apProjectKey, projects);

  const getFilteredMyTasks = useCallback(() => {
    if (!allTasks) return [];
    return allTasks?.filter(task => {
      if (
        task.assignee.email === email &&
        task.projectKey === applicationConfig?.apProjectKey
      ) {
        return true;
      }
      if (userExistsInList(task.reviewers, login)) {
        return true;
      }
    });
  }, [allTasks, applicationConfig?.apProjectKey, login, email]);

  useEffect(() => {
    if (path === undefined || path === null) return;
    if (path === '/all') {
      setLocalTasks(allTasks ? allTasks : []);
    } else if (path === '/needReview') {
      setLocalTasks(
        (() => {
          const tasksNeedReview = allTasks?.filter(function (task) {
            return task.status === TaskStatus.InReview;
          });
          return tasksNeedReview;
        })() || [],
      );
    } else {
      setLocalTasks(getFilteredMyTasks());
    }
  }, [path, allTasks, getFilteredMyTasks]);

  return (
    <TasksList
      loading={allTasksIsLoading}
      propTasks={localTasks}
      heading={heading}
      displayProject={displayProject}
      taskCreateRedirectUrl={taskCreateRedirectUrl}
      projectOptions={project ? [project] : []}
    />
  );
}

export default TasksDisplay;
