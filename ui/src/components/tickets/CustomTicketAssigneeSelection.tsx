import { useState } from 'react';

import Gravatar from 'react-gravatar';

import {
  getDisplayName,
  getEmail,
  getGravatarUrl,
  mapUserToUserDetail,
} from '../../utils/helpers/userUtils.ts';
import { ListItemText, MenuItem, Tooltip } from '@mui/material';
import { Task } from '../../types/task.ts';
import { JiraUser } from '../../types/JiraUserResponse.ts';
import useTaskStore from '../../stores/TaskStore.ts';
import TasksServices from '../../api/TasksService.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Stack } from '@mui/system';
import { useSnackbar } from 'notistack';
import StyledSelect from '../styled/StyledSelect.tsx';
import GravatarWithTooltip from '../GravatarWithTooltip.tsx';
import useTicketStore from '../../stores/TicketStore.ts';
import { Ticket } from '../../types/tickets/ticket.ts';
import TicketsService from '../../api/TicketsService.ts';

interface CustomTaskAssigneeSelectionProps {
  id?: string;
  user?: string;
  userList: JiraUser[];
}
// const ITEM_HEIGHT = 100;
// const ITEM_PADDING_TOP = 8;
// const MenuProps = {
//   PaperProps: {
//     style: {
//       maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
//       width: 250,
//     },
//   },
// };

export default function CustomTicketAssigneeSelection({
  id,
  user,
  userList,
}: CustomTaskAssigneeSelectionProps) {
  const {getTicketById, mergeTickets} = useTicketStore();
  const [userName, setUserName] = useState<string>(user as string);
  const [disabled, setDisabled] = useState<boolean>(false);
  
  const updateAssignee = async (owner: string, ticketId: string) => {
    const ticket: Ticket | undefined = getTicketById(Number(ticketId));
    if(ticket === undefined) return;

    
    const assignee = mapUserToUserDetail(owner, userList);
    if(assignee?.username === undefined) return;

    ticket.assignee = assignee?.username;
    const returnedTask = await TicketsService.updateAssignee(
      ticket
    );
    mergeTickets(returnedTask);
    setDisabled(false);
  };

  const handleChange = (event: SelectChangeEvent<typeof userName>) => {
    setDisabled(true);
    const {
      target: { value },
    } = event;

    void updateAssignee(value, id as string);
      

    setUserName(
      // On autofill we get a stringified value.
      value,
    );
  };
  
  return (
    <Select
      value={userName !== null ? userName : ''}
      onChange={handleChange}
      sx={{ width: '100%' }}
      input={<StyledSelect />}
      disabled={disabled}
      renderValue={selected => (
        <GravatarWithTooltip username={selected} userList={userList} />
      )}
    //   MenuProps={MenuProps}
    >
      {userList.map(u => (
        <MenuItem
          key={u.name}
          value={u.name}
          onKeyDown={e => e.stopPropagation()}
        >
          <Stack direction="row" spacing={2}>
            {/* <Avatar url="/static/logo7.png" alt="food" /> */}
            <Gravatar
              //src={getGravatarUrl(u.name, userList)}
              email={getEmail(u.name, userList)}
              rating="pg"
              default="monsterid"
              style={{ borderRadius: '50px' }}
              size={30}
              className="CustomAvatar-image"
            />
            <ListItemText primary={u.displayName} />
          </Stack>
        </MenuItem>
      ))}
    </Select>
  );
}

