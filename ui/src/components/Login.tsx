import { Button } from '@mantine/core';

function Login() {
  const baseUrl = `${import.meta.env.VITE_IMS_URL}`;
  const snomioUrl = `${import.meta.env.VITE_SNOMIO_UI_URL}`
  function handleLogin() {
    window.location.href =
      baseUrl +
      '/#/login?serviceReferer=' +
      snomioUrl;
  }

  return <Button onClick={handleLogin}>Log In</Button>;
}

export default Login;
