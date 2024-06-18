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
import useTaskStore from '../../../../stores/TaskStore.ts';
import useSearchTaskByKey from '../../../../hooks/api/task/useSearchTaskByKey.tsx';
import { Task } from '../../../../types/task.ts';
import { TaskTypographyTemplate } from '../../components/grid/Templates.tsx';
import { TaskStatus } from '../../../../types/task.ts';

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
        <Grid
          container
          spacing={2}
          sx={{ marginBottom: '20px', minWidth: theMinWidth }}
          key={'main-container'}
        >
          <Grid item xs={theXs} key={'label-label'}>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ display: 'block', width: '120px' }}
            >
              Labels:
            </Typography>
          </Grid>
          <Grid
            item
            xs={8}
            sx={{ padding: '0px !important' }}
            key={'labels-container'}
          >
            <Grid container spacing={2} sx={{ margin: 0, padding: 0 }}>
              {ticket?.labels?.map((label, index) => {
                const labelVal = createLabelBasic(label.name, label.id);
                return (
                  <Grid item key={index}>
                    <LabelChip labelTypeList={labelTypes} labelVal={labelVal} />
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
          <Grid item xs={theXs} key={'external-requestors-label'}>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ display: 'block', width: '120px' }}
            >
              External Requesters:
            </Typography>
          </Grid>
          <Grid
            item
            xs={8}
            sx={{ padding: '0px !important' }}
            key={'external-requestors-container'}
          >
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

        <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
          <Grid item xs={theXs} key={'additionalfields-label'}>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ display: 'block', width: '120px' }}
            >
              Additional Fields:
            </Typography>
          </Grid>
          <Grid
            item
            xs={8}
            sx={{ ml: '-12px' }}
            key={'additionalfields-container'}
          >
            <Grid container spacing={2} sx={{ paddingLeft: 1, ml: '-12px' }}>
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
                        <Typography variant="body1" sx={{ paddingTop: '5px' }}>
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
        <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
          <Grid item xs={theXs} key={'iteration-label'}>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ display: 'block', width: '120px' }}
            >
              Iteration:
            </Typography>
          </Grid>
          {ticket?.iteration?.name ? (
            <Grid item key={ticket.iteration?.id}>
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
        <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
          <Grid item xs={theXs} key={'state-label'}>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ display: 'block', width: '120px' }}
            >
              State:
            </Typography>
          </Grid>
          {ticket?.state?.label ? (
            <Grid item key={ticket?.state.id}>
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
        <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
          <Grid item xs={theXs} key={'state-label'}>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ display: 'block', width: '120px' }}
            >
              Schedule:
            </Typography>
          </Grid>
          {ticket?.schedule?.name ? (
            <Grid item key={ticket?.schedule.id}>
              <Typography variant="caption">{ticket?.schedule.name}</Typography>
            </Grid>
          ) : (
            <></>
          )}
        </Grid>
        <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
          <Grid item xs={theXs} key={'state-label'}>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ display: 'block', width: '120px' }}
            >
              Priority:
            </Typography>
          </Grid>
          {ticket?.priorityBucket ? (
            <Grid item key={ticket?.priorityBucket.id}>
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
        <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
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
      </>
    );
  }
}

interface TaskAssociationFieldProps {
  ticket?: Ticket;
}
function TaskAssociationField({ ticket }: TaskAssociationFieldProps) {
  const { allTasks } = useTaskStore();
  const currentTask = ticket ? isTaskCurrent(ticket, allTasks) : undefined;

  const searchTaskByKeyQuery = useSearchTaskByKey(
    currentTask,
    ticket?.taskAssociation?.taskId,
  );

  if (ticket?.taskAssociation && currentTask) {
    return (
      <Grid item key={ticket?.taskAssociation.id}>
        <Link
          to={`/dashboard/tasks/edit/${ticket?.taskAssociation.taskId}/${ticket.id}`}
        >
          {ticket?.taskAssociation.taskId}
        </Link>
        <TaskStatusIcon
          task={currentTask ? currentTask : searchTaskByKeyQuery.data}
        />
      </Grid>
    );
  } else if (ticket?.taskAssociation && !currentTask) {
    <Grid item key={ticket?.taskAssociation.id}>
      <TaskTypographyTemplate taskKey={ticket?.taskAssociation.taskId} />
      <TaskStatusIcon
        task={currentTask ? currentTask : searchTaskByKeyQuery.data}
      />
    </Grid>;
  } else {
    <></>;
  }

  return <></>;
}

interface TaskStatusIconProps {
  task?: Task;
}
function TaskStatusIcon({ task }: TaskStatusIconProps) {
  const renderIcon = (status: TaskStatus) => {
    return <></>;
    // switch (status) {
    //   case TaskStatus.Completed:
    //     return <HomePage />;
    //   case TaskStatus.Promoted:
    //     return <AboutPage />;
    //   case TaskStatus.InProgress:
    //     return <ContactPage />;
    //   case TaskStatus.InReview:
    //     return <ContactPage />;
    //   case TaskStatus.ReviewCompleted:
    //     return <ContactPage />;
    //   case TaskStatus.New:
    //     return <ContactPage />;
    //   case TaskStatus.Deleted:
    //     return <ContactPage />;
    //   case TaskStatus.Unknown:
    //     return <ContactPage />;
    //     // actual deleted one
    //   default:
    //     return <NotFoundPage />;
    // }
  };
  return <>{task?.status ? <>{renderIcon(task?.status)}</> : <></>}</>;
}
