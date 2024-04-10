import { useState } from 'react';

import { Chip, MenuItem, Tooltip } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import {
  Iteration,
  Ticket,
  TicketDto,
} from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import { getIterationValue } from '../../../../utils/helpers/tickets/ticketFields.ts';
import UnableToEditTicketTooltip from '../UnableToEditTicketTooltip.tsx';
import { Box } from '@mui/system';
import { useCanEditTicket } from '../../../../hooks/api/tickets/useCanEditTicket.tsx';

interface CustomIterationSelectionProps {
  id?: string;
  iteration: Iteration | undefined | null;
  iterationList: Iteration[];
  border?: boolean;
  ticket?: Ticket | TicketDto;
}

export default function CustomIterationSelection({
  id,
  iteration,
  iterationList,
  border,
  ticket,
}: CustomIterationSelectionProps) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets } = useTicketStore();
  const [canEdit] = useCanEditTicket(ticket);

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newIteration = getIterationValue(event.target.value, iterationList);

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined && newIteration !== undefined) {
      ticket.iteration = newIteration;
      TicketsService.updateTicketIteration(ticket)
        .then(updatedTicket => {
          mergeTickets(updatedTicket);
          setDisabled(false);
        })
        .catch(() => {
          setDisabled(false);
        });
    }
  };

  const handleDelete = () => {
    setDisabled(true);

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined) {
      TicketsService.deleteTicketIteration(ticket)
        .then(() => {
          ticket.iteration = null;
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
          id={`ticket-iteration-select-${id}`}
          value={iteration?.name ? iteration?.name : ''}
          onChange={handleChange}
          sx={{ width: '100%', maxWidth: '200px' }}
          input={border ? <Select /> : <StyledSelect />}
          disabled={disabled || !canEdit}
          MenuProps={{
            PaperProps: {
              id: `ticket-iteration-select-${id}-container`,
            },
          }}
        >
          <MenuItem value="" onClick={handleDelete}>
            <em>&#8205;</em>
          </MenuItem>
          {iterationList.map(iterationLocal => (
            <MenuItem
              key={iterationLocal.id}
              value={iterationLocal.name}
              onKeyDown={e => e.stopPropagation()}
            >
              <IterationItemDisplay iteration={iterationLocal} />
            </MenuItem>
          ))}
        </Select>
      </Box>
    </UnableToEditTicketTooltip>
  );
}

interface IterationItemDisplayProps {
  iteration: Iteration;
}

export function IterationItemDisplay({ iteration }: IterationItemDisplayProps) {
  return (
    <Tooltip title={iteration.name} key={iteration.id}>
      <Chip
        color={'warning'}
        label={iteration.name}
        size="small"
        sx={{ color: 'black' }}
      />
    </Tooltip>
  );
}
