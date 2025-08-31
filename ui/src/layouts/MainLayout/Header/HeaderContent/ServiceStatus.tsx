/* eslint-disable */
import { useRef, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Badge,
  Box,
  ClickAwayListener,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Popper,
  Typography,
  useMediaQuery,
} from '@mui/material';

// project import
import MainCard from '../../../../components/MainCard';
import IconButton from '../../../../components/@extended/IconButton';
import Transitions from '../../../../components/@extended/Transitions';

// types
import { ThemeMode } from '../../../../types/config';
import {
  useOntoserverStatus,
  useServiceStatus,
} from '../../../../hooks/api/useServiceStatus';
import OntoserverIcon from '../../../../components/logo/OntoserverIcon';
import { CellTowerOutlined } from '@mui/icons-material';
import SnowstormIcon from '../../../../components/logo/SnowstormIcon';
import SnomedIcon from '../../../../components/logo/SnomedIcon';
import { styled } from '@mui/system';
import { DatabaseTwoTone } from '@ant-design/icons';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    //   backgroundColor: '#44b700',
    //   color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const actionSX = {
  mt: '6px',
  ml: 1,
  top: 'auto',
  right: 'auto',
  alignSelf: 'flex-start',

  transform: 'none',
};

// ==============================|| HEADER CONTENT - Service Status ||============================== //

