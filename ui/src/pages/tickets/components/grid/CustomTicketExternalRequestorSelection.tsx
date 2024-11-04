/* eslint-disable */
import { useState } from 'react';

import { Chip, MenuItem, Tooltip } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { Box, Stack } from '@mui/system';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import {
  ExternalRequestorBasic,
  ExternalRequestor,
  Ticket,
  TicketDto,
} from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import { externalRequestorExistsOnTicket } from '../../../../utils/helpers/tickets/labelUtils.ts';
import UnableToEditTicketTooltip from '../UnableToEditTicketTooltip.tsx';
import { useCanEditTicket } from '../../../../hooks/api/tickets/useCanEditTicket.tsx';
import ExternalRequestorChip from '../ExternalRequestorChip.tsx';
import {
  getTicketByTicketNumberOptions,
  useTicketByTicketNumber,
} from '../../../../hooks/api/tickets/useTicketById.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { getExternalRequestorByName } from '../../../../utils/helpers/tickets/externalRequestorUtils.ts';

interface CustomTicketExternalRequestorSelectionProps {
  id: string;
  typedExternalRequestors?: ExternalRequestor[];
  externalRequestorList: ExternalRequestor[];
  border?: boolean;
  ticket?: Ticket | TicketDto;
}

export default function CustomTicketExternalRequestorSelection({
  id,
  typedExternalRequestors,
  externalRequestorList,
  border,
  ticket,
}: CustomTicketExternalRequestorSelectionProps) {
  const { mergeTicket } = useTicketStore();
  const [fetchTicket, setFetchTicket] = useState<boolean>(false);
  useTicketByTicketNumber(ticket?.ticketNumber, fetchTicket);
  const queryClient = useQueryClient();

  const [disabled, setDisabled] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);
  const { canEdit } = useCanEditTicket(ticket);

  const updateExternalRequestor = (externalRequestor: ExternalRequestor) => {
    if (ticket === undefined) return;
    const shouldDelete = externalRequestorExistsOnTicket(
      ticket,
      externalRequestor,
    );
    if (shouldDelete) {
      TicketsService.deleteTicketExternalRequestor(id, externalRequestor.id)
        .then(res => {
          void TicketsService.getIndividualTicketByTicketNumber(
            ticket.ticketNumber,
          ).then(ticket => {
            mergeTicket(ticket);
          });
        })
        .catch(err => {
          console.log(err);
        })
        .finally(() => {
          setDisabled(false);
        });
    } else {
      TicketsService.addTicketExternalRequestor(id, externalRequestor.id)
        .then(res => {
          void TicketsService.getIndividualTicketByTicketNumber(
            ticket.ticketNumber,
          ).then(ticket => {
            mergeTicket(ticket);
          });
        })
        .catch(err => {
          console.log(err);
        })
        .finally(() => {
          setDisabled(false);
        });
    }
  };

  const getExternalRequestorIsChecked = (
    externalRequestorType: ExternalRequestor,
  ): boolean => {
    let checked = false;
    typedExternalRequestors?.forEach(externalRequestor => {
      // label.
      if (Number(externalRequestor.id) === externalRequestorType.id) {
        checked = true;
        return;
      }
    });
    return checked;
  };

  const handleChange = (
    event: SelectChangeEvent<typeof typedExternalRequestors>,
  ) => {
    setDisabled(true);
    const {
      target: { value },
    } = event;
    if (value === undefined) {
      setDisabled(false);
      return;
    }
    const externalRequestorValue = value[value.length - 1] as string;
    if (externalRequestorValue === undefined) {
      setDisabled(false);
      return;
    }
    let externalRequestorType: ExternalRequestor | undefined =
      getExternalRequestorByName(
        externalRequestorValue as unknown as string,
        externalRequestorList,
      );

    if (externalRequestorType === undefined) return;
    updateExternalRequestor(externalRequestorType);
  };

  const handleChangeFocus = () => {
    setFocused(!focused);
  };

  return (
    <UnableToEditTicketTooltip canEdit={canEdit}>
      <Box sx={{ width: '100%' }}>
        <Select
          key={id}
          multiple={true}
          value={typedExternalRequestors}
          onChange={handleChange}
          onFocus={handleChangeFocus}
          disabled={disabled || !canEdit}
          sx={{ width: '100%' }}
          input={border ? <Select /> : <StyledSelect />}
          renderValue={selected => (
            <Stack gap={1} direction="row" flexWrap="wrap">
              {selected.map(value => {
                // let labelVal = createTypeLabel(value);
                return (
                  <ExternalRequestorChip
                    externalRequestor={value}
                    externalRequestorList={externalRequestorList}
                    key={`${value.id}`}
                  />
                );
              })}
            </Stack>
          )}
        >
          {externalRequestorList.map(externalRequestorType => (
            <MenuItem
              key={externalRequestorType.id}
              value={externalRequestorType.name}
              disabled={disabled}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                width="100%"
                alignItems="center"
              >
                <ExternalRequestorItemDisplay
                  externalRequestor={externalRequestorType}
                />

                <Checkbox
                  checked={getExternalRequestorIsChecked(externalRequestorType)}
                />
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </Box>
    </UnableToEditTicketTooltip>
  );
}

interface ExternalRequestorItemDisplayProps {
  externalRequestor: ExternalRequestor;
}

export function ExternalRequestorItemDisplay({
  externalRequestor,
}: ExternalRequestorItemDisplayProps) {
  return (
    <Chip
      label={externalRequestor.name}
      size="small"
      sx={{ color: 'black', backgroundColor: externalRequestor.displayColor }}
    />
  );
}
