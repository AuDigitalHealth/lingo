// material-ui
import { useTheme } from '@mui/material/styles';

import logoIcon from '../../assets/images/logo/snomio-icon.png';
import { ThemeMode } from '../../types/config';
// ==============================|| LOGO ICON SVG ||============================== //

interface LogoIconProps {
  width: string;
}
const LogoIcon = ({ width }: LogoIconProps) => {
  const theme = useTheme();

  return (
    <img
      src={theme.palette.mode === ThemeMode.DARK ? logoIcon : logoIcon}
      alt="Snomio"
      width={width}
    />
  );
};

export default LogoIcon;
