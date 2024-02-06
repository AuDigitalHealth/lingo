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
        >
          <ListItemIcon>
            <QuestionCircleOutlined />
          </ListItemIcon>
          <ListItemText primary="Edit Labels" />
        </ListItemButton>
      </Link>
    </List>
  );
};

export default SystemSettingsTab;
