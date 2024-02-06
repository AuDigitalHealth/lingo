import { LabelType, LabelTypeDto } from '../../../../types/tickets/ticket.ts';
import React, { useEffect } from 'react';

import { Autocomplete, Button, Grid, TextField } from '@mui/material';
import { Stack } from '@mui/system';

import { Controller, useForm, useFormState } from 'react-hook-form';
import { ValidationColor } from '../../../../types/validationColor.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import { useServiceStatus } from '../../../../hooks/api/useServiceStatus.tsx';
import { snowstormErrorHandler } from '../../../../types/ErrorHandler.ts';
import { useQueryClient } from '@tanstack/react-query';
import { ticketLabelsKey } from '../../../../types/queryKeys.ts';
import { yupResolver } from '@hookform/resolvers/yup';

import * as yup from 'yup';

interface LabelCreateOrUpdateProps {
  labelType?: LabelType;
  handleClose: () => void;
}
function LabelCreateOrUpdate({
  labelType,
  handleClose,
}: LabelCreateOrUpdateProps) {
  const { serviceStatus } = useServiceStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (labelType) {
      reset(labelType);
    }
  }, [labelType]);

  const {
    register,
    control,
    reset,
    handleSubmit,

    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const validationColors: ValidationColor[] = Object.entries(
    ValidationColor,
  ).map(function (type: [string, ValidationColor]) {
    return type[1];
  });
  const saveLabelType = (data: LabelTypeDto) => {
    if (labelType?.id) {
      void TicketsService.updateLabelType(labelType.id, data)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: [ticketLabelsKey],
          });
        })
        .catch(err => {
          snowstormErrorHandler(err, `Failed to update label`, serviceStatus);
        });
    } else {
      void TicketsService.createLabelType(data)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: [ticketLabelsKey],
          });
        })
        .catch(err => {
          snowstormErrorHandler(err, `Failed to create label`, serviceStatus);
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
    <form onSubmit={event => void handleSubmit(saveLabelType)(event)}>
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
              label={'Label'}
              error={!!errors.name}
              helperText={errors.name && `${errors.name.message}`}
            />
          </Grid>

          <Grid>
            <TextField
              multiline={true}
              rows={3}
              {...register('description')}
              fullWidth
              variant="outlined"
              margin="dense"
              InputLabelProps={{ shrink: true }}
              label={'Description'}
              error={!!errors.description}
              helperText={errors.description && `${errors.description.message}`}
            />
          </Grid>
          <Grid>
            <Controller
              name={'displayColor'}
              control={control}
              render={({ field: { onChange, value, onBlur }, ...props }) => (
                <Autocomplete
                  options={validationColors}
                  fullWidth
                  getOptionLabel={option => option}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label={'Display Color'}
                      error={!!errors.displayColor}
                      helperText={
                        errors.displayColor ? errors.displayColor.message : ' '
                      }
                    />
                  )}
                  onBlur={onBlur}
                  onChange={(e, data) => onChange(data)}
                  {...props}
                  value={value || null}
                />
              )}
            />
          </Grid>
        </Stack>

        <Grid container justifyContent="flex-end">
          <Stack spacing={2} direction="row" justifyContent="end">
            <Button
              variant="contained"
              type="button"
              color="error"
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              type="submit"
              color="primary"
              disabled={!isDirty}
            >
              Save
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
}

export default LabelCreateOrUpdate;

const schema = yup
  .object()
  .shape({
    name: yup.string().trim().required('Label is a required field'),
    description: yup
      .string()
      .trim()
      .required('Description is a required field'),
    displayColor: yup
      .mixed<ValidationColor>()
      .oneOf(Object.values(ValidationColor))
      .defined('Display Color is a required field'),
  })
  .required();
