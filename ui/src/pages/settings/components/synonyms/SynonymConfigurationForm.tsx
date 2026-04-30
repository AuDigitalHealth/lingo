import {
  SynonymConfiguration,
  SynonymConfigurationDto,
} from '../../../../types/tickets/ticket.ts';

import { Button, Grid, Stack, TextField } from '@mui/material';

import { useForm } from 'react-hook-form';
import TicketsService from '../../../../api/TicketsService.ts';
import { useServiceStatus } from '../../../../hooks/api/useServiceStatus.tsx';
import { snowstormErrorHandler } from '../../../../types/ErrorHandler.ts';
import { useQueryClient } from '@tanstack/react-query';
import { synonymConfigurationsQueryKey } from '../../../../types/queryKeys.ts';
import { yupResolver } from '@hookform/resolvers/yup';

import * as yup from 'yup';
import { isDoubleByte } from '../../../../utils/helpers/validationUtils.ts';
import { useEffect } from 'react';

interface SynonymConfigurationFormProps {
  handleClose: () => void;
  synonymConfiguration?: SynonymConfiguration;
}

function SynonymConfigurationForm({
  handleClose,
  synonymConfiguration,
}: SynonymConfigurationFormProps) {
  const { serviceStatus } = useServiceStatus();
  const queryClient = useQueryClient();
  const isEditing = !!synonymConfiguration;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      searchString: '',
      replacementString: '',
    },
  });

  useEffect(() => {
    if (synonymConfiguration) {
      reset({
        searchString: synonymConfiguration.searchString,
        replacementString: synonymConfiguration.replacementString,
      });
    }
  }, [synonymConfiguration, reset]);

  const saveSynonymConfiguration = (data: SynonymConfigurationDto) => {
    const apiCall = isEditing
      ? TicketsService.updateSynonymConfiguration(
          synonymConfiguration.id!,
          data,
        )
      : TicketsService.createSynonymConfiguration(data);

    void apiCall
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: [synonymConfigurationsQueryKey],
        });
      })
      .catch(err => {
        snowstormErrorHandler(
          err,
          `Failed to ${isEditing ? 'update' : 'create'} synonym configuration`,
          serviceStatus,
        );
      })
      .finally(() => {
        handleClose();
      });
  };

  return (
    <form
      onSubmit={event => void handleSubmit(saveSynonymConfiguration)(event)}
    >
      <Grid container>
        <Stack gap={1} sx={{ padding: '1em', width: '100%' }}>
          <Grid>
            <TextField
              sx={{ width: '100%' }}
              {...register('searchString')}
              fullWidth
              variant="outlined"
              margin="dense"
              InputLabelProps={{ shrink: true }}
              label={'Search String*'}
              error={!!errors.searchString}
              helperText={
                errors.searchString && `${errors.searchString.message}`
              }
              inputProps={{
                maxLength: 255,
                'data-testid': 'synonym-configuration-modal-search-string',
              }}
            />
          </Grid>

          <Grid>
            <TextField
              sx={{ width: '100%' }}
              {...register('replacementString')}
              fullWidth
              variant="outlined"
              margin="dense"
              InputLabelProps={{ shrink: true }}
              label={'Replacement String*'}
              error={!!errors.replacementString}
              helperText={
                errors.replacementString &&
                `${errors.replacementString.message}`
              }
              inputProps={{
                maxLength: 255,
                'data-testid': 'synonym-configuration-modal-replacement-string',
              }}
            />
          </Grid>
        </Stack>

        <Grid container justifyContent="flex-end">
          <Stack spacing={2} direction="row" justifyContent="end">
            <Button
              data-testid="synonym-configuration-modal-save"
              variant="contained"
              type="submit"
              color="primary"
              disabled={!isDirty}
            >
              {isEditing ? 'Update' : 'Save'}
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

export default SynonymConfigurationForm;

const schema = yup.object().shape({
  searchString: yup
    .string()
    .trim()
    .required('Search String is a required field')
    .test(
      'unicode',
      'Unicode characters are not allowed',
      val => !isDoubleByte(val),
    ),
  replacementString: yup
    .string()
    .trim()
    .required('Replacement String is a required field')
    .test(
      'unicode',
      'Unicode characters are not allowed',
      val => !isDoubleByte(val),
    ),
});
