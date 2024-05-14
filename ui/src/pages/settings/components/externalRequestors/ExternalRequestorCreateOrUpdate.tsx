import {
  ExternalRequestor,
  ExternalRequestorDto,
} from '../../../../types/tickets/ticket.ts';
import React, { useEffect } from 'react';

import { Autocomplete, Box, Button, Grid, TextField } from '@mui/material';
import { Stack } from '@mui/system';

import { Controller, useForm, useFormState } from 'react-hook-form';
import TicketsService from '../../../../api/TicketsService.ts';
import { useServiceStatus } from '../../../../hooks/api/useServiceStatus.tsx';
import { snowstormErrorHandler } from '../../../../types/ErrorHandler.ts';
import { useQueryClient } from '@tanstack/react-query';
import { ticketExternalRequestors } from '../../../../types/queryKeys.ts';
import { yupResolver } from '@hookform/resolvers/yup';

import * as yup from 'yup';
import { isDoubleByte } from '../../../../utils/helpers/validationUtils.ts';
import { ColorCode, getColorCodeKey } from '../../../../types/ColorCode.ts';
import CloseIcon from '@mui/icons-material/Close';

interface ExternalRequestorCreateOrUpdateProps {
  externalRequestor?: ExternalRequestor;
  handleClose: () => void;
}
function ExternalRequestorCreateOrUpdate({
  externalRequestor,
  handleClose,
}: ExternalRequestorCreateOrUpdateProps) {
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
    if (externalRequestor) {
      reset(externalRequestor);
    }
  }, [externalRequestor, reset]);

  const colorOptions: ColorCode[] = Object.entries(ColorCode).map(function (
    type: [string, ColorCode],
  ) {
    return type[1];
  });
  const saveExternalRequestor = (data: ExternalRequestorDto) => {
    if (externalRequestor?.id) {
      void TicketsService.updateExternalRequestor(externalRequestor.id, data)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: [ticketExternalRequestors],
          });
        })
        .catch(err => {
          snowstormErrorHandler(
            err,
            `Failed to update external requester`,
            serviceStatus,
          );
        });
    } else {
      void TicketsService.createExternalRequestor(data)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: [ticketExternalRequestors],
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
    <form onSubmit={event => void handleSubmit(saveExternalRequestor)(event)}>
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
              label={'External Requester*'}
              error={!!errors.name}
              helperText={errors.name && `${errors.name.message}`}
              inputProps={{
                maxLength: 100,
                'data-testid': 'external-requestor-modal-name',
              }}
            />
          </Grid>

          <Grid>
            <TextField
              multiline={true}
              rows={3}
              inputProps={{
                'data-testid': 'external-requestor-modal-description',
              }}
              {...register('description')}
              fullWidth
              variant="outlined"
              margin="dense"
              InputLabelProps={{ shrink: true }}
              label={'Description*'}
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
                  data-testid="external-requestor-modal-autocomplete"
                  options={colorOptions}
                  fullWidth
                  getOptionLabel={option => getColorCodeKey(option)}
                  renderOption={(props, option, { selected }) => (
                    <li
                      {...props}
                      data-testid={'li-color-option-' + getColorCodeKey(option)}
                    >
                      <Box
                        data-testid={'color-option- ' + option}
                        component="span"
                        sx={{
                          width: 14,
                          height: 14,
                          flexShrink: 0,
                          borderRadius: '3px',
                          mr: 1,
                          mt: '2px',
                        }}
                        style={{ backgroundColor: option }}
                      />
                      <Box
                        sx={{
                          flexGrow: 1,
                          '& span': {
                            color: '#8b949e',
                          },
                        }}
                      >
                        {getColorCodeKey(option)}
                      </Box>
                      <Box
                        component={CloseIcon}
                        sx={{ opacity: 0.6, width: 18, height: 18 }}
                        style={{
                          visibility: selected ? 'visible' : 'hidden',
                        }}
                      />
                    </li>
                  )}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label={'Display Colour*'}
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
              data-testid="external-requestor-modal-save"
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

export default ExternalRequestorCreateOrUpdate;

const schema = yup
  .object()
  .shape({
    name: yup
      .string()
      .trim()
      .required('External Requester is a required field')
      .test(
        'unicode',
        'Unicode characters are not allowed',
        val => !isDoubleByte(val),
      ),
    description: yup
      .string()
      .trim()
      .required('Description is a required field'),
    displayColor: yup
      .mixed<ColorCode>()
      .defined('Display Color is a required field'),
  })
  .required();
