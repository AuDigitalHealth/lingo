import { Stack } from '@mui/system';
import useJiraUserStore from '../../../../stores/JiraUserStore';
import useTicketStore from '../../../../stores/TicketStore';
import { JiraUser } from '../../../../types/JiraUserResponse';
import {
  AdditionalFieldValue,
  Iteration,
  LabelType,
  State,
  Ticket,
  TicketDto,
} from '../../../../types/tickets/ticket';
import CustomStateSelection, { StateItemDisplay } from './CustomStateSelection';
import CustomTicketAssigneeSelection from './CustomTicketAssigneeSelection';
import CustomTicketLabelSelection, {
  LabelTypeItemDisplay,
} from './CustomTicketLabelSelection';
import GravatarWithTooltip from '../../../../components/GravatarWithTooltip';
import { ListItemText } from '@mui/material';
import CustomIterationSelection, {
  IterationItemDisplay,
} from './CustomIterationSelection';
import CustomPrioritySelection from './CustomPrioritySelection';
import { Link } from 'react-router-dom';

export const TitleTemplate = (rowData: TicketDto) => {
  return (
    <Link to={`/dashboard/tickets/individual/${rowData.id}`} className="link">
      {rowData.title}
    </Link>
  );
};

export const PriorityBucketTemplate = (rowData: TicketDto) => {
  const { priorityBuckets } = useTicketStore();
  // const priorityBucket = getPriorityValue(rowData.priorityBucket, priorityBuckets);
  return (
    <CustomPrioritySelection
      id={rowData.id.toString()}
      priorityBucket={rowData.priorityBucket}
      priorityBucketList={priorityBuckets}
    />
  );
};

export const ScheduleTemplate = (rowData: TicketDto) => {
  const thisAdditionalFieldTypeValue = MapAdditionalFieldValueToType(
    rowData['ticket-additional-fields'],
    'Schedule',
  );

  return <>{thisAdditionalFieldTypeValue?.valueOf}</>;
};

export const MapAdditionalFieldValueToType = (
  value: AdditionalFieldValue[] | undefined,
  fieldType: string,
): AdditionalFieldValue | undefined => {
  return value?.find(item => {
    return (
      item.additionalFieldType.name.toLowerCase() == fieldType.toLowerCase()
    );
  });
};

export const IterationTemplate = (rowData: TicketDto) => {
  const { iterations } = useTicketStore();
  return (
    <CustomIterationSelection
      id={rowData.id.toString()}
      iterationList={iterations}
      iteration={rowData.iteration}
    />
  );
};

export const StateTemplate = (rowData: TicketDto) => {
  const { availableStates } = useTicketStore();
  return (
    <CustomStateSelection
      id={rowData.id.toString()}
      stateList={availableStates}
      state={rowData.state}
    />
  );
};

export const LabelsTemplate = (rowData: TicketDto) => {
  const { labelTypes } = useTicketStore();
  return (
    <CustomTicketLabelSelection
      labelTypeList={labelTypes}
      typedLabels={rowData.labels}
      id={rowData.id.toString()}
    />
  );
};

export const AssigneeTemplate = (rowData: TicketDto) => {
  const { jiraUsers } = useJiraUserStore();

  return (
    <CustomTicketAssigneeSelection
      id={rowData.id.toString()}
      user={rowData.assignee}
      userList={jiraUsers}
    />
  );
};

export const LabelItemTemplate = (labelType: LabelType) => {
  return <LabelTypeItemDisplay labelType={labelType} />;
};

export const StateItemTemplate = (state: State) => {
  return <StateItemDisplay localState={state} />;
};

export const AssigneeItemTemplate = (user: JiraUser) => {
  const { jiraUsers } = useJiraUserStore();
  return (
    <>
      <Stack direction="row" spacing={2}>
        <GravatarWithTooltip username={user.name} userList={jiraUsers} />
        <ListItemText primary={user.displayName} />
      </Stack>
    </>
  );
};

export const IterationItemTemplate = (iteration: Iteration) => {
  return (
    <>
      <IterationItemDisplay iteration={iteration} />
    </>
  );
};

export const TaskAssocationTemplate = (rowData: Ticket) => {
  return (
    <Link
      to={`/dashboard/tasks/edit/${rowData.taskAssociation?.taskId}/${rowData.id}`}
    >
      {rowData.taskAssociation?.taskId}
    </Link>
  );
};

export const CreatedTemplate = (rowData: TicketDto) => {
  const date = new Date(rowData.created);
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};
