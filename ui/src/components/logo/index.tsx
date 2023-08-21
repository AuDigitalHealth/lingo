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
  reverse?: boolean;
  isIcon?: boolean;
  sx?: SxProps;
}

const LogoSection = ({ reverse, isIcon, sx }: Props) => (
  <ButtonBase disableRipple component={Link} to={'/'} sx={sx}>
    {isIcon ? <LogoIcon width="50px" /> : <Logo reverse={reverse} />}
  </ButtonBase>
);

export default LogoSection;
