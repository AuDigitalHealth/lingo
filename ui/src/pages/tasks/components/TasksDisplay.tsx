import { useCallback, useEffect, useState } from 'react';
import { useAllTasks } from '../../../hooks/api/task/useAllTasks';
import TasksList from './TasksList';
import { Task, TaskStatus } from '../../../types/task';
import useUserStore from '../../../stores/UserStore';
import { useApplicationConfig } from '../../../hooks/api/useInitializeConfig';
import { userExistsInList } from '../../../utils/helpers/userUtils';
import useAvailableProjects, {
  getProjectsFromKeys,
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

  const { data: allProjects } = useAvailableProjects();
  const projects = getProjectsFromKeys(
    applicationConfig?.apProjectKeys,
    allProjects,
  );

  const getFilteredMyTasks = useCallback(() => {
    if (!allTasks) return [];
    return allTasks?.filter(task => {
      if (
        task.assignee.email === email &&
        projects?.some(project => project.key === task.projectKey)
      ) {
        return true;
      }
      if (userExistsInList(task.reviewers, login)) {
        return true;
      }
    });
  }, [allTasks, login, email, projects]);

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
      projectOptions={projects ? projects : []}
    />
  );
}

export default TasksDisplay;
