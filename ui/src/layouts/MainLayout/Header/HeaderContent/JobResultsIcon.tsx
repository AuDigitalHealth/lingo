import { Badge, Box, useTheme } from '@mui/material';

import { Construction } from '@mui/icons-material';
import IconButton from '../../../../components/@extended/IconButton';
import { useRef } from 'react';
import { ThemeMode } from '../../../../types/config';
import { Link } from 'react-router-dom';
import { useJobResults } from '../../../../hooks/api/useJobResults';

export default function JobResultsIcon() {
  const anchorRef = useRef<any>(null);

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
          aria-label="open profile"
          ref={anchorRef}
          aria-haspopup="true"
        >
          <Badge badgeContent={unacknowledged} color="error">
            <Construction fontSize="small" sx={{ color: 'text.primary' }} />
          </Badge>
        </IconButton>
      </Link>
    </Box>
  );
}
