import { useState } from 'react';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import { Button, InputLabel, MenuItem, Select, TextField } from '@mui/material';

import { useSnackbar } from 'notistack';

import { Stack } from '@mui/system';

import { useForm } from 'react-hook-form';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore';
import useTaskStore from '../../../stores/TaskStore';
import TasksServices from '../../../api/TasksService';
import { Project } from '../../../types/Project';
import { TaskDto } from '../../../types/task';
import { useNavigate } from 'react-router-dom';
import { useCreateBranchAndUpdateTask } from '../../../hooks/api/task/useInitializeBranch.tsx';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import { unavailableErrorHandler } from '../../../types/ErrorHandler.ts';
import { useQueryClient } from '@tanstack/react-query';

interface TasksCreateModalProps {
  open: boolean;
  handleClose: () => void;
  title: string;
  redirectEnabled?: boolean;
}

type TaskFormValues = {
  title: string;
  description: string;
  count: string;
  project: string;
};
export default function TasksCreateModal({
  open,
  handleClose,
  title,
  redirectEnabled = true,
}: TasksCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const { applicationConfig } = useApplicationConfigStore();
  const { getProjectFromKey, getProjectbyTitle, addTask } = useTaskStore();
  const project = getProjectFromKey(applicationConfig?.apProjectKey);
  const navigate = useNavigate();

  const { register, handleSubmit, formState } = useForm<TaskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      count: '1',
      project: project?.title,
    },
  });

  const { errors, touchedFields } = formState;

  const { enqueueSnackbar } = useSnackbar();
  const mutation = useCreateBranchAndUpdateTask();

  const { serviceStatus } = useServiceStatus();

  const queryClient = useQueryClient();

  const onSubmit = (data: TaskFormValues) => {
    if (!serviceStatus?.authoringPlatform.running) {
      unavailableErrorHandler('', 'Authoring Platform');
      return;
    }
    setLoading(true);

    const project = getProjectbyTitle(data.project);
    if (project === undefined) {
      enqueueSnackbar('Unable to find project', {
        variant: 'error',
      });
      return;
    }
    if (data.count === '1') {
      void createTask(
        project,
        {
          summary: data.title,
          description: data.description,
          projectKey: project.key,
        },
        true,
      );
    } else {
      let n = Number(data.count);
      const promises = [];

      for (n; n > 0; n--) {
        promises.push(
          createTask(
            project,
            {
              summary: data.title + ` #${n}`,
              description: data.description,
              projectKey: project.key,
            },
            n == 1 ? true : false,
          ),
        );
      }

      void Promise.all(promises).then(() => {
        setLoading(false);
        handleClose();
      });
    }
  };

  const createTask = (project: Project, task: TaskDto, redirect: boolean) => {
    return TasksServices.createTask(project.key, task)
      .then(res => {
        addTask(res);
        enqueueSnackbar(`Created Task ${res.key}`, {
          variant: 'success',
        });
        if (redirect) {
          handleClose();
          void queryClient.invalidateQueries({
            queryKey: [`all-tasks-${applicationConfig?.apProjectKey}`],
          });
          if (redirectEnabled) {
            navigate(`/dashboard/tasks/edit/${res.key}`);
          }
        } else {
          mutation.mutate(res);
        }
      })
      .catch(err => {
        enqueueSnackbar(`Error Creating Task ${err}`, {
          variant: 'error',
        });
      })
      .finally(() => {
        handleClose();
        setLoading(false);
      });
  };

  return (
    <BaseModal
      open={open}
      handleClose={!loading ? handleClose : () => null}
      sx={{ minWidth: '400px' }}
    >
      <BaseModalHeader title={title} />
      {/* eslint-disable-next-line */}
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <BaseModalBody>
          <Stack gap={1} sx={{ padding: '1em' }}>
            <TextField
              sx={{ width: '100%' }}
              label="Title"
              type="text"
              {...register('title', {
                required: 'Please enter title',
              })}
              error={!!errors.title}
              helperText={errors.title?.message}
              variant="standard"
              data-testid={'task-create-title'}
            />
            <Stack
              flexDirection={'row'}
              sx={{ width: '100%' }}
              justifyContent={'space-evenly'}
              gap={1}
            >
              <Stack>
                <InputLabel id="task-create-count">Number of Tasks</InputLabel>

                <Select
                  labelId="task-create-count"
                  sx={{ minWidth: '150px' }}
                  {...register('count')}
                  defaultValue={'1'}
                  error={!!errors.count && touchedFields.count}
                >
                  <MenuItem value={'1'}>1</MenuItem>
                  <MenuItem value={'2'}>2</MenuItem>
                  <MenuItem value={'3'}>3</MenuItem>
                  <MenuItem value={'4'}>4</MenuItem>
                  <MenuItem value={'5'}>5</MenuItem>
                </Select>
              </Stack>
              <Stack>
                <InputLabel id="task-create-project">Project</InputLabel>
                <Select
                  data-testid={'task-create-project'}
                  labelId="task-create-project"
                  {...register('project')}
                  defaultValue={project?.title}
                  error={!!errors.project && touchedFields.project}
                  sx={{ minWidth: '150px' }}
                >
                  {project?.title && (
                    <MenuItem
                      value={project?.title}
                      data-testid={`project-option-${project.key}`}
                    >
                      {project?.title}
                    </MenuItem>
                  )}
                </Select>
              </Stack>
            </Stack>

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
              <Button
                data-testid={'create-task-modal'}
                color="primary"
                size="small"
                variant="contained"
                type="submit"
                // onClick={() => handleSubmit(onSubmit)}
                disabled={loading}
              >
                Create Task
              </Button>
              <Button
                color="error"
                size="small"
                variant="contained"
                onClick={!loading ? handleClose : () => null}
                disabled={loading}
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
