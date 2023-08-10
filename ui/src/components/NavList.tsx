import { ReactNode, useEffect, useState } from 'react';

import { Link, useLocation } from 'react-router-dom';

import DrawerHeader from './DrawerHeader';

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MuiDrawer from '@mui/material/Drawer';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

interface NavItem {
  title: string;
  icon: ReactNode;
  href: string;
  index: number;
}

const items: NavItem[] = [
  {
    title: 'Dashboard',
    icon: <HomeIcon />,
    href: '/dashboard',
    index: 0,
  },
  {
    title: 'Tasks',
    icon: <AssignmentIcon />,
    href: '/dashboard/tasks/all',
    index: 1,
  },
  {
    title: 'My Tasks',
    icon: <AssignmentIndIcon />,
    href: '/dashboard/tasks',
    index: 2,
  },
];

interface NavListProps {
  open: boolean;
  toggleDrawerOpen: () => void;
}

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: prop => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

function NavList({ open, toggleDrawerOpen }: NavListProps) {
  const theme = useTheme();
  const url = useLocation();
  const [active, setActive] = useState(0);

  // a naive solution, i'm not sure how to handle this in the long run when there's a lot of routes
  // need some thunking
  useEffect(() => {
    items.forEach(item => {
      console.log(url.pathname);
      if (url.pathname.startsWith(item.href)) {
        setActive(item.index);
      }
    });
  }, [url]);

  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader>
        <IconButton onClick={toggleDrawerOpen}>
          {theme.direction === 'rtl' ? (
            <ChevronRightIcon />
          ) : (
            <ChevronLeftIcon />
          )}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {items.map((item: NavItem, index) => (
          <Link
            to={item.href}
            key={item.title}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
                selected={index === active}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                  {/* {index % 2 === 0 ? item.icon : item.icon} */}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  sx={{ opacity: open ? 1 : 0 }}
                />
              </ListItemButton>
            </ListItem>
          </Link>
        ))}
      </List>
    </Drawer>
  );
}

export default NavList;
