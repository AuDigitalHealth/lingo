import {
  Route, Routes
} from 'react-router-dom';

import TasksList from '../pages/eclRefset/components/UserTasksList.tsx';

export default function ECLRefsetRoutes() {

  return (
    <Routes>
      <Route path="" element={<TasksList heading="ECL Refset Tool" />} />
      <Route path="project/:projectKey/task/:key" element={<div>task</div>} />
    </Routes>
  );
};