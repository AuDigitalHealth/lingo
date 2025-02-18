import { ExternalProcessDto } from '../../../../types/tickets/ticket.ts';

import {
  Button,
  Grid,
  Stack,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

import { useForm } from 'react-hook-form';
import TicketsService from '../../../../api/TicketsService.ts';
import { useServiceStatus } from '../../../../hooks/api/useServiceStatus.tsx';
import { snowstormErrorHandler } from '../../../../types/ErrorHandler.ts';
import { useQueryClient } from '@tanstack/react-query';
import { externalProcessesQueryKey } from '../../../../types/queryKeys.ts';
import { yupResolver } from '@hookform/resolvers/yup';

import * as yup from 'yup';
import { isDoubleByte } from '../../../../utils/helpers/validationUtils.ts';

interface ExternalProcessCreateProps {
  handleClose: () => void;
}
function ExternalProcessCreate({ handleClose }: ExternalProcessCreateProps) {
  const { serviceStatus } = useServiceStatus();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      processName: '',
      enabled: false,
    },
  });

  const saveExternalProcess = (data: ExternalProcessDto) => {
    void TicketsService.createExternalProcess(data)
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: [externalProcessesQueryKey],
        });
      })
      .catch(err => {
        snowstormErrorHandler(err, `Failed to create process`, serviceStatus);
      })
      .finally(() => {
        handleClose();
      });
  };

  return (
    <form onSubmit={event => void handleSubmit(saveExternalProcess)(event)}>
      <Grid container>
        <Stack gap={1} sx={{ padding: '1em', width: '100%' }}>
          <Grid>
            <TextField
              sx={{ width: '100%' }}
              {...register('processName')}
              fullWidth
              variant="outlined"
              margin="dense"
              InputLabelProps={{ shrink: true }}
              label={'Process Name*'}
              error={!!errors.processName}
              helperText={errors.processName && `${errors.processName.message}`}
              inputProps={{
                maxLength: 100,
                'data-testid': 'external-process-modal-name',
              }}
            />
          </Grid>

          <Grid>
            <FormControlLabel
              control={
                <Checkbox
                  {...register('enabled')}
                  data-testid="external-process-modal-enabled"
                />
              }
              label="Enabled"
            />
          </Grid>
        </Stack>

        <Grid container justifyContent="flex-end">
          <Stack spacing={2} direction="row" justifyContent="end">
            <Button
              data-testid="external-process-modal-save"
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

export default ExternalProcessCreate;

const schema = yup.object().shape({
  processName: yup
    .string()
    .trim()
    .required('Process Name is a required field')
    .test(
      'unicode',
      'Unicode characters are not allowed',
      val => !isDoubleByte(val),
    ),
  enabled: yup.boolean().required('Enabled is a required field'),
});
