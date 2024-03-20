import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { Stack } from '@mui/system';
import UserTasksList from './components/UserTasksList.tsx';
import PageBreadcrumbs from './components/PageBreadcrumbs.tsx';
import { Outlet, useParams } from 'react-router-dom';
import { useRefsetMemberById } from '../../hooks/eclRefset/useRefsetMemberById.tsx';
import { Concept } from '../../types/concept.ts';

const ECL_REFSET_BASE = "/dashboard/eclRefsetTool"

function RefsetMembersLayout() {
  const {taskKey, projectKey, memberId} = useParams();
  const task = useUserTaskByIds();

  let branch = task?.branchPath ?? `MAIN/SNOMEDCT-AU/${projectKey}/${taskKey}`

  const { refsetMemberData } = useRefsetMemberById(branch, memberId);

  const breadcrumbs = [{
    title: "ECL Refset Tool",
    path: `${ECL_REFSET_BASE}/`
  }, {
    title: task?.summary ?? taskKey ?? "",
    path: `${ECL_REFSET_BASE}/task/${projectKey}/${taskKey}`
  }]

  if (memberId) {
    let concept =  refsetMemberData?.referencedComponent as Concept;
    breadcrumbs.push({
      title: concept?.pt?.term ?? concept?.fsn?.term ?? memberId,
      path: '.'
    })
  }

  return (
    <Stack
      spacing={4}
      sx={{
        width: '100%',
        color: '#003665'
      }}
    >
      <PageBreadcrumbs breadcrumbs={breadcrumbs}/>
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

export default RefsetMembersLayout;
