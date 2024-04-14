import { useState } from 'react';

import { MenuItem, Typography } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import { Schedule } from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import UnableToEditTicketTooltip from '../UnableToEditTicketTooltip.tsx';
import { Box } from '@mui/system';
import { useCanEditTicketById } from '../../../../hooks/api/tickets/useCanEditTicket.tsx';

interface CustomScheduleSelectionProps {
  id?: string;
  schedule?: Schedule | undefined | null;
  scheduleList: Schedule[];
  border?: boolean;
}

export default function CustomScheduleSelection({
  id,
  schedule,
  scheduleList,
  border,
}: CustomScheduleSelectionProps) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets } = useTicketStore();
  const [canEdit] = useCanEditTicketById(id);

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newSchedule = getScheduleValue(event.target.value);

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined && newSchedule !== undefined) {
      TicketsService.updateTicketSchedule(ticket, newSchedule.id)
        .then(updatedTicket => {
          mergeTickets(updatedTicket);
          setDisabled(false);
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
    <UnableToEditTicketTooltip canEdit={canEdit}>
      <Box sx={{ width: '200px' }}>
        <Select
          value={schedule?.name ? schedule?.name : ''}
          onChange={handleChange}
          sx={{ width: '100%', maxWidth: '200px' }}
          input={border ? <Select /> : <StyledSelect />}
          disabled={disabled || !canEdit}
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
