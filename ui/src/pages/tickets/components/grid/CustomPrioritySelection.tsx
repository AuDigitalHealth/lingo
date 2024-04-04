import { useState } from 'react';

import { MenuItem } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import {
  PriorityBucket,
  Ticket,
  TicketDto,
} from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import { getPriorityValue } from '../../../../utils/helpers/tickets/ticketFields.ts';
import useCanEditTicket from "../../../../hooks/api/tickets/useCanEditTicket.tsx";
import UnableToEditTicketTooltip from "../UnableToEditTicketTooltip.tsx";
import {Box} from "@mui/system";

interface CustomPrioritySelectionProps {
  ticket?: TicketDto | Ticket;
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
  ticket,
}: CustomPrioritySelectionProps) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const [priorityItem, setPriorityItem] = useState<
    PriorityBucket | null | undefined
  >(priorityBucket);
  const { getTicketById, mergeTickets } = useTicketStore();
  const [canEdit] = useCanEditTicket(id);

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newPriority = getPriorityValue(
      event.target.value,
      priorityBucketList,
    );
    if (ticket !== undefined && newPriority !== undefined) {
      ticket.priorityBucket = newPriority;
      TicketsService.updateTicketPriority(ticket)
        .then(updatedTicket => {
          setPriorityItem(newPriority);
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
      <UnableToEditTicketTooltip canEdit={canEdit}>
        <Box sx={{width:"200px"}}>
    <Select
      value={priorityItem?.name ? priorityItem?.name : ''}
      onChange={handleChange}
      sx={{ width: '100%', maxWidth: '200px' }}
      input={border ? <Select /> : <StyledSelect />}
      disabled={disabled || !canEdit}
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
        </Box>
      </UnableToEditTicketTooltip>
  );
}
