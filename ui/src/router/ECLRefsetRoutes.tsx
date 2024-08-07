import { Route, Routes } from 'react-router-dom';

import UserTasks from '../pages/eclRefset/UserTasks.tsx';
import RefsetMembers from '../pages/eclRefset/RefsetMembers.tsx';
import RefsetMembersLayout from '../pages/eclRefset/RefsetMembersLayout.tsx';
import RefsetMemberDetails from '../pages/eclRefset/RefsetMemberDetails.tsx';
import RefsetMemberCreate from '../pages/eclRefset/RefsetMemberCreate.tsx';

export default function ECLRefsetRoutes() {
  return (
    <Routes>
      <Route path="" element={<UserTasks />} />
      <Route path="task/:projectKey/:taskKey" element={<RefsetMembersLayout />}>
        <Route path="" element={<RefsetMembers />} />
        <Route path="member/:memberId" element={<RefsetMemberDetails />} />
        <Route path="create" element={<RefsetMemberCreate />} />
      </Route>
    </Routes>
  );
}
