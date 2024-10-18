// material-ui
import { useTheme } from '@mui/material/styles';
import { ThemeMode } from '../../types/config';

import logo from '../../assets/images/logo/lingo-logo.svg';
// ==============================|| LOGO SVG ||============================== //

const LogoMain = () => {
  const theme = useTheme();

  return (
    <img
      src={theme.palette.mode === ThemeMode.DARK ? logo : logo}
      alt="Snomio"
      width="150"
    />
  );
};

export default LogoMain;
