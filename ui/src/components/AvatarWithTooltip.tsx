import {
  getDisplayName,
  getInitials,
  stringToColor,
} from '../utils/helpers/userUtils.ts';
import { SxProps, Tooltip } from '@mui/material';

import { Stack } from '@mui/material';
import { useJiraUsers } from '../hooks/api/useInitializeJiraUsers.tsx';
import Avatar from './@extended/Avatar.tsx';
import { SizeProps } from '../types/extended.ts';

interface AvatarWithTooltipProps {
  username?: string | null;
  size?: SizeProps;
  sx?: SxProps;
}

function AvatarWithTooltip({ username, size, sx }: AvatarWithTooltipProps) {
  const { jiraUsers } = useJiraUsers();
  return (
    <Stack gap={1} direction="row" flexWrap="wrap" sx={{ ...sx }}>
      <Tooltip title={getDisplayName(username, jiraUsers)} key={username}>
        <Stack direction="row" spacing={1}>
          <Avatar
            color={stringToColor(getDisplayName(username, jiraUsers))}
            style={{ borderRadius: '50px' }}
            size={size ? size : 'md'}
            className="CustomAvatar-image"
            key={username}
          >
            {getInitials(getDisplayName(username, jiraUsers))}
          </Avatar>
        </Stack>
      </Tooltip>
    </Stack>
  );
}

export default AvatarWithTooltip;
