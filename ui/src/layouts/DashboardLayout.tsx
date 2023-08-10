import useUserStore from '../stores/UserStore';
import { Link, Route, Routes } from 'react-router-dom';
import TasksLayout from './TasksLayout';

import { useEffect } from 'react';

function DashboardLayout() {
  const userStore = useUserStore();

  useEffect(() => {
    console.log(userStore.email);
  }, [userStore]);

  return (
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
            {console.log('This is rendering the / route')}
            {userStore.roles?.map(role => {
              return <div key={role}>{role}</div>;
            })}
          </>
        }
      />
      <Route path="/tasks/*" element={<TasksLayout />} />
    </Routes>
  );
}

export default DashboardLayout;
