import { Divider, Stack } from '@mui/material';
import { Dropdown } from 'primereact/dropdown';
import { Controller, useForm } from 'react-hook-form';
import useTicketStore from '../../../stores/TicketStore';
import {
  AssigneeValueTemplate,
  ExternalRequestorItemTemplate,
  IterationValueTemplate,
  PriorityItemTemplate,
  StateItemTemplate,
  StateValueTemplate,
} from './grid/Templates';
import { MultiSelect } from 'primereact/multiselect';
import { LabelItemTemplate } from './grid/Templates';
import { IterationItemTemplate } from './grid/Templates';
import { ScheduleItemTemplate } from './grid/Templates';
import { AssigneeItemTemplate } from './grid/Templates';
import {
  ExternalRequestor,
  Iteration,
  LabelType,
  PriorityBucket,
  Schedule,
  State,
  Ticket,
} from '../../../types/tickets/ticket';
import { JiraUser } from '../../../types/JiraUserResponse';
import { Button } from 'primereact/button';
import { useBulkCreateTickets } from '../../../hooks/api/tickets/useUpdateTicket.tsx';
import { useRef } from 'react';
import { AvatarUrls } from '../../../types/JiraUserResponse';
import { useAllTasks } from '../../../hooks/api/useAllTasks.tsx';
import {
  useAllExternalRequestors,
  useAllIterations,
  useAllLabels,
  useAllPriorityBuckets,
  useAllSchedules,
  useAllStates,
} from '../../../hooks/api/useInitializeTickets.tsx';
import { useJiraUsers } from '../../../hooks/api/useInitializeJiraUsers.tsx';

const defaultValues: TicketBulkEditForm = {
  priorityBucket: null,
  schedule: null,
  iteration: null,
  state: null,
  labels: [],
  externalRequestors: [],
  task: null,
  assignee: null,
};

const DELETE = 'Delete';
const EMPTY = '';

const clearPriority = {
  name: DELETE,
  description: EMPTY,
  orderIndex: -1,
} as PriorityBucket;
const clearSchedule = {
  name: DELETE,
  description: EMPTY,
  grouping: -1,
} as Schedule;
const clearIteration = {
  name: DELETE,
  startDate: EMPTY,
  active: false,
  completed: false,
} as Iteration;
const clearStatus = { label: DELETE, description: EMPTY } as State;
const clearTask = { key: DELETE };
const clearAssignee = {
  emailAddress: DELETE,
  displayName: DELETE,
  active: false,
  key: DELETE,
  name: DELETE,
  avatarUrls: [] as unknown as AvatarUrls,
} as JiraUser;

interface TicketBulkEditForm {
  priorityBucket: PriorityBucket | null;
  schedule: Schedule | null;
  iteration: Iteration | null;
  state: State | null;
  labels: LabelType[] | [];
  externalRequestors: ExternalRequestor[] | [];
  task: string | null;
  assignee: JiraUser | null;
}

interface TicketsBulkEditProps {
  tickets: Ticket[] | null;
  setTableLoading: (val: boolean) => void;
}

