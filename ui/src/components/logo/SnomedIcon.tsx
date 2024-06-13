// material-ui
import { useTheme } from '@mui/material/styles';

import snomedIcon from '../../assets/images/logo/snomed-international.png';
import { ThemeMode } from '../../types/config';
// ==============================|| LOGO ICON SVG ||============================== //

interface LogoIconProps {
  width: string;
}
const SnomedIcon = ({ width }: LogoIconProps) => {
  const theme = useTheme();

  return (
    <img
      src={theme.palette.mode === ThemeMode.DARK ? snomedIcon : snomedIcon}
      alt="Ontoserver"
      width={width}
    />
  );
};

export default SnomedIcon;
