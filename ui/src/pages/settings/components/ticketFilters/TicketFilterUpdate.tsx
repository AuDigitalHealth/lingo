import { TicketFilter } from '../../../../types/tickets/ticket.ts';
import { useEffect } from 'react';

import { Button, Grid, TextField } from '@mui/material';
import { Stack } from '@mui/system';

import { useForm, useFormState } from 'react-hook-form';

import { useServiceStatus } from '../../../../hooks/api/useServiceStatus.tsx';
import { snowstormErrorHandler } from '../../../../types/ErrorHandler.ts';
import { yupResolver } from '@hookform/resolvers/yup';

import * as yup from 'yup';
import { isDoubleByte } from '../../../../utils/helpers/validationUtils.ts';
import { useUpdateTicketFilter } from '../../../../hooks/api/tickets/useUpdateTicketFilters.tsx';

interface TicketFilterUpdateProps {
  ticketFilter?: TicketFilter;
  handleClose: () => void;
}
function TicketFilterUpdate({
  ticketFilter,
  handleClose,
}: TicketFilterUpdateProps) {
  const updateMutation = useUpdateTicketFilter();
  const { serviceStatus } = useServiceStatus();
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (ticketFilter) {
      reset(ticketFilter);
    }
  }, [ticketFilter, reset]);

  const saveFilter = (data: { name: string }) => {
    if (!ticketFilter?.id) {
      return;
    }
    const tempFilter = ticketFilter;
    tempFilter.name = data.name;
    updateMutation.mutate(
      { id: ticketFilter?.id, ticketFilter: tempFilter },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: err => {
          snowstormErrorHandler(
            err,
            `Failed to update TicketFilter`,
            serviceStatus,
          );
        },
      },
    );
  };
  const { dirtyFields } = useFormState({ control });
  const isDirty = Object.keys(dirtyFields).length > 0;
  return (
    <form onSubmit={event => void handleSubmit(saveFilter)(event)}>
      <Grid container>
        <Stack gap={1} sx={{ padding: '1em', width: '100%' }}>
          <Grid>
            <TextField
              sx={{ width: '100%' }}
              {...register('name')}
              fullWidth
              variant="outlined"
              margin="dense"
              InputLabelProps={{ shrink: true }}
              label={'Name'}
              error={!!errors.name}
              helperText={errors.name && `${errors.name.message}`}
              inputProps={{
                maxLength: 100,
                'data-testid': 'filter-modal-name',
              }}
            />
          </Grid>
        </Stack>

        <Grid container justifyContent="flex-end">
          <Stack spacing={2} direction="row" justifyContent="end">
            <Button
              data-testid="release-modal-save"
              variant="contained"
              type="submit"
              color="primary"
              disabled={!isDirty}
            >
              Save
            </Button>
            <Button
              variant="contained"
              type="button"
              color="error"
              onClick={handleClose}
            >
              Cancel
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
}

export default TicketFilterUpdate;

const schema = yup
  .object()
  .shape({
    name: yup
      .string()
      .trim()
      .required('Name is a required field')
      .test(
        'unicode',
        'Unicode characters are not allowed',
        val => !isDoubleByte(val),
      ),
  })
  .required();
