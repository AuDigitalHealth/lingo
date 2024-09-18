import { Route, Routes } from 'react-router-dom';

import UserTasks from '../pages/eclRefset/UserTasks.tsx';
import Refsets from '../pages/eclRefset/Refsets.tsx';
import RefsetsLayout from '../pages/eclRefset/RefsetsLayout.tsx';
import RefsetMemberDetails from '../pages/eclRefset/RefsetMemberDetails.tsx';
import RefsetMemberCreate from '../pages/eclRefset/RefsetMemberCreate.tsx';
import TickFlickRefset from '../pages/eclRefset/TickFlickRefset.tsx';

export default function ECLRefsetRoutes() {
  return (
    <Routes>
      <Route path="" element={<UserTasks />} />
      <Route path="task/:projectKey/:taskKey" element={<RefsetsLayout />}>
        <Route path="" element={<Refsets />} />
        <Route path="qs">
          <Route path="" element={<RefsetMemberCreate />} />
          <Route path=":memberId" element={<RefsetMemberDetails />} />
        </Route>
        <Route path="tnf/:conceptId" element={<TickFlickRefset />} />
      </Route>
    </Routes>
  );
}