const ServiceStatus = () => {
  const { serviceStatus } = useServiceStatus();
  const { ontoserverStatus } = useOntoserverStatus();
  const allRunning =
    serviceStatus?.snowstorm.running &&
    serviceStatus?.authoringPlatform.running &&
    ontoserverStatus?.running &&
    serviceStatus?.database.running;

  const codeSystemVersionsMatch =
    ontoserverStatus?.effectiveDate === serviceStatus?.snowstorm.effectiveDate;
  const warning = !serviceStatus?.cis.running;

  // Helper functions to generate failure messages
  const getFailureMessage = (
    serviceName: string,
    running?: boolean,
    effectiveDate?: string,
  ) => {
    if (!running) {
      switch (serviceName) {
        case 'Ontoserver':
          return 'Unable to connect to Ontoserver, authoring features are unavailable but ticket features will still function.';
        case 'Snowstorm':
          return 'Unable to connect to Snowstorm, authoring features are unavailable but ticket features will still function.';
        case 'Authoring Platform':
          return 'Unable to connect to the Authoring Platform. Authoring is not available but ticket features will still function.';
        case 'Component Identifier Service':
          return 'CIS is offline. Create and update operations will be slower but will function.';
        case 'Database':
          return 'Database connection failed, system will be unavailable until the database connection is restored.';
        default:
          return 'Service is currently unavailable. Please contact your system administrator.';
      }
    }
    return null;
  };

  const getVersionMismatchMessage = (
    ontoEffectiveDate?: string,
    snowstormEffectiveDate?: string,
  ) => {
    if (
      ontoEffectiveDate &&
      snowstormEffectiveDate &&
      ontoEffectiveDate !== snowstormEffectiveDate
    ) {
      return `Content mismatch may cause inconsistencies - Ontoserver (${ontoEffectiveDate}), Snowstorm (${snowstormEffectiveDate}).`;
    }
    return null;
  };

  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));

  const anchorRef = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const iconBackColorOpen =
    theme.palette.mode === ThemeMode.DARK ? 'grey.200' : 'grey.300';
  const iconBackColor =
    theme.palette.mode === ThemeMode.DARK ? 'background.default' : 'white';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <IconButton
        color="secondary"
        variant="light"
        sx={{
          color: 'text.primary',
          bgcolor: open ? iconBackColorOpen : iconBackColor,
        }}
        aria-label="open profile"
        ref={anchorRef}
        aria-controls={open ? 'profile-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <StyledBadge
          color={
            !allRunning
              ? 'error'
              : warning || !codeSystemVersionsMatch
                ? 'warning'
                : 'primary'
          }
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant={
            !allRunning || !codeSystemVersionsMatch || warning
              ? 'dot'
              : undefined
          }
        >
          <CellTowerOutlined fontSize="small" sx={{ color: 'text.primary' }} />
        </StyledBadge>
      </IconButton>
      <Popper
        placement={matchesXs ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [matchesXs ? -5 : 0, 9],
              },
            },
          ],
        }}
      >
        {({ TransitionProps }) => (
          <Transitions
            type="grow"
            position={matchesXs ? 'top' : 'top-right'}
            sx={{ overflow: 'hidden' }}
            in={open}
            {...TransitionProps}
          >
            <Paper
              sx={{
                boxShadow: theme.customShadows.z1,
                width: '100%',
                minWidth: 285,
                maxWidth: 420,
                [theme.breakpoints.down('md')]: {
                  maxWidth: 285,
                },
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  title="Service Status"
                  elevation={0}
                  border={false}
                  content={false}
                >
                  <List
                    component="nav"
                    sx={{
                      p: 0,
                      '& .MuiListItemButton-root': {
                        py: 0.5,
                        '&.Mui-selected': {
                          bgcolor: 'grey.50',
                          color: 'text.primary',
                        },
                      },
                    }}
                  >
                    <ListItem>
                      <BadgeAvatarWithStatus
                        icon={<OntoserverIcon width="30px" />}
                        running={
                          ontoserverStatus?.running &&
                          (!serviceStatus?.snowstorm.running ||
                            ontoserverStatus.effectiveDate ===
                              serviceStatus?.snowstorm.effectiveDate)
                        }
                        warning={
                          ontoserverStatus?.running &&
                          !(
                            !serviceStatus?.snowstorm.running ||
                            ontoserverStatus.effectiveDate ===
                              serviceStatus?.snowstorm.effectiveDate
                          )
                        }
                      />
                      <ServiceStatusListText
                        title="Ontoserver"
                        version={ontoserverStatus?.version}
                        running={ontoserverStatus?.running}
                        effectiveDate={ontoserverStatus?.effectiveDate}
                        failureMessage={
                          getFailureMessage(
                            'Ontoserver',
                            ontoserverStatus?.running,
                          ) ||
                          getVersionMismatchMessage(
                            ontoserverStatus?.effectiveDate,
                            serviceStatus?.snowstorm.effectiveDate,
                          )
                        }
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <BadgeAvatarWithStatus
                        icon={<SnowstormIcon width={'30px'} />}
                        running={
                          serviceStatus?.snowstorm.running &&
                          (!ontoserverStatus?.running ||
                            ontoserverStatus.effectiveDate ===
                              serviceStatus.snowstorm.effectiveDate)
                        }
                        warning={
                          serviceStatus?.snowstorm.running &&
                          !(
                            !ontoserverStatus?.running ||
                            ontoserverStatus.effectiveDate ===
                              serviceStatus.snowstorm.effectiveDate
                          )
                        }
                      />
                      <ServiceStatusListText
                        title="Snowstorm"
                        version={serviceStatus?.snowstorm.version}
                        running={serviceStatus?.snowstorm.running}
                        effectiveDate={serviceStatus?.snowstorm.effectiveDate}
                        failureMessage={
                          getFailureMessage(
                            'Snowstorm',
                            serviceStatus?.snowstorm.running,
                          ) ||
                          getVersionMismatchMessage(
                            ontoserverStatus?.effectiveDate,
                            serviceStatus?.snowstorm.effectiveDate,
                          )
                        }
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <BadgeAvatarWithStatus
                        icon={<SnomedIcon width={'30px'} />}
                        running={serviceStatus?.authoringPlatform.running}
                      />
                      <ServiceStatusListText
                        title="Authoring Platform"
                        version={serviceStatus?.authoringPlatform.version}
                        running={serviceStatus?.authoringPlatform.running}
                        failureMessage={getFailureMessage(
                          'Authoring Platform',
                          serviceStatus?.authoringPlatform.running,
                        )}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <BadgeAvatarWithStatus
                        icon={<SnomedIcon width={'30px'} />}
                        running={serviceStatus?.cis.running}
                        warning={true}
                      />
                      <ServiceStatusListText
                        title="Component Identifier Service"
                        version={serviceStatus?.cis.version}
                        running={serviceStatus?.cis.running}
                        failureMessage={getFailureMessage(
                          'Component Identifier Service',
                          serviceStatus?.cis.running,
                        )}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <BadgeAvatarWithStatus
                        icon={<DatabaseTwoTone width={'30px'} />}
                        running={serviceStatus?.database.running}
                      />
                      <ServiceStatusListText
                        title="Database"
                        version={serviceStatus?.database.version}
                        running={serviceStatus?.database.running}
                        failureMessage={getFailureMessage(
                          'Database',
                          serviceStatus?.database.running,
                        )}
                      />
                    </ListItem>
                    <Divider />
                  </List>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
};

interface BadgeAvatarWithStatusProps {
  icon: React.ReactNode;
  running?: boolean;
  warning?: boolean;
}

const BadgeAvatarWithStatus = ({
  icon,
  running,
  warning,
}: BadgeAvatarWithStatusProps) => {
  return (
    <ListItemAvatar>
      <StyledBadge
        color={running ? 'success' : warning ? 'warning' : 'error'}
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
      >
        <Avatar
          sx={{
            color: 'none',
            bgcolor: 'white',
          }}
        >
          {icon}
        </Avatar>
      </StyledBadge>
    </ListItemAvatar>
  );
};

interface ServiceStatusListTextProps {
  title: string;
  running?: boolean;
  version?: string;
  effectiveDate?: string;
  failureMessage?: string;
}

const ServiceStatusListText = ({
  title,
  running,
  version,
  effectiveDate,
  failureMessage,
}: ServiceStatusListTextProps) => {
  return (
    <ListItemText
      primary={
        <Typography variant="h6">
          <Typography component="span" variant="subtitle1">
            {title}
          </Typography>{' '}
          {running ? 'online' : 'offline'}
        </Typography>
      }
      secondary={
        <>
          <Typography component="span" display="block">
            Version: {version}
          </Typography>
          {effectiveDate && (
            <Typography component="span" display="block">
              Release: {effectiveDate}
            </Typography>
          )}
          {failureMessage && (
            <Typography
              component="span"
              display="block"
              sx={{
                mt: 0.5,
                color: 'error.main',
                fontStyle: 'italic',
                fontSize: '0.875rem',
              }}
            >
              {failureMessage}
            </Typography>
          )}
        </>
      }
    />
  );
};

export default ServiceStatus;
