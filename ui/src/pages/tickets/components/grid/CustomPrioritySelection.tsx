import { useState } from 'react';

import { MenuItem, Typography } from '@mui/material';

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
import UnableToEditTicketTooltip from '../UnableToEditTicketTooltip.tsx';
import { Box } from '@mui/system';
import { useCanEditTicket } from '../../../../hooks/api/tickets/useCanEditTicket.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { useTicketByTicketNumber } from '../../../../hooks/api/tickets/useTicketById.tsx';

interface CustomPrioritySelectionProps {
  ticket?: TicketDto | Ticket;
  id?: string;
  priorityBucket?: PriorityBucket | null;
  priorityBucketList: PriorityBucket[];
  border?: boolean;
  autoFetch?: boolean;
}

export default function CustomPrioritySelection({
  id,
  priorityBucket,
  priorityBucketList,
  border,
  ticket,
  autoFetch = false,
}: CustomPrioritySelectionProps) {
  useTicketByTicketNumber(ticket?.ticketNumber, autoFetch);
  const { mergeTicket } = useTicketStore();
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById } = useTicketStore();
  const { canEdit } = useCanEditTicket(ticket);
  const queryClient = useQueryClient();

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newPriority = getPriorityValue(
      event.target.value,
      priorityBucketList,
    );
    if (ticket !== undefined && newPriority !== undefined) {
      ticket.priorityBucket = newPriority;
      TicketsService.updateTicketPriority(ticket)
        .then(() => {
          if (autoFetch) {
            void queryClient.invalidateQueries({
              queryKey: ['ticket', ticket.ticketNumber],
            });
            void queryClient.invalidateQueries({
              queryKey: ['ticketDto', ticket?.id.toString()],
            });
          } else {
            void TicketsService.getIndividualTicketByTicketNumber(
              ticket.ticketNumber,
            ).then(ticket => {
              mergeTicket(ticket);
            });
          }
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
          if (autoFetch) {
            void queryClient.invalidateQueries({
              queryKey: ['ticket', ticket.ticketNumber],
            });
            void queryClient.invalidateQueries({
              queryKey: ['ticketDto', ticket?.id.toString()],
            });
          } else {
            void TicketsService.getIndividualTicketByTicketNumber(
              ticket.ticketNumber,
            ).then(ticket => {
              mergeTicket(ticket);
            });
          }

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
          id={`ticket-priority-select-${id}`}
          value={priorityBucket?.name ? priorityBucket?.name : ''}
          onChange={handleChange}
          sx={{ width: '100%', maxWidth: '200px' }}
          input={border ? <Select /> : <StyledSelect />}
          disabled={disabled || !canEdit}
          MenuProps={{
            PaperProps: {
              id: `ticket-priority-select-${id}-container`,
            },
          }}
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
              <PriorityItemDisplay localPriority={priorityBucketLocal} />
            </MenuItem>
          ))}
        </Select>
      </Box>
    </UnableToEditTicketTooltip>
  );
}

interface PriorityItemDisplayProps {
  localPriority: PriorityBucket;
}

export function PriorityItemDisplay({
  localPriority,
}: PriorityItemDisplayProps) {
  return <Typography>{localPriority.name}</Typography>;
}
