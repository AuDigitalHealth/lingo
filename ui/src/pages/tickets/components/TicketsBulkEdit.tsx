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
import { Dispatch, SetStateAction } from 'react';
import { Button } from 'primereact/button';
import { useBulkCreateTickets } from '../../../hooks/api/tickets/useUpdateTicket.tsx';
import { AvatarUrls } from '../../../types/JiraUserResponse';
import { useAllTasks } from '../../../hooks/api/task/useAllTasks';
import {
  useAllExternalRequestors,
  useAllIterations,
  useAllLabels,
  useAllPriorityBuckets,
  useAllSchedules,
  useAllStates,
} from '../../../hooks/api/useInitializeTickets.tsx';
import { useJiraUsers } from '../../../hooks/api/useInitializeJiraUsers.tsx';
import { externalRequestorExistsOnTicket } from '../../../utils/helpers/tickets/labelUtils.ts';
import { toTicketExternalRequestorDto } from '../../../utils/helpers/tickets/externalRequestorUtils.ts';

const defaultValues: TicketBulkEditForm = {
  priorityBucket: null,
  schedule: null,
  iteration: null,
  state: null,
  labels: [],
  labelsToRemove: [],
  externalRequestors: [],
  externalRequestorsToRemove: [],
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
  labelsToRemove: LabelType[] | [];
  externalRequestors: ExternalRequestor[] | [];
  externalRequestorsToRemove: ExternalRequestor[] | [];
  task: string | null;
  assignee: JiraUser | null;
}

interface TicketsBulkEditProps {
  tickets: Ticket[] | null;
  setTableLoading: (val: boolean) => void;
  setSelectedTickets: Dispatch<SetStateAction<Ticket[] | null>>;
}

export default function TicketsBulkEdit({
  tickets,
  setTableLoading,
  setSelectedTickets,
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
    reset,
    formState: { isDirty },
  } = useForm({
    defaultValues,
  });

  const mutation = useBulkCreateTickets();
  const { isPending } = mutation;

  setTableLoading(isPending);

  const onSubmit = (data: TicketBulkEditForm) => {
    const updatedTickets = updateTickets(tickets as Ticket[], data);
    mutation.mutate(
      { tickets: updatedTickets },
      {
        onSuccess: savedTickets => {
          mergeTickets(savedTickets);
          // The selection is a snapshot taken when the rows were ticked, and every edit in this
          // session is applied to it rather than to the grid's data. Left stale, a second edit
          // would be calculated from the ticket as it was before the first one was saved.
          setSelectedTickets(current =>
            applySavedTickets(current, savedTickets),
          );
        },
      },
    );
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
                    placeholder="Add Labels"
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="labelsToRemove"
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
                    placeholder="Remove Labels"
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
                    placeholder="Add External Requesters"
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="externalRequestorsToRemove"
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
                    placeholder="Remove External Requesters"
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
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <Button
              disabled={!isDirty}
              type="button"
              label="Clear Selections"
              severity="secondary"
              onClick={() => reset()}
            />
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

/**
 * Folds the saved tickets back over the selection. The bulk endpoint answers with
 * TicketBacklogDto, which carries only the fields the backlog shows, so the saved values are
 * spread over the selected ticket rather than replacing it — that keeps the fields it doesn't
 * carry (comments, products, additional fields) on the selected rows.
 */
const applySavedTickets = (
  selectedTickets: Ticket[] | null,
  savedTickets: Ticket[],
): Ticket[] | null => {
  if (selectedTickets === null) return null;
  const savedById = new Map(savedTickets.map(ticket => [ticket.id, ticket]));
  return selectedTickets.map(ticket => {
    const saved = savedById.get(ticket.id);
    return saved ? { ...ticket, ...saved } : ticket;
  });
};

const updateTickets = (tickets: Ticket[], values: TicketBulkEditForm) => {
  const updatedTickets = tickets.map(ticket => {
    const updatedTicket: Ticket = { ...ticket };
    if (values.priorityBucket) {
      updatedTicket.priorityBucket =
        values.priorityBucket.name === DELETE ? null : values.priorityBucket;
    }
    if (values.schedule) {
      updatedTicket.schedule =
        values.schedule.name === DELETE ? null : values.schedule;
    }
    if (values.iteration) {
      updatedTicket.iteration =
        values.iteration.name === DELETE ? null : values.iteration;
    }
    if (values.state) {
      updatedTicket.state = values.state.label === DELETE ? null : values.state;
    }
    if (values.labels.length > 0) {
      const labelsToAdd = values.labels.filter(
        newLabel =>
          !updatedTicket.labels.some(
            existingLabel => existingLabel.id === newLabel.id,
          ),
      );
      updatedTicket.labels = [...updatedTicket.labels, ...labelsToAdd];
    }
    if (values.labelsToRemove.length > 0) {
      updatedTicket.labels = updatedTicket.labels.filter(
        label => !values.labelsToRemove.some(r => r.id === label.id),
      );
    }
    if (values.externalRequestors.length > 0) {
      const requestorsToAdd = values.externalRequestors
        .filter(
          newRequestor =>
            !externalRequestorExistsOnTicket(updatedTicket, newRequestor),
        )
        .map(toTicketExternalRequestorDto);
      updatedTicket.externalRequestors = [
        ...updatedTicket.externalRequestors,
        ...requestorsToAdd,
      ];
    }
    if (values.externalRequestorsToRemove.length > 0) {
      updatedTicket.externalRequestors =
        updatedTicket.externalRequestors.filter(
          requestor =>
            !values.externalRequestorsToRemove.some(
              r => r.id === requestor.externalRequestorId,
            ),
        );
    }
    if (
      values.task &&
      ((updatedTicket.taskAssociation === null && values.task !== DELETE) ||
        updatedTicket.taskAssociation?.taskId !== values.task)
    ) {
      const association = {
        ticketId: updatedTicket.id,
        taskId: values.task,
        id: undefined,
      };
      updatedTicket.taskAssociation =
        values.task === DELETE ? null : association;
    }

    if (values.assignee) {
      updatedTicket.assignee =
        values.assignee.displayName === DELETE ? null : values.assignee.name;
    }
    return updatedTicket;
  });
  return updatedTickets;
};
