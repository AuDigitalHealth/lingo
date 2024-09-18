import { Badge, Box, useTheme } from '@mui/material';

import IconButton from '../../../../components/@extended/IconButton';
import { ThemeMode } from '../../../../types/config';
import { Link } from 'react-router-dom';
import { useJobResults } from '../../../../hooks/api/useJobResults';
import { Notifications } from '@mui/icons-material';

export default function JobResultsIcon() {
  const theme = useTheme();

  const iconBackColor =
    theme.palette.mode === ThemeMode.DARK ? 'background.default' : 'white';

  const jobResults = useJobResults();

  const unacknowledged = jobResults.data?.filter(jr => {
    return !jr.acknowledged;
  }).length;

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <Link to={'/dashboard/jobs'}>
        <IconButton
          color="secondary"
          variant="light"
          sx={{
            color: 'text.primary',
            bgcolor: iconBackColor,
          }}
          aria-label="view job results"
          aria-haspopup="false"
        >
          <Badge badgeContent={unacknowledged} color="error">
            <Notifications fontSize="small" sx={{ color: 'text.primary' }} />
          </Badge>
        </IconButton>
      </Link>
    </Box>
  );
}
