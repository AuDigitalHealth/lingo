import Gravatar from 'react-gravatar';

import {
  getDisplayName,
  getGravatarMd5FromUsername,
} from '../utils/helpers/userUtils.ts';
import { Tooltip, Typography, useTheme } from '@mui/material';

import { JiraUser } from '../types/JiraUserResponse.ts';
import { CSSObject, Stack } from '@mui/system';

interface GravatarWithTooltipProps {
  username: string | undefined;
  userList: JiraUser[];
  useFallback?: boolean;
  size?: number;
  sx?: CSSObject;
}
function GravatarWithTooltip({
  username,
  userList,
  size,
  sx,
  useFallback,
}: GravatarWithTooltipProps) {
  const theme = useTheme();
  console.log(username);
  let returnItem = username !== undefined && username !== null && username !== 'system' && (
    <Stack gap={1} direction="row" flexWrap="wrap" sx={{ ...sx }}>
      <Tooltip title={getDisplayName(username, userList)} key={username}>
        <Stack direction="row" spacing={1}>
          <Gravatar
            md5={getGravatarMd5FromUsername(username, userList)}
            rating="pg"
            default="monsterid"
            style={{ borderRadius: '50px' }}
            size={size ? size : 30}
            className="CustomAvatar-image"
            key={username}
          />
        </Stack>
      </Tooltip>
    </Stack>
  );

  if (returnItem !== false) return returnItem;
  if (useFallback) {
    returnItem = (
      <Stack gap={1} direction="row" flexWrap="wrap" sx={{ ...sx }}>
        <Tooltip title="MissingNo." key={username}>
          <Stack direction="row" spacing={1}>
            <div
              style={{
                backgroundColor: theme.palette.warning.light,
                position: 'relative',
                width: size ? size : 30,
                height: size ? size : 30,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  fontSize: '1em',
                  position: 'absolute',
                  fontFamily: 'sans-serif',
                  userSelect: 'none',
                }}
              >
                <Typography variant="h4">?</Typography>
              </div>
            </div>
          </Stack>
        </Tooltip>
      </Stack>
    );
    return returnItem;
  }
  return <>{username}</>;
}

export default GravatarWithTooltip;
