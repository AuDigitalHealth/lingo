import {
  AdditionalFieldTypeEnum,
  AdditionalFieldValue,
  ExternalRequestorBasic,
  LabelBasic,
  Ticket,
} from '../../../../types/tickets/ticket';
import {
  Card,
  CardActionArea,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import LabelChip from '../../components/LabelChip';
import useTicketStore from '../../../../stores/TicketStore';
import { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import TicketFieldsEdit from './edit/TicketFieldsEdit';
import { Link } from 'react-router-dom';
import ExternalRequestorChip from '../../components/ExternalRequestorChip.tsx';
import { isTaskCurrent } from '../../components/grid/helpers/isTaskCurrent.ts';
import useSearchTaskByKey from '../../../../hooks/api/task/useSearchTaskByKey.tsx';
import { TaskTypographyTemplate } from '../../components/grid/Templates.tsx';

import { TaskStatusIcon } from '../../../../components/icons/TaskStatusIcon.tsx';
import { useAllTasks } from '../../../../hooks/api/useAllTasks.tsx';

interface TicketFieldsProps {
  ticket?: Ticket;
  isCondensed?: boolean;
  editable?: boolean;
}
export default function TicketFields({
  ticket,
  isCondensed,
  editable,
}: TicketFieldsProps) {
  const { labelTypes, externalRequestors } = useTicketStore();
  const [editMode, setEditMode] = useState(false);

  const createLabelBasic = (name: string, id: number): LabelBasic => {
    return {
      labelTypeId: id.toString(),
      labelTypeName: name,
    };
  };
  const createExternalRequestorBasic = (
    name: string,
    id: number,
  ): ExternalRequestorBasic => {
    return {
      externalRequestorId: id.toString(),
      externalRequestorName: name,
    };
  };
  const theXs = isCondensed ? 3.5 : 1.5;
  const theMinWidth = isCondensed ? '400px' : '850px';

  const formatField = (item: AdditionalFieldValue) => {
    return item.additionalFieldType.type === AdditionalFieldTypeEnum.DATE
      ? new Date(Date.parse(item.valueOf)).toLocaleDateString('en-AU')
      : item.valueOf;
  };

  if (editMode) {
    return <TicketFieldsEdit ticket={ticket} setEditMode={setEditMode} />;
  } else {
    return (
      <>
        <Stack direction={'column'} gap={2}>
          <Grid container spacing={2} sx={{ minWidth: theMinWidth }}>
            <Grid item xs={theXs} key={'label-label'}>
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{ display: 'block', width: '120px' }}
              >
                Labels:
              </Typography>
            </Grid>
            <Grid item xs={8} sx={{ padding: '0px !important' }}>
              <Grid container spacing={2} sx={{ margin: 0, padding: 0 }}>
                {ticket?.labels?.map((label, index) => {
                  const labelVal = createLabelBasic(label.name, label.id);
                  return (
                    <Grid item key={index}>
                      <LabelChip
                        labelTypeList={labelTypes}
                        labelVal={labelVal}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
            {editable && (
              <LoadingButton
                id="ticket-fields-edit"
                variant="text"
                size="small"
                color="info"
                sx={{ marginLeft: 'auto', maxHeight: '2em' }}
                onClick={() => {
                  setEditMode(true);
                }}
              >
                EDIT
              </LoadingButton>
            )}
          </Grid>

          <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
            <Grid item xs={theXs}>
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{ display: 'block', width: '120px' }}
              >
                External Requesters:
              </Typography>
            </Grid>
            <Grid item xs={8} sx={{ padding: '0px !important' }}>
              <Grid container spacing={2} sx={{ margin: 0, padding: 0 }}>
                {ticket?.externalRequestors?.map((externalRequestor, index) => {
                  const externalRequestorVal = createExternalRequestorBasic(
                    externalRequestor.name,
                    externalRequestor.id,
                  );
                  return (
                    <Grid item key={index}>
                      <ExternalRequestorChip
                        externalRequestorList={externalRequestors}
                        externalRequestorVal={externalRequestorVal}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={theXs}>
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{ display: 'block', width: '120px' }}
              >
                Additional Fields:
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Grid container spacing={2}>
                {ticket?.['ticket-additional-fields']?.map((item, index) => {
                  const title = item.additionalFieldType.description;
                  return (
                    <Grid item xs="auto" key={index}>
                      <Card sx={{ padding: '5px' }}>
                        <CardActionArea>
                          <Typography variant="caption" fontWeight="bold">
                            {title}
                          </Typography>
                          <Divider></Divider>
                          <Typography
                            variant="body1"
                            sx={{ paddingTop: '5px' }}
                          >
                            {formatField(item)}
                          </Typography>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={theXs}>
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{ display: 'block', width: '120px' }}
              >
                Iteration:
              </Typography>
            </Grid>
            {ticket?.iteration?.name ? (
              <Grid item>
                <Chip
                  color={'warning'}
                  label={ticket?.iteration?.name}
                  size="small"
                />
              </Grid>
            ) : (
              <></>
            )}
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={theXs}>
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{ display: 'block', width: '120px' }}
              >
                State:
              </Typography>
            </Grid>
            {ticket?.state?.label ? (
              <Grid item>
                <Chip
                  color={'primary'}
                  label={ticket?.state.label}
                  size="small"
                />
              </Grid>
            ) : (
              <></>
            )}
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={theXs}>
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{ display: 'block', width: '120px' }}
              >
                Schedule:
              </Typography>
            </Grid>
            {ticket?.schedule?.name ? (
              <Grid item>
                <Typography variant="caption">
                  {ticket?.schedule.name}
                </Typography>
              </Grid>
            ) : (
              <></>
            )}
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={theXs}>
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{ display: 'block', width: '120px' }}
              >
                Priority:
              </Typography>
            </Grid>
            {ticket?.priorityBucket ? (
              <Grid item>
                <Chip
                  color={'primary'}
                  label={ticket?.priorityBucket.name}
                  size="small"
                />
              </Grid>
            ) : (
              <></>
            )}
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={theXs} key={'state-label'}>
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{ display: 'block', width: '120px' }}
              >
                Task:
              </Typography>
            </Grid>
            <TaskAssociationField ticket={ticket} />
          </Grid>
        </Stack>
      </>
    );
  }
}

interface TaskAssociationFieldProps {
  ticket?: Ticket;
}
function TaskAssociationField({ ticket }: TaskAssociationFieldProps) {
  const { allTasks } = useAllTasks();
  const currentTask = ticket ? isTaskCurrent(ticket, allTasks) : undefined;

  const searchTaskByKeyQuery = useSearchTaskByKey(
    currentTask,
    ticket?.taskAssociation?.taskId,
  );

  const searchedTask = searchTaskByKeyQuery?.data?.find(task => {
    return task.key === ticket?.taskAssociation?.taskId;
  });

  if (ticket?.taskAssociation && currentTask) {
    return (
      <Stack alignItems={'center'} gap={1} direction={'row'}>
        <Link
          to={`/dashboard/tasks/edit/${ticket?.taskAssociation.taskId}/${ticket.id}`}
        >
          {ticket?.taskAssociation.taskId}
        </Link>
        <TaskStatusIcon status={currentTask?.status} />
      </Stack>
    );
  } else if (ticket?.taskAssociation?.taskId === 'AUAMT-196') {
    return (
      <Stack alignItems={'center'} gap={1} direction={'row'}>
        <TaskTypographyTemplate taskKey={ticket?.taskAssociation?.taskId} />
        <TaskStatusIcon status={searchedTask?.status} />
      </Stack>
    );
  }

  return <></>;
}
