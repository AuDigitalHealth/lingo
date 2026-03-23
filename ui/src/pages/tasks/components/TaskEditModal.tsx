import { useEffect } from 'react';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import { Button, TextField } from '@mui/material';
import { Stack } from '@mui/system';
import { useForm } from 'react-hook-form';
import { Task } from '../../../types/task';
import { useEditTaskMutation } from '../../../hooks/api/task/useEditTaskMutation';
import { LoadingButton } from '@mui/lab';

interface TaskEditModalProps {
  open: boolean;
  handleClose: () => void;
  task: Task;
}

type TaskEditFormValues = {
  title: string;
  description: string;
};

export default function TaskEditModal({
  open,
  handleClose,
  task,
}: Readonly<TaskEditModalProps>) {
  const mutation = useEditTaskMutation();

  const defaultValues = {
    title: task.summary,
    description: task.description ?? '',
  };

  const { register, handleSubmit, formState, reset } =
    useForm<TaskEditFormValues>({ defaultValues });

  const { errors } = formState;

  useEffect(() => {
    if (open) {
      reset({ title: task.summary, description: task.description ?? '' });
    }
  }, [open, task.summary, task.description, reset]);

  const onSubmit = (data: TaskEditFormValues) => {
    mutation.mutate(
      {
        projectKey: task.projectKey,
        taskKey: task.key,
        summary: data.title,
        description: data.description,
      },
      {
        onSuccess: () => handleClose(),
      },
    );
  };

  return (
    <BaseModal
      open={open}
      handleClose={!mutation.isPending ? handleClose : () => null}
      sx={{ minWidth: '400px' }}
      keepMounted={false}
    >
      <BaseModalHeader title="Edit Task" />
      {/* eslint-disable-next-line */}
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <BaseModalBody>
          <Stack gap={1} sx={{ padding: '1em' }}>
            <TextField
              sx={{ width: '100%' }}
              label="Title"
              type="text"
              {...register('title', {
                required: 'Please enter a title',
              })}
              error={!!errors.title}
              helperText={errors.title?.message}
              variant="standard"
            />
            <TextField
              label="Task Details"
              minRows={10}
              multiline
              autoCorrect="false"
              {...register('description')}
            />
          </Stack>
        </BaseModalBody>
        <BaseModalFooter
          startChildren={<></>}
          endChildren={
            <Stack flexDirection={'row'} gap={1}>
              <LoadingButton
                color="primary"
                size="small"
                variant="contained"
                type="submit"
                loading={mutation.isPending}
              >
                Save
              </LoadingButton>
              <Button
                color="error"
                size="small"
                variant="contained"
                onClick={!mutation.isPending ? handleClose : () => null}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
            </Stack>
          }
        />
      </form>
    </BaseModal>
  );
}
