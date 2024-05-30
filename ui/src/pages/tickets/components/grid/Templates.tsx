import { Stack } from '@mui/system';
import useJiraUserStore from '../../../../stores/JiraUserStore';
import useTicketStore from '../../../../stores/TicketStore';
import { JiraUser } from '../../../../types/JiraUserResponse';
import {
  AdditionalFieldValue,
  ExternalRequestor,
  Iteration,
  LabelType,
  PriorityBucket,
  Schedule,
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
import { ListItemText, Typography } from '@mui/material';
import CustomIterationSelection, {
  IterationItemDisplay,
} from './CustomIterationSelection';
import CustomPrioritySelection from './CustomPrioritySelection';
import { Link } from 'react-router-dom';
import { ScheduleItemDisplay } from './CustomScheduleSelection';
import { UNASSIGNED_VALUE } from './GenerateSearchConditions';
import CustomTicketExternalRequestorSelection, {
  ExternalRequestorItemDisplay,
} from './CustomTicketExternalRequestorSelection.tsx';
import { DropdownProps } from 'primereact/dropdown';
import TicketDrawer from './TicketDrawer.tsx';

export const TitleTemplate = (rowData: TicketDto) => {
  return <TicketDrawer ticket={rowData} />;
};

export const PriorityBucketTemplate = (rowData: TicketDto) => {
  const { priorityBuckets } = useTicketStore();

  return (
    <CustomPrioritySelection
      ticket={rowData}
      id={rowData.id.toString()}
      priorityBucket={rowData.priorityBucket}
      priorityBucketList={priorityBuckets}
    />
  );
};

export const ScheduleTemplate = (rowData: TicketDto) => {
  return <>{rowData?.schedule?.name}</>;
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
      ticket={rowData}
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
      ticket={rowData}
      labelTypeList={labelTypes}
      typedLabels={rowData.labels}
      id={rowData.id.toString()}
    />
  );
};

export const ExternalRequestorsTemplate = (rowData: TicketDto) => {
  const { externalRequestors } = useTicketStore();
  return (
    <CustomTicketExternalRequestorSelection
      ticket={rowData}
      externalRequestorList={externalRequestors}
      typedExternalRequestors={rowData.externalRequestors}
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

export const ExternalRequestorValueTemplate = (
  externalRequestor: ExternalRequestor,
  props: DropdownProps,
) => {
  if (externalRequestor) {
    return ExternalRequestorItemTemplate(externalRequestor);
  }
  return PlaceholderTemplate(props);
};

export const ExternalRequestorItemTemplate = (
  externalRequestor: ExternalRequestor,
) => {
  return <ExternalRequestorItemDisplay externalRequestor={externalRequestor} />;
};

export const PlaceholderTemplate = (props: DropdownProps) => {
  return <span>{props.placeholder}</span>;
};
export const StateValueTemplate = (state: State, props: DropdownProps) => {
  if (state) {
    return StateItemTemplate(state);
  }
  return PlaceholderTemplate(props);
};
export const StateItemTemplate = (state: State) => {
  if (state.label.toLowerCase() === UNASSIGNED_VALUE) {
    return <ListItemText primary={state.label} />;
  } else {
    return <StateItemDisplay localState={state} />;
  }
};

export const ScheduleValueTemplate = (
  schedule: Schedule,
  props: DropdownProps,
) => {
  if (schedule) {
    return ScheduleItemTemplate(schedule);
  }
  return PlaceholderTemplate(props);
};

export const PriorityItemTemplate = (priority: PriorityBucket) => {
  return <Typography>{priority.name}</Typography>;
};

export const ScheduleItemTemplate = (schedule: Schedule) => {
  if (schedule.name.toLowerCase() === UNASSIGNED_VALUE) {
    return <ListItemText primary={schedule.name} />;
  } else {
    return <ScheduleItemDisplay localSchedule={schedule} />;
  }
};

export const AssigneeValueTemplate = (user: JiraUser, props: DropdownProps) => {
  if (user) {
    return AssigneeItemTemplate(user);
  }
  return PlaceholderTemplate(props);
};

export const AssigneeItemTemplate = (user: JiraUser) => {
  return (
    <>
      <Stack direction="row" spacing={2}>
        <GravatarWithTooltip username={user.name} />
        <ListItemText primary={user.displayName} />
      </Stack>
    </>
  );
};

export const IterationValueTemplate = (
  iteration: Iteration,
  props: DropdownProps,
) => {
  if (iteration) {
    return IterationItemTemplate(iteration);
  }
  return PlaceholderTemplate(props);
};

export const IterationItemTemplate = (iteration: Iteration) => {
  if (iteration.name.toLowerCase() === UNASSIGNED_VALUE) {
    return <ListItemText primary={iteration.name} />;
  } else {
    return <IterationItemDisplay iteration={iteration} />;
  }
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
