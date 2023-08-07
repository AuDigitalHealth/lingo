import useUserStore from '../stores/UserStore';
import { Link, Route, Routes } from 'react-router-dom';
import TasksLayout from './TasksLayout';

import AppContainer from '../components/AppContainer';

function DashboardLayout() {
  const userStore = useUserStore();

  return (
    <AppContainer>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <div>Email: {userStore.email}</div>
              <div>FirstName: {userStore.firstName}</div>
              <div>LastName: {userStore.lastName}</div>
              <div>Login: {userStore.login}</div>
              <Link to="tasks">to tasks</Link>
              <div> Roles:</div>

              {userStore.roles?.map(role => {
                return <div key={role}>{role}</div>;
              })}
            </>
          }
        />
        <Route path="/tasks/*" element={<TasksLayout />} />
      </Routes>
    </AppContainer>
  );
}

export default DashboardLayout;
