import { useEffect, useRef, useState } from 'react';

import { Chip, MenuItem, Tooltip } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import { Iteration } from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import { getIterationValue } from '../../../../utils/helpers/tickets/ticketFields.ts';

interface CustomIterationSelectionProps {
  id?: string;
  iteration: Iteration | undefined | null;
  iterationList: Iteration[];
  border?: boolean;
}

export default function CustomIterationSelection({
  id,
  iteration,
  iterationList,
  border,
}: CustomIterationSelectionProps) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets } = useTicketStore();

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
        .then(res => {
          ticket.iteration = null;
          mergeTickets(ticket);
          setDisabled(false);
        })
        .catch(() => {
          setDisabled(false);
        });
    }
  };
  console.log(id);
  console.log(iteration);
  return (
    <Select
      value={iteration?.name ? iteration?.name : ''}
      onChange={handleChange}
      sx={{ width: '100%', maxWidth: '200px' }}
      input={border ? <Select /> : <StyledSelect />}
      disabled={disabled}
    >
      {iterationList.map(iterationLocal => (
        <MenuItem
          key={iterationLocal.id}
          value={iterationLocal.name}
          onKeyDown={e => e.stopPropagation()}
          onClick={
            iterationLocal.id === iteration?.id ? handleDelete : () => null
          }
        >
          <Tooltip title={iterationLocal.name} key={iterationLocal.id}>
            <Chip
              color={'warning'}
              label={iterationLocal.name}
              size="small"
              sx={{ color: 'black' }}
            />
          </Tooltip>
        </MenuItem>
      ))}
    </Select>
  );
}
