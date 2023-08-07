import { Button } from '@mantine/core';

function Login() {
  const baseUrl = `${import.meta.env.VITE_IMS_URL}`;
  const snomioUrl: string = window.location.href.replace('/login', '');
  function handleLogin() {
    window.location.href = baseUrl + '/#/login?serviceReferer=' + snomioUrl;
  }

  return <Button onClick={handleLogin}>Log In</Button>;
}

export default Login;
