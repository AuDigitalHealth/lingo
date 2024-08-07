// material-ui
import { useTheme } from '@mui/material/styles';

import ontoserverIcon from '../../assets/images/logo/SNOWSTORM-logo.svg';
import { ThemeMode } from '../../types/config';
// ==============================|| LOGO ICON SVG ||============================== //

interface LogoIconProps {
  width: string;
}
const SnowstormIcon = ({ width }: LogoIconProps) => {
  const theme = useTheme();

  return (
    <img
      src={
        theme.palette.mode === ThemeMode.DARK ? ontoserverIcon : ontoserverIcon
      }
      alt="Ontoserver"
      width={width}
    />
  );
};

export default SnowstormIcon;
