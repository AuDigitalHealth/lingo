import { useRef, useState } from 'react';


import {  MenuItem } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../styled/StyledSelect.tsx';
import { Iteration, State } from '../../types/tickets/ticket.ts';
import useTicketStore from '../../stores/TicketStore.ts';
import TicketsService from '../../api/TicketsService.ts';

interface CustomIterationSelectionProps {
  id?: string;
  iteration?: string;
  iterationList: Iteration[];
}
const ITEM_HEIGHT = 100;
const ITEM_PADDING_TOP = 8;

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function CustomIterationSelection({
  id,
  iteration,
  iterationList,
}: CustomIterationSelectionProps) {
    const initialIterationValue = getIterationValue(iteration);
  const [iterationValue, setIterationValue] = useState<Iteration | null>(initialIterationValue ? initialIterationValue : null);
  const previousIteration = useRef<Iteration | null>(initialIterationValue ? initialIterationValue : null)
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets} = useTicketStore();
  

const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newIteration = getIterationValue(event.target.value);
    
    const ticket = getTicketById(Number(id));
      if (ticket !== undefined && newIteration !== undefined) {
        setIterationValue(newIteration);
        ticket.iteration.id = newIteration.id;
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

function getIterationValue (name: String | undefined) {
    const iteration : Iteration | undefined = iterationList.find(iterationItem => iterationItem.name === name);
    return iteration;
}

  return (
    <Select
      value={iterationValue?.name}
      onChange={handleChange}
      sx={{ width: '100%' }}
      input={<StyledSelect />}
      disabled={disabled}
    >
      {iterationList.map(iteration => (
        <MenuItem
          key={iteration.id}
          value={iteration.name}
          onKeyDown={e => e.stopPropagation()}
        >
          {iteration.name}
        </MenuItem>
      ))}
    
    </Select>
  );
}

