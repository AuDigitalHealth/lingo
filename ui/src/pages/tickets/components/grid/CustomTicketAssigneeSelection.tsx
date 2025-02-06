import { mapUserToUserDetail } from '../../../../utils/helpers/userUtils.ts';
import { FormHelperText, ListItemText, MenuItem } from '@mui/material';
import { JiraUser } from '../../../../types/JiraUserResponse.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Stack } from '@mui/system';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import AvatarWithTooltip from '../../../../components/AvatarWithTooltip.tsx';
import useTicketStore from '../../../../stores/TicketStore.ts';
import { Ticket } from '../../../../types/tickets/ticket.ts';
import { usePatchTicket } from '../../../../hooks/api/tickets/useUpdateTicket.tsx';

interface CustomTicketAssigneeSelectionProps {
  ticket?: Ticket;
  user?: string | null;
  userList: JiraUser[];
  outlined?: boolean;
  label?: boolean;
}

export default function CustomTicketAssigneeSelection({
  user,
  userList,
  outlined,
  label,
  ticket,
}: CustomTicketAssigneeSelectionProps) {
  const { mergeTicket } = useTicketStore();
  const patchTicketMutation = usePatchTicket();

  const updateAssignee = (owner: string) => {
    if (ticket === undefined) return;

    const assignee = mapUserToUserDetail(owner, userList);
    if (assignee?.username === undefined && owner !== 'unassign') return;

    ticket.assignee = owner === 'unassign' ? null : owner;

    patchTicketMutation.mutate(
      { updatedTicket: ticket, _clearCache: false },
      {
        onSuccess: data => {
          mergeTicket(data);
        },
      },
    );
  };

  const handleChange = (event: SelectChangeEvent<typeof user>) => {
    const {
      target: { value },
    } = event;
    if (value) {
      updateAssignee(value);
    }
  };

  const handleUnassign = () => {
    updateAssignee('unassign');
  };

  return (
    <>
      <Select
        labelId="assignee-select"
        value={ticket?.assignee ?? ''}
        onChange={handleChange}
        sx={{ width: '100%' }}
        input={outlined ? <Select /> : <StyledSelect />}
        disabled={patchTicketMutation.isPending}
        renderValue={selected => <AvatarWithTooltip username={selected} />}
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
              <AvatarWithTooltip username={u.name} />
              <ListItemText primary={u.displayName} />
            </Stack>
          </MenuItem>
        ))}
      </Select>
      {label && <FormHelperText>Assignee</FormHelperText>}
    </>
  );
}
