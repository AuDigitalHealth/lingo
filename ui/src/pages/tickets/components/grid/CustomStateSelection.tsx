import { useState } from 'react';

import { Chip, MenuItem, SxProps, Tooltip } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import { State, Ticket, TicketDto } from '../../../../types/tickets/ticket.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import { useQueryClient } from '@tanstack/react-query';
import { useInitializeState } from '../../../../hooks/api/useInitializeTickets.tsx';
import {
  getTicketByIdOptions,
  useTicketById,
} from '../../../../hooks/api/tickets/useTicketById.tsx';

interface CustomStateSelectionProps {
  state?: State | undefined | null;
  border?: boolean;
  ticket: TicketDto | Ticket | undefined;
  autoFetch?: boolean;
}

export default function CustomStateSelection({
  state,
  border,
  ticket,
  autoFetch = false,
}: CustomStateSelectionProps) {
  const [fetchTicket, setFetchTicket] = useState<boolean>(autoFetch);
  useTicketById(ticket?.id.toString(), fetchTicket);
  const { statesData } = useInitializeState();
  const [disabled, setDisabled] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newState = getStateValue(event.target.value);
    if (ticket !== undefined && newState !== undefined) {
      TicketsService.updateTicketState(ticket, newState.id)
        .then(() => {
          setDisabled(false);
          setFetchTicket(true);

          void queryClient.invalidateQueries({
            queryKey: getTicketByIdOptions(ticket?.id.toString()).queryKey,
          });
          void queryClient.invalidateQueries({
            queryKey: ['ticketDto', ticket?.id.toString()],
          });
        })
        .catch(() => {
          setDisabled(false);
        });
    }
  };

  const getStateValue = (label: string) => {
    const state: State | undefined = statesData?.find(state => {
      return state.label === label;
    });
    return state;
  };

  const handleDelete = () => {
    setDisabled(true);

    if (ticket !== undefined) {
      TicketsService.deleteTicketState(ticket)
        .then(() => {
          setFetchTicket(true);

          void queryClient.invalidateQueries({
            queryKey: getTicketByIdOptions(ticket?.id.toString()).queryKey,
          });
          void queryClient.invalidateQueries({
            queryKey: ['ticketDto', ticket?.id.toString()],
          });

          setDisabled(false);
        })
        .catch(() => {
          setDisabled(false);
        });
    }
  };

  return (
    <>
      <Select
        id={`ticket-state-select-${ticket?.id.toString()}`}
        value={state?.label ? state?.label : ''}
        onChange={handleChange}
        sx={{ width: '100%', maxWidth: '200px' }}
        input={border ? <Select /> : <StyledSelect />}
        disabled={disabled}
        MenuProps={{
          PaperProps: {
            id: `ticket-state-select-${ticket?.id.toString()}-container`,
          },
        }}
      >
        <MenuItem value="" onClick={handleDelete}>
          <em>&#8205;</em>
        </MenuItem>
        {statesData?.map(localState => (
          <MenuItem
            key={localState.id}
            value={localState.label}
            onKeyDown={e => e.stopPropagation()}
          >
            <StateItemDisplay state={localState} />
          </MenuItem>
        ))}
      </Select>
    </>
  );
}

interface StateItemDisplayProps {
  state: State;
  sx?: SxProps;
}

export function StateItemDisplay({ state, sx }: StateItemDisplayProps) {
  return (
    <Tooltip title={state.label} key={state.id} sx={{ ...sx }}>
      <Chip color={'primary'} label={state.label} size="small" sx={{ ...sx }} />
    </Tooltip>
  );
}
