import { useRef, useState } from 'react';

import { Chip, MenuItem, Tooltip } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import { Iteration } from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import { getIterationValue } from '../../../../utils/helpers/tickets/ticketFields.ts';

interface CustomIterationSelectionProps {
  id?: string;
  iteration: Iteration | undefined;
  iterationList: Iteration[];
  border?: boolean
}

export default function CustomIterationSelection({
  id,
  iteration,
  iterationList,
  border
}: CustomIterationSelectionProps) {
  const [iterationValue, setIterationValue] = useState<Iteration | null>(
    iteration ? iteration : null,
  );
  const previousIteration = useRef<Iteration | null>(
    iteration ? iteration : null,
  );
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets } = useTicketStore();

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newIteration = getIterationValue(event.target.value, iterationList);

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined && newIteration !== undefined) {
      setIterationValue(newIteration);
      ticket.iteration = newIteration;
      TicketsService.updateTicketIteration(ticket)
        .then(updatedTicket => {
          mergeTickets(updatedTicket);
          setDisabled(false);
        })
        .catch(() => {
          setIterationValue(previousIteration.current);
          setDisabled(false);
        });
    }
  };

  return (
    <Select
      value={iterationValue?.name ? iterationValue?.name : ''}
      onChange={handleChange}
      sx={{ width: '100%', maxWidth: '200px' }}
      input={border ? <Select /> :<StyledSelect />}
      disabled={disabled}
    >
      {iterationList.map(iteration => (
        <MenuItem
          key={iteration.id}
          value={iteration.name}
          onKeyDown={e => e.stopPropagation()}
        >
          <Tooltip title={iteration.name} key={iteration.id}>
            <Chip
              color={'warning'}
              label={iteration.name}
              size="small"
              sx={{ color: 'black' }}
            />
          </Tooltip>
        </MenuItem>
      ))}
    </Select>
  );
}
