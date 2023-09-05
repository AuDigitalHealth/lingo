import Gravatar from 'react-gravatar';

import { getDisplayName, getEmail } from '../utils/helpers/userUtils.ts';
import { Tooltip } from '@mui/material';

import { JiraUser } from '../types/JiraUserResponse.ts';
import { Stack } from '@mui/system';

interface GravatarWithTooltipProps {
  username: string | undefined;
  userList: JiraUser[];
}
function GravatarWithTooltip({ username, userList }: GravatarWithTooltipProps) {
  return (
    <>
      {username !== undefined && (
        <Stack gap={1} direction="row" flexWrap="wrap">
          <Tooltip title={getDisplayName(username, userList)} key={username}>
            <Stack direction="row" spacing={1}>
              <Gravatar
                //src={getGravatarUrl(selected, userList)}
                email={getEmail(username, userList)}
                //email={selected}
                rating="pg"
                default="monsterid"
                style={{ borderRadius: '50px' }}
                size={30}
                className="CustomAvatar-image"
                key={username}
              />
            </Stack>
          </Tooltip>
          {/* {username} */}
        </Stack>
      )}
    </>
  );
}

export default GravatarWithTooltip;
