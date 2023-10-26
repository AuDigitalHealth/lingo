import { useState } from 'react';

import { mapUserToUserDetail } from '../../../../utils/helpers/userUtils.ts';
import { FormHelperText, ListItemText, MenuItem } from '@mui/material';
import { JiraUser } from '../../../../types/JiraUserResponse.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Stack } from '@mui/system';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import GravatarWithTooltip from '../../../../components/GravatarWithTooltip.tsx';
import useTicketStore from '../../../../stores/TicketStore.ts';
import { Ticket } from '../../../../types/tickets/ticket.ts';
import TicketsService from '../../../../api/TicketsService.ts';

interface CustomTicketAssigneeSelectionProps {
  id?: string;
  user?: string;
  userList: JiraUser[];
  outlined?: boolean;
  label?: boolean;
}

export default function CustomTicketAssigneeSelection({
  id,
  user,
  userList,
  outlined,
  label,
}: CustomTicketAssigneeSelectionProps) {
  const { getTicketById, mergeTickets } = useTicketStore();
  const [userName, setUserName] = useState<string>(user as string);
  const [disabled, setDisabled] = useState<boolean>(false);

  const updateAssignee = async (owner: string, ticketId: string) => {
    const ticket: Ticket | undefined = getTicketById(Number(ticketId));
    if (ticket === undefined) return;

    const assignee = mapUserToUserDetail(owner, userList);
    if (assignee?.username === undefined && owner !== 'unassign') return;

    ticket.assignee = assignee?.username ? assignee?.username : 'unassign';
    const returnedTask = await TicketsService.updateAssignee(ticket);
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
      value === 'unassign' ? '' : value,
    );
  };

  return (
    <>
      <Select
        labelId="assignee-select"
        value={userName !== null ? userName : ''}
        onChange={handleChange}
        sx={{ width: '100%' }}
        input={outlined ? <Select /> : <StyledSelect />}
        disabled={disabled}
        renderValue={selected => (
          <GravatarWithTooltip username={selected} userList={userList} />
        )}
        //   MenuProps={MenuProps}
      >
        <MenuItem
          value=""
          onClick={() => {
            setUserName('unassign');
            setDisabled(true);
            void updateAssignee('unassign', id as string);
          }}
        >
          <em>&#8205;</em>
        </MenuItem>
        {userList.map(u => (
          <MenuItem
            key={u.name}
            value={u.name}
            onKeyDown={e => e.stopPropagation()}
          >
            <Stack direction="row" spacing={2}>
              <GravatarWithTooltip username={u.name} userList={userList} />
              <ListItemText primary={u.displayName} />
            </Stack>
          </MenuItem>
        ))}
      </Select>
      {label && <FormHelperText>Assignee</FormHelperText>}
    </>
  );
}
