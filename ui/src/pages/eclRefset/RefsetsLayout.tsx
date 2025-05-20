import { Stack } from '@mui/system';
import PageBreadcrumbs from './components/PageBreadcrumbs.tsx';
import { Outlet, useMatch, useParams } from 'react-router-dom';
import { useRefsetMemberById } from '../../hooks/eclRefset/useRefsetMemberById.tsx';
import { useConceptById } from '../../hooks/eclRefset/useConceptsById.tsx';
import { Concept } from '../../types/concept.ts';
import useBranch from '../../hooks/eclRefset/useBranch.tsx';
import { useFetchAndCreateBranch } from '../../hooks/api/task/useInitializeBranch.tsx';
import { Task } from '../../types/task.ts';
import useTaskByKey from '../../hooks/useTaskById.tsx';
import Loading from '../../components/Loading.tsx';
import TasksList from '../tasks/components/TasksList.tsx';

const SNODINE_BASE = '/dashboard/snodine';

function RefsetsLayout() {
  const { taskKey, projectKey, memberId, conceptId } = useParams();
  const task = useTaskByKey(taskKey);
  const { data } = useFetchAndCreateBranch(task as Task);
  const branch = useBranch();

  const { refsetMemberData } = useRefsetMemberById(
    branch,
    memberId,
    data !== undefined,
  );
  const { conceptData } = useConceptById(branch, conceptId, data !== undefined);

  const breadcrumbs = [
    {
      title: 'Snodine',
      path: `${SNODINE_BASE}/`,
    },
    {
      title: task?.summary ?? taskKey ?? '',
      path: `${SNODINE_BASE}/task/${projectKey}/${taskKey}`,
    },
  ];

  const match = useMatch(`${SNODINE_BASE}/task/:p/:t/*`);
  if (match?.params['*']?.startsWith('qs')) {
    if (memberId) {
      const concept = refsetMemberData?.referencedComponent as Concept;
      breadcrumbs.push({
        title: concept?.pt?.term ?? concept?.fsn?.term ?? memberId,
        path: '.',
      });
    } else {
      breadcrumbs.push({
        title: 'New Query Reference Set',
        path: '.',
      });
    }
  } else if (match?.params['*']?.startsWith('tnf')) {
    if (conceptId) {
      breadcrumbs.push({
        title: conceptData?.pt?.term ?? conceptData?.fsn?.term ?? conceptId,
        path: '.',
      });
    }
  }

  return (
    <Stack
      spacing={4}
      sx={{
        width: '100%',
        color: '#003665',
      }}
    >
      <PageBreadcrumbs breadcrumbs={breadcrumbs} />
      <TasksList
        propTasks={task ? [task] : []}
        heading=""
        dense={true}
        naked={true}
        taskCreateRedirectUrl=""
        showActionBar={false}
      />
      {data !== undefined ? (
        <Outlet />
      ) : (
        <Stack sx={{ width: '100%' }}>
          <Loading />
        </Stack>
      )}
    </Stack>
  );
}

export default RefsetsLayout;
