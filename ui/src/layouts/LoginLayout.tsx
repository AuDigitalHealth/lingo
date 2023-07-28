import Login from '../components/Login';

function LoginLayout() {
  const ping = () => {
    fetch('/api', { method: 'GET' }).then(res => {
      console.log(res);
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Login />
    </div>
  );
}

export default LoginLayout;
