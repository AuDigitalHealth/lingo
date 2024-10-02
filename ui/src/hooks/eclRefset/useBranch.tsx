import { useParams } from 'react-router-dom';
import useUserTaskByIds from './useUserTaskByIds';
import { useApplicationConfig } from '../api/useInitializeConfig';

function useBranch() {
  const { applicationConfig } = useApplicationConfig();
  const { taskKey, projectKey } = useParams();
  const task = useUserTaskByIds();

  const branch =
    task?.branchPath ??
    `${applicationConfig?.apSnodineDefaultBranch}/${projectKey}/${taskKey}`;

  return branch;
}

export default useBranch;
