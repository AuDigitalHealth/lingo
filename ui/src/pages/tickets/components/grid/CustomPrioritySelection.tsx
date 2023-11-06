import { useState } from 'react';

import { MenuItem } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import { PriorityBucket } from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import { getPriorityValue } from '../../../../utils/helpers/tickets/ticketFields.ts';

interface CustomPrioritySelectionProps {
  id?: string;
  priorityBucket?: PriorityBucket | null;
  priorityBucketList: PriorityBucket[];
  border?: boolean;
}

export default function CustomPrioritySelection({
  id,
  priorityBucket,
  priorityBucketList,
  border,
}: CustomPrioritySelectionProps) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets } = useTicketStore();

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newPriority = getPriorityValue(
      event.target.value,
      priorityBucketList,
    );
    const ticket = getTicketById(Number(id));
    if (ticket !== undefined && newPriority !== undefined) {
      ticket.priorityBucket = newPriority;
      TicketsService.updateTicketPriority(ticket)
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
      TicketsService.deleteTicketPriority(ticket)
        .then(() => {
          ticket.priorityBucket = null;
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
      value={priorityBucket?.name ? priorityBucket?.name : ''}
      onChange={handleChange}
      sx={{ width: '100%', maxWidth: '200px' }}
      input={border ? <Select /> : <StyledSelect />}
      disabled={disabled}
    >
      <MenuItem value="" onClick={handleDelete}>
        <em>&#8205;</em>
      </MenuItem>
      {priorityBucketList.map(priorityBucketLocal => (
        <MenuItem
          key={priorityBucketLocal.id}
          value={priorityBucketLocal.name}
          onKeyDown={e => e.stopPropagation()}
        >
          {priorityBucketLocal.name}
        </MenuItem>
      ))}
    </Select>
  );
}
