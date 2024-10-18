import { forwardRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import { Link } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Chip,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';

// project import
import Dot from '../../../../../components/@extended/Dot';
import useConfig from '../../../../../hooks/useConfig';
import useLayoutStore from '../../../../../stores/LayoutStore';

// types
import { LinkTarget, NavItemType } from '../../../../../types/menu';
import { MenuOrientation, ThemeMode } from '../../../../../types/config';
import AuthoringPlatformLink from '../../../../../components/AuthoringPlatformLink';

// ==============================|| NAVIGATION - LIST ITEM ||============================== //

interface Props {
  item: NavItemType;
  level: number;
  title?: string;
}

const NavItem = ({ item, level, title }: Props) => {
  const theme = useTheme();
  const { drawerOpen, openDrawer, openItem } = useLayoutStore();
  const matchDownLg = useMediaQuery(theme.breakpoints.down('lg'));

  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { menuOrientation } = useConfig();
  let itemTarget: LinkTarget = '_self';
  if (item.target) {
    itemTarget = '_blank';
  }

  let listItemProps: {
    component:
      | ForwardRefExoticComponent<RefAttributes<HTMLAnchorElement>>
      | string;
    href?: string;
    target?: LinkTarget;
  } = {
    component: forwardRef((props, ref) =>
      item.component === AuthoringPlatformLink ? (
        <AuthoringPlatformLink
          id={title}
          to={item.url!}
          target={itemTarget}
          ref={ref}
          ariaLabel={title}
          {...props}
        />
      ) : (
        <Link
          id={title}
          {...props}
          to={item.url!}
          target={itemTarget}
          ref={ref}
          aria-label={title}
        />
      ),
    ),
  };
  if (item?.external) {
    listItemProps = { component: 'a', href: item.url, target: itemTarget };
  }

  const itemIcon = item.icon ? (
    <span className="material-symbols-outlined">{item.icon}</span>
  ) : (
    false
  );

  const isSelected = openItem.findIndex(id => id === item.id) > -1;

  const textColor =
    theme.palette.mode === ThemeMode.DARK ? 'grey.400' : 'text.primary';
  const iconSelectedColor =
    theme.palette.mode === ThemeMode.DARK && drawerOpen
      ? 'text.primary'
      : 'primary.main';

  return (
    <>
      <li>
        {menuOrientation === MenuOrientation.VERTICAL || downLG ? (
          <Tooltip title={item.tooltip} placement="right">
            <ListItemButton
              {...listItemProps}
              disabled={item.disabled}
              selected={isSelected}
              sx={{
                zIndex: 1201,
                pl: drawerOpen ? `${level * 28}px` : 1.5,
                py: !drawerOpen && level === 1 ? 1.25 : 1,
                ...(drawerOpen && {
                  '&:hover': {
                    bgcolor:
                      theme.palette.mode === ThemeMode.DARK
                        ? 'divider'
                        : 'primary.lighter',
                  },
                  '&.Mui-selected': {
                    bgcolor:
                      theme.palette.mode === ThemeMode.DARK
                        ? 'divider'
                        : 'primary.lighter',
                    borderRight: `2px solid ${theme.palette.primary.main}`,
                    color: iconSelectedColor,
                    '&:hover': {
                      color: iconSelectedColor,
                      bgcolor:
                        theme.palette.mode === ThemeMode.DARK
                          ? 'divider'
                          : 'primary.lighter',
                    },
                  },
                }),
                ...(!drawerOpen && {
                  '&:hover': {
                    bgcolor: 'transparent',
                  },
                  '&.Mui-selected': {
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                    bgcolor: 'transparent',
                  },
                }),
              }}
              {...(matchDownLg && {
                onClick: () => {
                  openDrawer(false);
                },
              })}
            >
              {itemIcon && (
                <ListItemIcon
                  sx={{
                    minWidth: 28,
                    color: isSelected ? iconSelectedColor : textColor,
                    ...(!drawerOpen && {
                      borderRadius: 1.5,
                      width: 36,
                      height: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        bgcolor:
                          theme.palette.mode === ThemeMode.DARK
                            ? 'secondary.light'
                            : 'secondary.lighter',
                      },
                    }),
                    ...(!drawerOpen &&
                      isSelected && {
                        bgcolor:
                          theme.palette.mode === ThemeMode.DARK
                            ? 'primary.900'
                            : 'primary.lighter',
                        '&:hover': {
                          bgcolor:
                            theme.palette.mode === ThemeMode.DARK
                              ? 'primary.darker'
                              : 'primary.lighter',
                        },
                      }),
                  }}
                >
                  {itemIcon}
                </ListItemIcon>
              )}
              {(drawerOpen || (!drawerOpen && level !== 1)) && (
                <ListItemText
                  primary={
                    <Typography
                      variant="h6"
                      sx={{ color: isSelected ? iconSelectedColor : textColor }}
                    >
                      {item.title}
                    </Typography>
                  }
                />
              )}
              {(drawerOpen || (!drawerOpen && level !== 1)) && item.chip && (
                <Chip
                  color={item.chip.color}
                  variant={item.chip.variant}
                  size={item.chip.size}
                  label={item.chip.label}
                  avatar={
                    item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>
                  }
                />
              )}
            </ListItemButton>
          </Tooltip>
        ) : (
          <ListItemButton
            {...listItemProps}
            disabled={item.disabled}
            selected={isSelected}
            sx={{
              zIndex: 1201,
              ...(drawerOpen && {
                '&:hover': {
                  bgcolor: 'transparent',
                },
                '&.Mui-selected': {
                  bgcolor: 'transparent',
                  color: iconSelectedColor,
                  '&:hover': {
                    color: iconSelectedColor,
                    bgcolor: 'transparent',
                  },
                },
              }),
              ...(!drawerOpen && {
                '&:hover': {
                  bgcolor: 'transparent',
                },
                '&.Mui-selected': {
                  '&:hover': {
                    bgcolor: 'transparent',
                  },
                  bgcolor: 'transparent',
                },
              }),
            }}
          >
            {itemIcon && (
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  ...(!drawerOpen && {
                    borderRadius: 1.5,
                    width: 36,
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }),
                  ...(!drawerOpen &&
                    isSelected && {
                      bgcolor: 'transparent',
                      '&:hover': {
                        bgcolor: 'transparent',
                      },
                    }),
                }}
              >
                {itemIcon}
              </ListItemIcon>
            )}

            {!itemIcon && (
              <ListItemIcon
                sx={{
                  color: isSelected ? 'primary.main' : 'secondary.main',
                  ...(!drawerOpen && {
                    borderRadius: 1.5,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }),
                  ...(!drawerOpen &&
                    isSelected && {
                      bgcolor: 'transparent',
                      '&:hover': {
                        bgcolor: 'transparent',
                      },
                    }),
                }}
              >
                <Dot size={4} color={isSelected ? 'primary' : 'secondary'} />
              </ListItemIcon>
            )}
            <ListItemText
              primary={
                <Typography variant="h6" color="inherit">
                  {item.title}
                </Typography>
              }
            />
            {(drawerOpen || (!drawerOpen && level !== 1)) && item.chip && (
              <Chip
                color={item.chip.color}
                variant={item.chip.variant}
                size={item.chip.size}
                label={item.chip.label}
                avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
              />
            )}
          </ListItemButton>
        )}
      </li>
    </>
  );
};

export default NavItem;
