import { Button } from '@mui/material';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';

function Login() {
  const { applicationConfig } = useApplicationConfigStore();

  function handleLogin() {
    const snomioUrl: string = window.location.href;
    const imsUrl = applicationConfig?.imsUrl ? applicationConfig?.imsUrl : '';
    const redirectUrl = imsUrl + '/#/login?serviceReferer=' + snomioUrl;
    window.location.href = redirectUrl;
  }

  return <Button onClick={handleLogin}>Log In</Button>;
}

export default Login;
