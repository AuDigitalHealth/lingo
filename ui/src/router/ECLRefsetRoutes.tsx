import {
  Route, Routes
} from 'react-router-dom';

import UserTasks from '../pages/eclRefset/UserTasks.tsx';
import RefsetMembers from '../pages/eclRefset/RefsetMembers.tsx';
import RefsetMembersLayout from '../pages/eclRefset/RefsetMembersLayout.tsx';

export default function ECLRefsetRoutes() {

  return (
    <Routes>
      <Route path="" element={<UserTasks />} />
      <Route path="task/:projectKey/:taskKey" element={<RefsetMembersLayout />}>
        <Route path="" element={<RefsetMembers />}/>
        <Route path="member/:memberId" element={<div>Refset Member Details</div>}/>
      </Route>
    </Routes>
  );
};