/* eslint-disable */
import { useRef, useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  CardContent,
  ClickAwayListener,
  Paper,
  Popper,
  Stack,
  Typography,
} from '@mui/material';
import MainCard from '../../../../../components/MainCard';
import Transitions from '../../../../../components/@extended/Transitions';
import { ThemeMode } from '../../../../../types/config';
import IconButton from '../../../../../components/@extended/IconButton';
import { InfoOutlined } from '@mui/icons-material';
import useApplicationConfigStore from '../../../../../stores/ApplicationConfigStore.ts';
import { useFetchReleaseVersion } from '../../../../../hooks/api/useInitializeConfig.tsx';

const AboutBox = () => {
  const theme = useTheme();

  const [buildNumber, setBuildNumber] = useState('');
  const { applicationConfig, getEnvironmentColor } =
    useApplicationConfigStore();
  const { releaseVersion } = useFetchReleaseVersion();

  useEffect(() => {
    if (releaseVersion) {
      setBuildNumber(releaseVersion);
    }
  }, [releaseVersion]);

  const anchorRef = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current?.contains(event.target)) {
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
        <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 1 }}>
          <InfoOutlined fontSize="small" />
        </Stack>
      </IconButton>
      <Popper
        placement="bottom-end"
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
                offset: [0, 9],
              },
            },
          ],
        }}
      >
        {({ TransitionProps }) => (
          <Transitions
            type="grow"
            position="top-right"
            in={open}
            {...TransitionProps}
          >
            <Paper
              sx={{
                boxShadow: theme.customShadows.z1,
                width: 290,
                minWidth: 240,
                maxWidth: 290,
                [theme.breakpoints.down('md')]: {
                  maxWidth: 250,
                },
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false} content={false}>
                  <CardContent
                    sx={{ px: 2.5, pt: 3, alignItems: 'flex-start' }}
                  >
                    <Typography
                      color={getEnvironmentColor()}
                      sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                    >
                      {applicationConfig.appEnvironment.toUpperCase()}
                    </Typography>
                    <Typography variant="body1">
                      Lingo build number: {buildNumber}
                    </Typography>
                  </CardContent>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
};

export default AboutBox;
