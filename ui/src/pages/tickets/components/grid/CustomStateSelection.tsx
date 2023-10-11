import { useRef, useState } from 'react';

import { Chip, MenuItem, Tooltip } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import { State } from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';

interface CustomStateSelectionProps {
  id?: string;
  state?: State;
  stateList: State[];
  border?: boolean;
}

export default function CustomStateSelection({
  id,
  state,
  stateList,
  border
}: CustomStateSelectionProps) {
  const [stateValue, setStateValue] = useState<State | null>(
    state ? state : null,
  );
  const previousState = useRef<State | null>(
    state ? state : null,
  );
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets } = useTicketStore();

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newState = getStateValue(event.target.value);

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined && newState !== undefined) {
      setStateValue(newState);
      ticket.state.id = newState.id;
      TicketsService.updateTicketState(ticket)
        .then(updatedTicket => {
          mergeTickets(updatedTicket);
          setDisabled(false);
        })
        .catch(() => {
          setStateValue(previousState.current);
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

  return (
    <Select
      value={stateValue?.label ? stateValue?.label : ''}
      onChange={handleChange}
      sx={{ width: border ? 'auto' : '100%' }}
      input={border ? <Select /> :<StyledSelect />}
      disabled={disabled}
    >
      {stateList.map(state => (
        <MenuItem
          key={state.id}
          value={state.label}
          onKeyDown={e => e.stopPropagation()}
        >
          <Tooltip title={state.label} key={state.id}>
            <Chip
              color={'primary'}
              label={state.label}
              size="small"
              sx={{ color: 'white' }}
            />
          </Tooltip>
        </MenuItem>
      ))}
    </Select>
  );
}
