import { MantineProvider, List } from '@mantine/core';
import { NavBar } from '../components/NavBar';
import { HeaderBar } from '../components/HeaderBar';
import useUserStore from '../stores/UserStore';
import { Route, Routes } from 'react-router-dom';
import TasksLayout from './TasksLayout';

function DashboardLayout() {
  const userStore = useUserStore();

  // const ping = () => {
  //   fetch('/api', { method: 'GET' }).then(res => {
  //     console.log(res);
  //   });
  // };

  // const pingProtected = () => {
  //   fetch('/api/author', { method: 'GET' }).then(res => {
  //     console.log(res);
  //   });
  // };

  // const pingImpossible = () => {
  //   fetch('/api/impossible', { method: 'GET' }).then(res => {
  //     console.log(res);
  //   });
  // };

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <div style={{ height: '100vh', width: '100vw', display: 'flex' }}>
        <HeaderBar />
        <NavBar />
        <div style={{ paddingLeft: '1em', paddingTop: '5em' }}>
          <Routes>
            <Route
              path=""
              element={
                <List>
                  <List.Item>Email: {userStore.email}</List.Item>
                  <List.Item>FirstName: {userStore.firstName}</List.Item>
                  <List.Item>LastName: {userStore.lastName}</List.Item>
                  <List.Item>Login: {userStore.login}</List.Item>
                  <List.Item>
                    Roles:
                    <List>
                      {userStore.roles?.map(role => {
                        return <List.Item key={role}>{role}</List.Item>;
                      })}
                    </List>
                  </List.Item>
                </List>
              }
            />
            <Route path="/tasks/*" element={<TasksLayout />} />
          </Routes>
        </div>
      </div>
    </MantineProvider>
  );
}

export default DashboardLayout;
