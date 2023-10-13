import { useState } from 'react';

import { Chip, MenuItem, Tooltip } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import { State } from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';

interface CustomStateSelectionProps {
  id?: string;
  state?: State | undefined | null;
  stateList: State[];
  border?: boolean;
}

export default function CustomStateSelection({
  id,
  state,
  stateList,
  border,
}: CustomStateSelectionProps) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets } = useTicketStore();

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newState = getStateValue(event.target.value);

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined && newState !== undefined && ticket.state) {
      // if it doesn't have a state this isn't going to work
      ticket.state.id = newState.id;
      TicketsService.updateTicketState(ticket)
        .then(updatedTicket => {
          mergeTickets(updatedTicket);
          setDisabled(false);
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
      value={state?.label ? state?.label : ''}
      onChange={handleChange}
      sx={{ width: '100%', maxWidth: '200px' }}
      input={border ? <Select /> : <StyledSelect />}
      disabled={disabled}
    >
      {stateList.map(localState => (
        <MenuItem
          key={localState.id}
          value={localState.label}
          onKeyDown={e => e.stopPropagation()}
          onClick={state?.id === localState.id ? handleDelete : () => null}
        >
          <Tooltip title={localState.label} key={localState.id}>
            <Chip
              color={'primary'}
              label={localState.label}
              size="small"
              sx={{ color: 'white' }}
            />
          </Tooltip>
        </MenuItem>
      ))}
    </Select>
  );
}