export default function TicketsBulkEdit({
  tickets,
  setTableLoading,
}: TicketsBulkEditProps) {
  const { availableStates } = useAllStates();
  const { labels } = useAllLabels();
  const { priorityBuckets } = useAllPriorityBuckets();
  const { schedules } = useAllSchedules();
  const { iterations } = useAllIterations();
  const { externalRequestors } = useAllExternalRequestors();
  const { mergeTickets } = useTicketStore();

  const { allTasks } = useAllTasks();

  const { jiraUsers } = useJiraUsers();
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    defaultValues,
  });

  const mutation = useBulkCreateTickets();
  const { data, isPending } = mutation;

  setTableLoading(isPending);

  const previousDataRef = useRef<Ticket[] | undefined>();

  if (data && data !== previousDataRef.current) {
    mergeTickets(data);
    previousDataRef.current = data;
  }

  const onSubmit = (data: TicketBulkEditForm) => {
    const updatedTickets = updateTickets(tickets as Ticket[], data);
    mutation.mutate({ tickets: updatedTickets });
  };

  const priorityBucketOptions = [clearPriority, ...priorityBuckets];
  const scheduleOptions = [clearSchedule, ...schedules];
  const iterationOptions = [clearIteration, ...iterations];
  const stateOptions = [clearStatus, ...availableStates];
  const taskOptions = [clearTask, ...(allTasks || [])];
  const assigneeOptions = [clearAssignee, ...jiraUsers];

  return (
    <>
      <Divider />
      <form
        onSubmit={event => void handleSubmit(onSubmit)(event)}
        className="p-fluid"
      >
        <Stack direction={'row'} sx={{ width: '100%', alignItems: 'center' }}>
          <Stack
            direction={'row'}
            sx={{
              padding: '1em 0',
              alignItems: 'center',
              maxWidth: '80%',
              flexWrap: 'wrap',
            }}
            gap={2}
          >
            <div>
              <em>Count: </em>
              <span>{tickets?.length}</span>
            </div>
            <div>
              <Controller
                name="priorityBucket"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    checkmark
                    id={field.name}
                    value={field.value}
                    onChange={e => field.onChange(e.value)}
                    options={priorityBucketOptions}
                    optionLabel="name"
                    itemTemplate={PriorityItemTemplate}
                    showClear
                    placeholder="Priority"
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="schedule"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id={field.name}
                    value={field.value}
                    onChange={e => field.onChange(e.value)}
                    options={scheduleOptions}
                    optionLabel="name"
                    itemTemplate={ScheduleItemTemplate}
                    showClear
                    placeholder="Schedule"
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="iteration"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id={field.name}
                    value={field.value}
                    onChange={e => field.onChange(e.value)}
                    options={iterationOptions}
                    optionLabel="name"
                    valueTemplate={IterationValueTemplate}
                    itemTemplate={IterationItemTemplate}
                    showClear
                    placeholder="Release"
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id={field.name}
                    value={field.value}
                    onChange={e => field.onChange(e.value)}
                    options={stateOptions}
                    valueTemplate={StateValueTemplate}
                    itemTemplate={StateItemTemplate}
                    optionLabel="label"
                    placeholder="Status"
                    showClear
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="labels"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    display="chip"
                    id={field.name}
                    value={field.value}
                    onChange={e => field.onChange(e.value)}
                    options={labels}
                    optionLabel="name"
                    itemTemplate={LabelItemTemplate}
                    placeholder="Labels"
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="externalRequestors"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    display="chip"
                    id={field.name}
                    value={field.value}
                    onChange={e => field.onChange(e.value)}
                    options={externalRequestors}
                    optionLabel="name"
                    itemTemplate={ExternalRequestorItemTemplate}
                    placeholder="External Requesters"
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="task"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id={field.name}
                    value={field.value}
                    onChange={e => field.onChange(e.value)}
                    options={taskOptions}
                    optionLabel="key"
                    optionValue="key"
                    showClear
                    placeholder="Task"
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="assignee"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id={field.name}
                    value={field.value}
                    onChange={e => field.onChange(e.value)}
                    options={assigneeOptions}
                    optionLabel="name"
                    valueTemplate={AssigneeValueTemplate}
                    itemTemplate={AssigneeItemTemplate}
                    showClear
                    placeholder="Assignee"
                  />
                )}
              />
            </div>
          </Stack>
          <div style={{ marginLeft: 'auto' }}>
            <Button
              disabled={
                !isDirty ||
                tickets === null ||
                !(tickets.length > 0) ||
                isPending
              }
              type="submit"
              label="Update"
            />
          </div>
        </Stack>
      </form>
    </>
  );
}

const updateTickets = (tickets: Ticket[], values: TicketBulkEditForm) => {
  const updatedTickets = [...tickets].map(ticket => {
    if (values.priorityBucket) {
      ticket.priorityBucket =
        values.priorityBucket.name === DELETE ? null : values.priorityBucket;
    }
    if (values.schedule) {
      ticket.schedule =
        values.schedule.name === DELETE ? null : values.schedule;
    }
    if (values.iteration) {
      ticket.iteration =
        values.iteration.name === DELETE ? null : values.iteration;
    }
    if (values.state) {
      ticket.state = values.state.label === DELETE ? null : values.state;
    }
    if (values.labels.length > 0) {
      values.labels.forEach(newLabel => {
        if (
          !ticket.labels.some(existingLabel => existingLabel.id === newLabel.id)
        ) {
          ticket.labels.push(newLabel);
        }
      });
    }
    if (values.externalRequestors.length > 0) {
      values.externalRequestors.forEach(newRequestor => {
        if (
          !ticket.externalRequestors.some(
            existingRequestor => existingRequestor.id === newRequestor.id,
          )
        ) {
          ticket.externalRequestors.push(newRequestor);
        }
      });
    }
    if (
      values.task &&
      ((ticket.taskAssociation === null && values.task !== DELETE) ||
        ticket.taskAssociation?.taskId !== values.task)
    ) {
      const association = {
        ticketId: ticket.id,
        taskId: values.task,
        id: undefined,
      };
      ticket.taskAssociation = values.task === DELETE ? null : association;
    }

    if (values.assignee) {
      ticket.assignee =
        values.assignee.displayName === DELETE ? null : values.assignee.name;
    }
    return ticket;
  });
  return updatedTickets;
};
