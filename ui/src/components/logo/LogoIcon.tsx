// material-ui
import { useTheme } from '@mui/material/styles';

import { ThemeMode } from '../../types/config';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore.ts';
// ==============================|| LOGO ICON SVG ||============================== //

interface LogoIconProps {
  width: string;
}
const LogoIcon = ({ width }: LogoIconProps) => {
  const theme = useTheme();
  const { getLogo } = useApplicationConfigStore();
  // Determine the icon based on the environment
  const iconSrc = getLogo();
  if (iconSrc) {
    return (
      <img
        src={theme.palette.mode === ThemeMode.DARK ? iconSrc : iconSrc}
        alt="Lingo"
        width={width}
      />
    );
  } else {
    return <></>;
  }
};

export default LogoIcon;
