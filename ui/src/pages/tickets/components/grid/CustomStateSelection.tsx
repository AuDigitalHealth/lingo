import { useState } from 'react';

import { Chip, MenuItem, SxProps, Tooltip } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import { State, Ticket, TicketDto } from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import { useQueryClient } from '@tanstack/react-query';

interface CustomStateSelectionProps {
  id?: string;
  state?: State | undefined | null;
  stateList: State[];
  border?: boolean;
  ticket?: TicketDto | Ticket;
  refreshCache?: boolean;
}

export default function CustomStateSelection({
  id,
  state,
  stateList,
  border,
  ticket,
  refreshCache = false,
}: CustomStateSelectionProps) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets } = useTicketStore();
  const [stateItem, setStateItem] = useState<State | undefined | null>(state);
  const queryClient = useQueryClient();

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newState = getStateValue(event.target.value);
    if (ticket !== undefined && newState !== undefined) {
      TicketsService.updateTicketState(ticket, newState.id)
        .then(updatedTicket => {
          setStateItem(newState);
          mergeTickets(updatedTicket);
          setDisabled(false);
          if (refreshCache === true) {
            void queryClient.invalidateQueries(['ticket', id]);
          }
        })
        .catch(() => {
          setDisabled(false);
        });
    }
  };

  const getStateValue = (label: string) => {
    const state: State | undefined = stateList.find(state => {
      return state.label === label;
    });
    return state;
  };

  const handleDelete = () => {
    setDisabled(true);

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined) {
      TicketsService.deleteTicketState(ticket)
        .then(() => {
          ticket.state = null;
          mergeTickets(ticket);
          setDisabled(false);
        })
        .catch(() => {
          setDisabled(false);
        });
    }
  };

  return (
    <Select
      id={`ticket-state-select-${id}`}
      value={stateItem?.label ? stateItem?.label : ''}
      onChange={handleChange}
      sx={{ width: '100%', maxWidth: '200px' }}
      input={border ? <Select /> : <StyledSelect />}
      disabled={disabled}
      MenuProps={{
        PaperProps: {
          id: `ticket-state-select-${id}-container`,
        },
      }}
    >
      <MenuItem value="" onClick={handleDelete}>
        <em>&#8205;</em>
      </MenuItem>
      {stateList.map(localState => (
        <MenuItem
          key={localState.id}
          value={localState.label}
          onKeyDown={e => e.stopPropagation()}
        >
          <StateItemDisplay localState={localState} />
        </MenuItem>
      ))}
    </Select>
  );
}

interface StateItemDisplayProps {
  localState: State;
  sx?: SxProps;
}

export function StateItemDisplay({ localState, sx }: StateItemDisplayProps) {
  return (
    <Tooltip title={localState.label} key={localState.id} sx={{ ...sx }}>
      <Chip
        color={'primary'}
        label={localState.label}
        size="small"
        sx={{ color: 'white', ...sx }}
      />
    </Tooltip>
  );
}
