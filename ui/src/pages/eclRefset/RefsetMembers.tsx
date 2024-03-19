import useUserTaskByIds from '../../hooks/eclRefset/useUserTaskByIds.tsx';
import { useParams } from 'react-router-dom';
import RefsetMemberList from './components/RefsetMemberList.tsx';


function RefsetMembers() {
  const {taskKey, projectKey} = useParams();
  const task = useUserTaskByIds();

  let branch = task?.branchPath ?? `MAIN/SNOMEDCT-AU/${projectKey}/${taskKey}`

  return (
    <RefsetMemberList heading="Query Reference Sets" branch={branch}/>
  );
}

export default RefsetMembers;
