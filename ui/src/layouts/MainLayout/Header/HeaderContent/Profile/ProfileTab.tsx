import { useState } from 'react';

// material-ui
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

// assets
import {
  // EditOutlined,
  // ProfileOutlined,
  LogoutOutlined,
  // UserOutlined,
  // WalletOutlined,
} from '@ant-design/icons';

// ==============================|| HEADER PROFILE - PROFILE TAB ||============================== //

interface Props {
  handleLogout: () => void;
}

const ProfileTab = ({ handleLogout }: Props) => {
  const [selectedIndex] = useState(0);

  return (
    <List
      component="nav"
      sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}
    >
      <ListItemButton
        selected={selectedIndex === 2}
        onClick={handleLogout}
        data-testid="profile-card-profile-tab-logout"
      >
        <ListItemIcon>
          <LogoutOutlined />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItemButton>
    </List>
  );
};

export default ProfileTab;
