import Login from '../components/Login';

function LoginLayout() {
  console.log('rendering login layout');
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Login />
    </div>
  );
}

export default LoginLayout;
