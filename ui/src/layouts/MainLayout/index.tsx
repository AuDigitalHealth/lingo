import { Outlet } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { useMediaQuery, Box, Container, Toolbar } from '@mui/material';

// project import
import Drawer from './Drawer';
import Header from './Header';

import useConfig from '../../hooks/useConfig';
// import { dispatch } from 'store';
// import { openDrawer } from 'store/reducers/menu';

// types
import { MenuOrientation } from '../../types/config';
import useWebSocket from '../../hooks/useWebSocket';
import { Stack } from '@mui/system';
import useInitializeApp from '../../hooks/useInitializeApp';
import Loading from '../../components/Loading';

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout = () => {
  const theme = useTheme();
  const matchDownXL = useMediaQuery(theme.breakpoints.down('xl'));
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { container, miniDrawer, menuOrientation } = useConfig();
  useWebSocket();
  const isHorizontal =
    menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

    const loading = useInitializeApp();

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <Header />
      <Drawer />

      <Box
        component="main"
        sx={{ width: 'calc(100% - 260px)', flexGrow: 1, p: { xs: 2, sm: 3 } }}
      >
        <Toolbar sx={{ mt: isHorizontal ? 8 : 'inherit' }} />
        <Container
          maxWidth={false}
          sx={{
            ...(container && { px: { xs: 0, sm: 2 } }),
            position: 'relative',
            minHeight: 'calc(100vh - 110px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Stack height={'calc(100vh - 110px)'}>
            {/* <Breadcrumbs navigation={navigation} title titleBottom card={false} divider={false} /> */}
            {loading ? <Loading/> : <Outlet />}
            {/* <Outlet /> */}
            {/* <Footer/> */}
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
