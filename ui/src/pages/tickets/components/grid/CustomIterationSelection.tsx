import { useEffect, useRef, useState } from 'react';

import { Chip, MenuItem, Tooltip } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import { Iteration, TicketDto } from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import { getIterationValue } from '../../../../utils/helpers/tickets/ticketFields.ts';
import UnableToEditTicketTooltip from '../UnableToEditTicketTooltip.tsx';
import { Box } from '@mui/system';
import { useCanEditTicket } from '../../../../hooks/api/tickets/useCanEditTicket.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { useTicketByTicketNumber } from '../../../../hooks/api/tickets/useTicketById.tsx';

interface CustomIterationSelectionProps {
  ticket: TicketDto | undefined;
  id?: string;
  iteration: Iteration | undefined | null;
  iterationList: Iteration[];
  border?: boolean;
  autoFetch?: boolean;
  skinny?: boolean;
}

export default function CustomIterationSelection({
  ticket,
  id,
  iteration,
  iterationList,
  border,
  autoFetch = false,
  skinny = false,
}: CustomIterationSelectionProps) {
  useTicketByTicketNumber(ticket?.ticketNumber, autoFetch);
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTicket } = useTicketStore();
  const { canEdit } = useCanEditTicket(ticket);
  const queryClient = useQueryClient();
  const selectRef = useRef<HTMLDivElement>(null);
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined);

  // Sort iterations: active first, then inactive
  const sortedIterationList = [...iterationList].sort((a, b) => {
    if (a.active === b.active) return 0;
    return a.active ? -1 : 1;
  });

  useEffect(() => {
    if (skinny && selectRef.current && iterationList.length > 0) {
      // Create a temporary element to measure the widest option
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.whiteSpace = 'nowrap';
      tempDiv.style.font = window.getComputedStyle(selectRef.current).font;
      document.body.appendChild(tempDiv);

      let maxWidth = 0;
      iterationList.forEach(iter => {
        tempDiv.textContent = iter.name;
        maxWidth = Math.max(maxWidth, tempDiv.offsetWidth);
      });

      document.body.removeChild(tempDiv);
      // Add padding for the chip padding, dropdown icon and padding (approximately 80px to account for Chip styling)
      setMinWidth(maxWidth + 80);
    }
  }, [skinny, iterationList]);

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newIteration = getIterationValue(event.target.value, iterationList);

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined && newIteration !== undefined) {
      TicketsService.updateTicketIteration(ticket.id, newIteration.id)
        .then(() => {
          setDisabled(false);
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
          id={`ticket-iteration-select-${id}`}
          value={iteration?.name ? iteration?.name : ''}
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
              id: `ticket-iteration-select-${id}-container`,
            },
          }}
        >
          <MenuItem value="" onClick={handleDelete}>
            <em>&#8205;</em>
          </MenuItem>
          {sortedIterationList.map(iterationLocal => (
            <MenuItem
              data-testid={iterationLocal.name}
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
  const inactive = !iteration.active && iteration.completed;
  const color = inactive ? 'default' : 'warning';
  debugger;
  return (
    <Tooltip title={iteration.name} key={iteration.id}>
      <Chip color={color} label={iteration.name} size="small" />
    </Tooltip>
  );
}
