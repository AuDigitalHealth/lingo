/* eslint-disable */
import { useRef, useState, ReactNode, SyntheticEvent, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  ButtonBase,
  CardContent,
  ClickAwayListener,
  Paper,
  Popper,
  Stack,
} from '@mui/material';
import MainCard from '../../../../../components/MainCard';
import Transitions from '../../../../../components/@extended/Transitions';
import { InfoCircleOutlined } from '@ant-design/icons';
import { ThemeMode } from '../../../../../types/config';
import useUserStore from '../../../../../stores/UserStore';

const AboutBox = () => {
  const theme = useTheme();
  const user = useUserStore();
  const navigate = useNavigate();

  const [buildNumber, setBuildNumber] = useState('');
  useEffect(() => {
    // Fetch the build number from the text file
    fetch('/buildnumber.txt')
      .then(response => {
        if (!response.ok) {
          console.error('Error fetching build number from file');
          return null;
        }
        return response.text();
      })
      .then(text => {
        // Update the state with the fetched build number
        if (text) {
          setBuildNumber(text);
        }
      })
      .catch(error => {
        console.error(
          'Error fetching build number, network error occured:',
          error,
        );
      });
  }, []); // Empty dependency array to run only once

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

  const [value, setValue] = useState(0);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const iconBackColorOpen =
    theme.palette.mode === ThemeMode.DARK ? 'grey.200' : 'grey.300';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <ButtonBase
        sx={{
          p: 0,
          bgcolor: open ? iconBackColorOpen : 'transparent',
          borderRadius: 1,
          fontSize: '1.5em',
          '&:hover': {
            bgcolor:
              theme.palette.mode === ThemeMode.DARK
                ? 'secondary.light'
                : 'secondary.lighter',
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.secondary.dark}`,
            outlineOffset: 2,
          },
        }}
        aria-label={`aboutbox`}
        ref={anchorRef}
        aria-controls={open ? 'profile-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 1 }}>
          <InfoCircleOutlined />
        </Stack>
      </ButtonBase>
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
                  <CardContent sx={{ px: 2.5, pt: 3, alignContent: 'center' }}>
                    Snomio build number: {buildNumber}
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
