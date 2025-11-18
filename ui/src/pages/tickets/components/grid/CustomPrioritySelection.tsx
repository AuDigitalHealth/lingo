import { useEffect, useRef, useState } from 'react';

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
  skinny = false,
}: CustomPrioritySelectionProps & { skinny?: boolean }) {
  useTicketByTicketNumber(ticket?.ticketNumber, autoFetch);
  const { mergeTicket } = useTicketStore();
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById } = useTicketStore();
  const { canEdit } = useCanEditTicket(ticket);
  const queryClient = useQueryClient();
  const selectRef = useRef<HTMLDivElement>(null);
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (skinny && selectRef.current && priorityBucketList.length > 0) {
      // Create a temporary element to measure the widest option
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.whiteSpace = 'nowrap';
      tempDiv.style.font = window.getComputedStyle(selectRef.current).font;
      document.body.appendChild(tempDiv);

      let maxWidth = 0;
      priorityBucketList.forEach(priority => {
        tempDiv.textContent = priority.name;
        maxWidth = Math.max(maxWidth, tempDiv.offsetWidth);
      });

      document.body.removeChild(tempDiv);
      // Add padding for the dropdown icon and padding (approximately 56px)
      setMinWidth(maxWidth + 56);
    }
  }, [skinny, priorityBucketList]);

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
      <Box sx={{ width: skinny ? 'fit-content' : '200px' }}>
        <Select
          ref={selectRef}
          id={`ticket-priority-select-${id}`}
          value={priorityBucket?.name ? priorityBucket?.name : ''}
          onChange={handleChange}
          sx={{
            width: skinny
              ? minWidth
                ? `${minWidth}px`
                : 'fit-content'
              : '100%',
            maxWidth: skinny ? 'none' : '200px',
          }}
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
