import { useState } from 'react';

import { MenuItem, Typography } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import {
  Schedule,
  Ticket,
  TicketDto,
} from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import UnableToEditTicketTooltip from '../UnableToEditTicketTooltip.tsx';
import { Box } from '@mui/system';
import { useCanEditTicket } from '../../../../hooks/api/tickets/useCanEditTicket.tsx';
import { useQueryClient } from '@tanstack/react-query';
import {
  getTicketByIdOptions,
  useTicketById,
} from '../../../../hooks/api/tickets/useTicketById.tsx';

interface CustomScheduleSelectionProps {
  ticket?: TicketDto | Ticket;
  id?: string;
  schedule?: Schedule | undefined | null;
  scheduleList: Schedule[];
  border?: boolean;
  autoFetch?: boolean;
}

export default function CustomScheduleSelection({
  ticket,
  id,
  schedule,
  scheduleList,
  border,
  autoFetch = false,
}: CustomScheduleSelectionProps) {
  const [fetchTicket, setFetchTicket] = useState<boolean>(autoFetch);
  useTicketById(ticket?.id.toString(), fetchTicket);
  const [disabled, setDisabled] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const { getTicketById } = useTicketStore();
  const { canEdit } = useCanEditTicket(ticket);
  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newSchedule = getScheduleValue(event.target.value);

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined && newSchedule !== undefined) {
      TicketsService.updateTicketSchedule(ticket, newSchedule.id)
        .then(() => {
          setDisabled(false);
          setFetchTicket(true);

          void queryClient.invalidateQueries({
            queryKey: ['ticket', ticket.ticketNumber],
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

  const getScheduleValue = (name: string) => {
    const schedule: Schedule | undefined = scheduleList.find(state => {
      return state.name === name;
    });
    return schedule;
  };

  const handleDelete = () => {
    setDisabled(true);

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined) {
      TicketsService.deleteTicketSchedule(ticket)
        .then(() => {
          setFetchTicket(true);
          void queryClient.invalidateQueries({
            queryKey: getTicketByIdOptions(ticket?.id.toString()).queryKey,
          });
          void queryClient.invalidateQueries({ queryKey: ['ticketDto', id] });
          setDisabled(false);
        })
        .catch(() => {
          setDisabled(false);
        });
    }
  };

  return (
    <UnableToEditTicketTooltip canEdit={canEdit}>
      <Box sx={{ width: '200px' }}>
        <Select
          id={`ticket-schedule-select-${id}`}
          value={schedule?.name ? schedule?.name : ''}
          onChange={handleChange}
          sx={{ width: '100%', maxWidth: '200px' }}
          input={border ? <Select /> : <StyledSelect />}
          disabled={disabled || !canEdit}
          MenuProps={{
            PaperProps: {
              id: `ticket-schedule-select-${id}-container`,
            },
          }}
        >
          <MenuItem value="" onClick={handleDelete}>
            <em>&#8205;</em>
          </MenuItem>
          {scheduleList.map(localSchedule => (
            <MenuItem
              key={localSchedule.id}
              value={localSchedule.name}
              onKeyDown={e => e.stopPropagation()}
            >
              <ScheduleItemDisplay localSchedule={localSchedule} />
            </MenuItem>
          ))}
        </Select>
      </Box>
    </UnableToEditTicketTooltip>
  );
}

interface ScheduleItemDisplayProps {
  localSchedule: Schedule;
}

export function ScheduleItemDisplay({
  localSchedule,
}: ScheduleItemDisplayProps) {
  return <Typography>{localSchedule.name}</Typography>;
}
