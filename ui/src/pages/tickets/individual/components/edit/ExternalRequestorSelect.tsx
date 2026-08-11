import { useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import {
  ExternalRequestor,
  Ticket,
} from '../../../../../types/tickets/ticket.ts';
import { useUpdateExternalRequestors } from '../../../../../hooks/api/tickets/useUpdateTicket.tsx';
import UnableToEditTicketTooltip from '../../../components/UnableToEditTicketTooltip.tsx';
import { useCanEditTicket } from '../../../../../hooks/api/tickets/useCanEditTicket.tsx';
import { useAllExternalRequestors } from '../../../../../hooks/api/useInitializeTickets.tsx';
import { DATE_FORMAT } from '../../../../../utils/helpers/dateUtils.ts';

interface ExternalRequestorSelectProps {
  ticket?: Ticket;
  border?: boolean;
}

export default function ExternalRequestorSelect({
  ticket,
  border,
}: ExternalRequestorSelectProps) {
  const { externalRequestors } = useAllExternalRequestors();
  const mutation = useUpdateExternalRequestors();
  const { canEdit } = useCanEditTicket(ticket);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  if (ticket === undefined) return <></>;

  const { isPending } = mutation;

  const current = [...(ticket.externalRequestors ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const available = externalRequestors.filter(
    er => !current.some(ter => ter.externalRequestorId === er.id),
  );

  const handleAdd = () => {
    if (!selectedId) return;
    const externalRequestor = externalRequestors.find(
      er => er.id === Number(selectedId),
    );
    if (!externalRequestor) return;
    mutation.mutate({
      ticket,
      externalRequestor,
      method: 'PUT',
      dateRequested: selectedDate?.format('YYYY-MM-DD'),
    });
    setSelectedId('');
    setSelectedDate(null);
  };

  const handleRemove = (externalRequestor: ExternalRequestor) => {
    mutation.mutate({
      ticket,
      externalRequestor,
      method: 'DELETE',
    });
  };

  return (
    <UnableToEditTicketTooltip canEdit={canEdit}>
      <Box sx={{ width: '100%' }}>
        <Stack gap={1}>
          {current.length > 0 && (
            <Stack direction="row" gap={1} flexWrap="wrap">
              {current.map(ter => {
                const er = externalRequestors.find(
                  e => e.id === ter.externalRequestorId,
                );
                return er ? (
                  <Chip
                    key={ter.externalRequestorId}
                    label={ter.name}
                    size="small"
                    sx={{ backgroundColor: ter.displayColor, color: 'black' }}
                    onDelete={canEdit ? () => handleRemove(er) : undefined}
                    disabled={isPending}
                  />
                ) : null;
              })}
            </Stack>
          )}
          {canEdit && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack direction="row" gap={1} alignItems="center">
                <Select
                  value={selectedId}
                  onChange={(e: SelectChangeEvent) =>
                    setSelectedId(e.target.value)
                  }
                  displayEmpty
                  size="small"
                  disabled={isPending || available.length === 0}
                  sx={{ minWidth: 180 }}
                  renderValue={val =>
                    val
                      ? (externalRequestors.find(er => er.id === Number(val))
                          ?.name ?? val)
                      : 'Add requestor…'
                  }
                >
                  {available.map(er => (
                    <MenuItem key={er.id} value={er.id.toString()}>
                      <Chip
                        label={er.name}
                        size="small"
                        sx={{
                          backgroundColor: er.displayColor,
                          color: 'black',
                          pointerEvents: 'none',
                        }}
                      />
                    </MenuItem>
                  ))}
                </Select>
                <DatePicker
                  label="Date Requested"
                  format={DATE_FORMAT}
                  value={selectedDate}
                  onChange={setSelectedDate}
                  slotProps={{
                    textField: { size: 'small', sx: { width: 160 } },
                    field: { clearable: true },
                  }}
                  disabled={isPending}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAdd}
                  disabled={!selectedId || isPending}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Stack>
            </LocalizationProvider>
          )}
        </Stack>
      </Box>
    </UnableToEditTicketTooltip>
  );
}
