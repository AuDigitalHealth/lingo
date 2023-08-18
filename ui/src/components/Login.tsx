import { Button } from '@mantine/core';
import useApplicationConfigStore from '../stores/ApplicationConfigStore';

function Login() {
  const { applicationConfig } = useApplicationConfigStore();
  const snomioUrl: string = window.location.href;
  function handleLogin() {
    window.location.href = applicationConfig?.imsUrl
      ? applicationConfig?.imsUrl
      : '' + '/#/login?serviceReferer=' + snomioUrl;
  }

  return <Button onClick={handleLogin}>Log In</Button>;
}

export default Login;
