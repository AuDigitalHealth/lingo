import { Iteration, IterationDto } from '../../../../types/tickets/ticket.ts';
import React, { useEffect } from 'react';

import { Button, FormControlLabel, Grid, TextField } from '@mui/material';
import { Stack } from '@mui/system';

import { Controller, useForm, useFormState } from 'react-hook-form';

import TicketsService from '../../../../api/TicketsService.ts';
import { useServiceStatus } from '../../../../hooks/api/useServiceStatus.tsx';
import { snowstormErrorHandler } from '../../../../types/ErrorHandler.ts';
import { useQueryClient } from '@tanstack/react-query';
import { ticketIterationsKey } from '../../../../types/queryKeys.ts';
import { yupResolver } from '@hookform/resolvers/yup';

import * as yup from 'yup';
import { isDoubleByte } from '../../../../utils/helpers/validationUtils.ts';
import { DesktopDatePicker } from '@mui/x-date-pickers';

import Checkbox from '@mui/material/Checkbox';
import dayjs from 'dayjs';

interface ReleaseCreateOrUpdateProps {
  iteration?: Iteration;
  handleClose: () => void;
}
function ReleaseCreateOrUpdate({
  iteration,
  handleClose,
}: ReleaseCreateOrUpdateProps) {
  const { serviceStatus } = useServiceStatus();
  const queryClient = useQueryClient();

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
    if (iteration) {
      reset(iteration);
    }
  }, [iteration, reset]);

  const saveIteration = (data: IterationDto) => {
    // data.startDate="2019-08-14T09:25:50.136Z";
    if (iteration?.id) {
      void TicketsService.updateIteration(iteration.id, data)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: [ticketIterationsKey],
          });
        })
        .catch(err => {
          snowstormErrorHandler(err, `Failed to update release`, serviceStatus);
        });
    } else {
      void TicketsService.createIteration(data)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: [ticketIterationsKey],
          });
        })
        .catch(err => {
          snowstormErrorHandler(err, `Failed to create release`, serviceStatus);
        })
        .finally(() => {
          handleClose();
        });
    }

    handleClose();
  };
  const { dirtyFields } = useFormState({ control });
  const isDirty = Object.keys(dirtyFields).length > 0;
  return (
    <form onSubmit={event => void handleSubmit(saveIteration)(event)}>
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
              label={'Release*'}
              error={!!errors.name}
              helperText={errors.name && `${errors.name.message}`}
              inputProps={{ maxLength: 100 }}
            />
          </Grid>

          <Grid>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => {
                return (
                  <DesktopDatePicker
                    value={field.value ? dayjs(field.value) : null}
                    label={'Start Date*'}
                    onChange={date => {
                      console.log({ date });
                      field.onChange(date ? date.toISOString() : null);
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        error: !!errors.startDate,
                        helperText: errors.startDate?.message,
                      },
                    }}
                  />
                );
              }}
            />
          </Grid>
          <Grid>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => {
                return (
                  <DesktopDatePicker
                    value={field.value ? dayjs(field.value) : null}
                    label={'End Date'}
                    onChange={date => {
                      console.log({ date });
                      field.onChange(date ? date.toISOString() : null);
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        error: !!errors.endDate,
                        helperText: errors.endDate?.message,
                      },
                    }}
                  />
                );
              }}
            />
          </Grid>
          <Grid>
            <Controller
              control={control}
              name={`active`}
              defaultValue={true}
              render={({ field: { onChange, value } }) => (
                <FormControlLabel
                  control={<Checkbox checked={value} onChange={onChange} />}
                  label={'Active'}
                />
              )}
            />
          </Grid>
          <Grid>
            <Controller
              control={control}
              name={`completed`}
              defaultValue={false}
              render={({ field: { onChange, value } }) => (
                <FormControlLabel
                  control={<Checkbox checked={value} onChange={onChange} />}
                  label={'Completed'}
                />
              )}
            />
          </Grid>
        </Stack>

        <Grid container justifyContent="flex-end">
          <Stack spacing={2} direction="row" justifyContent="end">
            <Button
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

export default ReleaseCreateOrUpdate;

const schema = yup
  .object()
  .shape({
    name: yup
      .string()
      .trim()
      .required('Release is a required field')
      .test(
        'unicode',
        'Unicode characters are not allowed',
        val => !isDoubleByte(val),
      ),
    startDate: yup.string().trim().required('Start Date is a required field'),

    endDate: yup
      .string()
      .optional()
      .nullable()
      .test('test dates', '', function (endDate: string | null | undefined) {
        if (endDate) {
          const iterationDto = this.from?.[0].value as IterationDto;
          if (iterationDto && iterationDto.startDate) {
            const start = new Date(iterationDto.startDate);
            const end = new Date(endDate);
            if (start.getTime() > end.getTime()) {
              return this.createError({
                message: 'End Date must be greater than start date',
              });
            }
          }
        }
        return true;
      }),
    active: yup.boolean(),
    completed: yup.boolean(),
  })
  .required();
