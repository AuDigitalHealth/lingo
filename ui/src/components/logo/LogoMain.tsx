// material-ui
import { useTheme } from '@mui/material/styles';
import { ThemeMode } from '../../types/config';

import logo from '../../assets/images/logo/logo-4.png';
// ==============================|| LOGO SVG ||============================== //

const LogoMain = ({ reverse, ...others }: { reverse?: boolean }) => {
  const theme = useTheme();

  return (
     
     <img src={theme.palette.mode === ThemeMode.DARK ? logo : logo} alt="Snomio" width="150" />
     
  );
};

export default LogoMain;
