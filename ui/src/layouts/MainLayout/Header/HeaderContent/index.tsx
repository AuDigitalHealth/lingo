import { useMemo, useState } from 'react';

// material-ui
import { Theme } from '@mui/material/styles';
import { Box, useMediaQuery } from '@mui/material';

// project import
// import Message from './Message';
import Profile from './Profile';
// import Notification from './Notification';
import MobileSection from './MobileSection';
import MegaMenuSection from './MegaMenuSection';

import useConfig from '../../../../hooks/useConfig';
import DrawerHeader from '../../Drawer/DrawerHeader';

// types
import { MenuOrientation } from '../../../../types/config';
import SearchProduct from '../../../../pages/products/components/SearchProduct.tsx';
import { getOrDefaultBranch } from '../../../../utils/helpers/conceptUtils.ts';

// ==============================|| HEADER - CONTENT ||============================== //

const HeaderContent = () => {
  const { menuOrientation } = useConfig();

  const downLG = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));

  const megaMenu = useMemo(() => <MegaMenuSection />, []);
  const [searchInputValue, setSearchInputValue] = useState('');

  return (
    <>
      {menuOrientation === MenuOrientation.HORIZONTAL && !downLG && (
        <DrawerHeader open={true} />
      )}
      {!downLG && (
        <SearchProduct
          disableLinkOpen={false}
          inputValue={searchInputValue}
          setInputValue={setSearchInputValue}
          showDeviceSearch={false}
          branch={getOrDefaultBranch()}
        />
      )}
      {/* {!downLG && megaMenu} */}
      {downLG && <Box sx={{ width: '100%', ml: 1 }} />}

      {/* <Notification /> */}
      {/* <Message /> */}
      {!downLG && <Profile />}
      {downLG && <MobileSection />}
    </>
  );
};

export default HeaderContent;
