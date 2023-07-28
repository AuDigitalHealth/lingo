import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AuthorisationLayout from '../layouts/AuthorisationLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import LoginLayout from '../layouts/LoginLayout';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthorisationLayout />} />
        <Route path="/login" element={<LoginLayout />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
