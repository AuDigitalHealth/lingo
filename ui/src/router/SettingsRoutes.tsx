import { Route, Routes } from 'react-router-dom';
import LabelsSettings from '../pages/settings/LabelsSettings.tsx';

function SettingsRoutes() {
  return (
    <>
      <Routes>
        <Route path="label" element={<LabelsSettings />} />
      </Routes>
    </>
  );
}

export default SettingsRoutes;
