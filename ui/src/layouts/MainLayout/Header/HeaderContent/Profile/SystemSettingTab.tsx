import { useState } from 'react';

// material-ui
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

// assets
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

// ==============================|| HEADER PROFILE - SETTING TAB ||============================== //

const SystemSettingsTab = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement>,
    index: number,
  ) => {
    setSelectedIndex(index);
  };

  return (
    <List
      component="nav"
      sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}
    >
      <Link
        to={'/dashboard/settings/label'}
        style={{ textDecoration: 'none', color: 'inherit' }}
        key={'settings-label'}
      >
        <ListItemButton
          selected={selectedIndex === 0}
          onClick={(event: React.MouseEvent<HTMLDivElement>) =>
            handleListItemClick(event, 0)
          }
          data-testid="profile-card-settings-tab-labels"
        >
          <ListItemIcon>
            <QuestionCircleOutlined />
          </ListItemIcon>
          <ListItemText primary="Edit Labels" />
        </ListItemButton>
      </Link>
      <Link
        to={'/dashboard/settings/release'}
        style={{ textDecoration: 'none', color: 'inherit' }}
        key={'settings-release'}
      >
        <ListItemButton
          data-testid="profile-card-settings-tab-releases"
          selected={selectedIndex === 1}
          onClick={(event: React.MouseEvent<HTMLDivElement>) =>
            handleListItemClick(event, 1)
          }
        >
          <ListItemIcon>
            <QuestionCircleOutlined />
          </ListItemIcon>
          <ListItemText primary="Edit Releases" />
        </ListItemButton>
      </Link>
      <Link
        to={'/dashboard/settings/externalRequestors'}
        style={{ textDecoration: 'none', color: 'inherit' }}
        key={'settings-external-requestors'}
      >
        <ListItemButton
          selected={selectedIndex === 2}
          onClick={(event: React.MouseEvent<HTMLDivElement>) =>
            handleListItemClick(event, 2)
          }
          data-testid="profile-card-settings-tab-external-requestors"
        >
          <ListItemIcon>
            <QuestionCircleOutlined />
          </ListItemIcon>
          <ListItemText primary="Edit External Requesters" />
        </ListItemButton>
      </Link>
    </List>
  );
};

export default SystemSettingsTab;
