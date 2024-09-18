import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { Stack } from '@mui/system';
import UserTasksList from './components/UserTasksList.tsx';
import PageBreadcrumbs from './components/PageBreadcrumbs.tsx';
import { Outlet, useMatch, useParams } from 'react-router-dom';
import { useRefsetMemberById } from '../../hooks/eclRefset/useRefsetMemberById.tsx';
import { useConceptById } from '../../hooks/eclRefset/useConceptsById.tsx';
import { Concept } from '../../types/concept.ts';

const SNODINE_BASE = '/dashboard/snodine';

function RefsetsLayout() {
  const { taskKey, projectKey, memberId, conceptId } = useParams();
  const task = useUserTaskByIds();

  const branch =
    task?.branchPath ?? `MAIN/SNOMEDCT-AU/${projectKey}/${taskKey}`;

  const { refsetMemberData } = useRefsetMemberById(branch, memberId);
  const { conceptData } = useConceptById(branch, conceptId);

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
      <UserTasksList
        propTasks={task ? [task] : []}
        heading=""
        dense={true}
        naked={true}
      />

      <Outlet />
    </Stack>
  );
}

export default RefsetsLayout;
