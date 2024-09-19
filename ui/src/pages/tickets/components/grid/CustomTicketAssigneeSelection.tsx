import { useEffect } from 'react';

import { mapUserToUserDetail } from '../../../../utils/helpers/userUtils.ts';
import { FormHelperText, ListItemText, MenuItem } from '@mui/material';
import { JiraUser } from '../../../../types/JiraUserResponse.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Stack } from '@mui/system';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import GravatarWithTooltip from '../../../../components/GravatarWithTooltip.tsx';
import useTicketStore from '../../../../stores/TicketStore.ts';
import { Ticket } from '../../../../types/tickets/ticket.ts';
import { usePatchTicket } from '../../../../hooks/api/tickets/useUpdateTicket.tsx';

interface CustomTicketAssigneeSelectionProps {
  ticket?: Ticket;
  id?: string;
  user?: string | null;
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
  const { getTicketById, mergeTicket } = useTicketStore();

  const patchTicketMutation = usePatchTicket();

  useEffect(() => {
    if (patchTicketMutation.data) {
      mergeTicket(patchTicketMutation.data);
    }
  }, [patchTicketMutation.data]);

  const updateAssignee = (owner: string, ticketId: string) => {
    const ticket: Ticket | undefined = getTicketById(Number(ticketId));
    if (ticket === undefined) return;

    const assignee = mapUserToUserDetail(owner, userList);
    if (assignee?.username === undefined && owner !== 'unassign') return;

    ticket.assignee = owner === 'unassign' ? null : owner;

    patchTicketMutation.mutate({ updatedTicket: ticket, clearCache: false });
  };

  const handleChange = (event: SelectChangeEvent<typeof user>) => {
    const {
      target: { value },
    } = event;
    if (value) {
      updateAssignee(value, id as string);
    }
  };

  const handleUnassign = () => {
    updateAssignee('unassign', id as string);
  };

  return (
    <>
      <Select
        labelId="assignee-select"
        value={user !== null ? user : ''}
        onChange={handleChange}
        sx={{ width: '100%' }}
        input={outlined ? <Select /> : <StyledSelect />}
        disabled={patchTicketMutation.isPending}
        renderValue={selected => <GravatarWithTooltip username={selected} />}
      >
        <MenuItem value="" onClick={handleUnassign}>
          <em>&#8205;</em>
        </MenuItem>
        {userList.map(u => (
          <MenuItem
            key={u.name}
            value={u.name}
            onKeyDown={e => e.stopPropagation()}
          >
            <Stack direction="row" spacing={2}>
              <GravatarWithTooltip username={u.name} />
              <ListItemText primary={u.displayName} />
            </Stack>
          </MenuItem>
        ))}
      </Select>
      {label && <FormHelperText>Assignee</FormHelperText>}
    </>
  );
}
