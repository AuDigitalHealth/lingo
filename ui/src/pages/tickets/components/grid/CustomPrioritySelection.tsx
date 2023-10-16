import { useRef, useState } from 'react';

import { MenuItem } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import { PriorityBucket } from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';

interface CustomPrioritySelectionProps {
  id?: string;
  priorityBucket?: string;
  priorityBucketList: PriorityBucket[];
}

export default function CustomPrioritySelection({
  id,
  priorityBucket,
  priorityBucketList,
}: CustomPrioritySelectionProps) {
  const initialPriorityBucket = getPriorityValue(priorityBucket);
  const [priorityBucketValue, setPriorityBucketValue] =
    useState<PriorityBucket | null>(
      initialPriorityBucket ? initialPriorityBucket : null,
    );
  const previousPriorityBucket = useRef<PriorityBucket | null>(
    initialPriorityBucket ? initialPriorityBucket : null,
  );
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets } = useTicketStore();

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newPriority = getPriorityValue(event.target.value);
    const ticket = getTicketById(Number(id));
    if (ticket !== undefined && newPriority !== undefined) {
      setPriorityBucketValue(newPriority);

      TicketsService.updateTicketPriority(ticket, newPriority.id)
        .then(updatedTicket => {
          mergeTickets(updatedTicket);
          setDisabled(false);
        })
        .catch(() => {
          setPriorityBucketValue(previousPriorityBucket.current);
          setDisabled(false);
        });
    }
  };

  function getPriorityValue(name: string | undefined) {
    const priorityBucket: PriorityBucket | undefined = priorityBucketList.find(
      priorityBucketItem => priorityBucketItem.name === name,
    );
    return priorityBucket;
  }

  return (
    <Select
      value={priorityBucketValue?.name ? priorityBucketValue?.name : ''}
      onChange={handleChange}
      sx={{ width: '100%' }}
      input={<StyledSelect />}
      disabled={disabled}
    >
      {priorityBucketList.map(priorityBucket => (
        <MenuItem
          key={priorityBucket.id}
          value={priorityBucket.name}
          onKeyDown={e => e.stopPropagation()}
        >
          {priorityBucket.name}
        </MenuItem>
      ))}
    </Select>
  );
}
