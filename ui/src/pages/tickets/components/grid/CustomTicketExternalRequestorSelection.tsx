/* eslint-disable */
import { useState } from 'react';

import { Button, Chip, MenuItem, Tooltip, Typography } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { Box, Stack } from '@mui/system';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import BaseModal from '../../../../components/modal/BaseModal.tsx';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader.tsx';
import BaseModalBody from '../../../../components/modal/BaseModalBody.tsx';
import BaseModalFooter from '../../../../components/modal/BaseModalFooter.tsx';
import {
  ExternalRequestorBasic,
  ExternalRequestor,
  Ticket,
  TicketDto,
  TicketExternalRequestorDto,
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
import { DATE_FORMAT } from '../../../../utils/helpers/dateUtils.ts';

interface CustomTicketExternalRequestorSelectionProps {
  id: string;
  typedExternalRequestors?: TicketExternalRequestorDto[];
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

  // When adding a requestor we first prompt (optionally) for a "date requested".
  const [pendingRequestor, setPendingRequestor] =
    useState<ExternalRequestor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const refreshTicket = () => {
    if (ticket === undefined) return;
    void TicketsService.getIndividualTicketByTicketNumber(
      ticket.ticketNumber,
    ).then(updated => {
      mergeTicket(updated);
    });
  };

  const updateExternalRequestor = (externalRequestor: ExternalRequestor) => {
    if (ticket === undefined) return;
    const shouldDelete = externalRequestorExistsOnTicket(
      ticket,
      externalRequestor,
    );
    if (shouldDelete) {
      TicketsService.deleteTicketExternalRequestor(id, externalRequestor.id)
        .then(() => {
          refreshTicket();
        })
        .catch(err => {
          console.log(err);
        })
        .finally(() => {
          setDisabled(false);
        });
    } else {
      // Defer the add until the user confirms in the date dialog.
      setSelectedDate(null);
      setPendingRequestor(externalRequestor);
    }
  };

  const cancelAdd = () => {
    setPendingRequestor(null);
    setSelectedDate(null);
    setDisabled(false);
  };

  const confirmAdd = () => {
    if (pendingRequestor === null) return;
    const dateRequested = selectedDate
      ? selectedDate.format('YYYY-MM-DD')
      : undefined;
    TicketsService.addTicketExternalRequestor(
      id,
      pendingRequestor.id,
      dateRequested,
    )
      .then(() => {
        refreshTicket();
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        setPendingRequestor(null);
        setSelectedDate(null);
        setDisabled(false);
      });
  };

  const getExternalRequestorIsChecked = (
    externalRequestorType: ExternalRequestor,
  ): boolean => {
    let checked = false;
    typedExternalRequestors?.forEach(externalRequestor => {
      if (externalRequestor.externalRequestorId === externalRequestorType.id) {
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
        <BaseModal
          open={pendingRequestor !== null}
          handleClose={cancelAdd}
          sx={{ minWidth: '420px' }}
        >
          <BaseModalHeader title="Add External Requestor" />
          <BaseModalBody sx={{ alignItems: 'stretch' }}>
            <Box sx={{ padding: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Adding <strong>{pendingRequestor?.name}</strong>
                {ticket?.ticketNumber ? ` to ${ticket.ticketNumber}` : ''}.
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1.5, display: 'block' }}
              >
                Optionally record the date this ticket was requested by the
                external requestor. Leave it blank to add the requestor with no
                requested date — you can set it later from the ticket.
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date Requested (optional)"
                  format={DATE_FORMAT}
                  value={selectedDate}
                  onChange={setSelectedDate}
                  slotProps={{
                    textField: { size: 'small', sx: { width: 220 } },
                    field: { clearable: true },
                  }}
                />
              </LocalizationProvider>
            </Box>
          </BaseModalBody>
          <BaseModalFooter
            startChildren={
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={cancelAdd}
              >
                Cancel
              </Button>
            }
            endChildren={
              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={confirmAdd}
              >
                {selectedDate ? 'Add with date' : 'Add without date'}
              </Button>
            }
          />
        </BaseModal>
        <Select
          key={id}
          multiple={true}
          value={typedExternalRequestors ?? []}
          onChange={handleChange}
          onFocus={handleChangeFocus}
          disabled={disabled || !canEdit}
          sx={{ width: '100%' }}
          input={border ? <Select /> : <StyledSelect />}
          renderValue={selected => (
            <Stack gap={1} direction="row" flexWrap="wrap">
              {[...selected]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(value => {
                  return (
                    <ExternalRequestorChip
                      externalRequestorVal={{
                        externalRequestorId:
                          value.externalRequestorId.toString(),
                        externalRequestorName: value.name,
                      }}
                      externalRequestorList={externalRequestorList}
                      key={`${value.externalRequestorId}`}
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
