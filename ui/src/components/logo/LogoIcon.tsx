// material-ui
import { useTheme } from '@mui/material/styles';

import logoIcon from '../../assets/images/logo/snomio-icon.png';
import { ThemeMode } from '../../types/config';
// ==============================|| LOGO ICON SVG ||============================== //

const LogoIcon = () => {
  const theme = useTheme();

  return (
    <img
      src={theme.palette.mode === ThemeMode.DARK ? logoIcon : logoIcon}
      alt="Mantis"
      width="50"
    />
  );
};

export default LogoIcon;
