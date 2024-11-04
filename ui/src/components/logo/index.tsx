import { Link } from 'react-router-dom';

// material-ui
import { ButtonBase } from '@mui/material';
import { SxProps } from '@mui/system';

// project import
import Logo from './LogoMain';
import LogoIcon from './LogoIcon';
// import { APP_DEFAULT_PATH } from 'config';

// ==============================|| MAIN LOGO ||============================== //

interface Props {
  isIcon?: boolean;
  sx?: SxProps;
}

const LogoSection = ({ isIcon, sx }: Props) => (
  <ButtonBase disableRipple component={Link} to={'/dashboard/tasks'} sx={sx}>
    {isIcon ? <LogoIcon width="50px" /> : <Logo />}
  </ButtonBase>
);

export default LogoSection;
