import { Divider, Stack } from '@mui/material';
import { Dropdown } from 'primereact/dropdown';
import { Controller, useForm } from 'react-hook-form';
import useTicketStore from '../../../stores/TicketStore';
import useTaskStore from '../../../stores/TaskStore';
import useJiraUserStore from '../../../stores/JiraUserStore';
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
import { useEffect } from 'react';

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
  const {
    availableStates,
    labelTypes,
    priorityBuckets,
    schedules,
    iterations,
    externalRequestors,
    mergeTickets,
  } = useTicketStore();

  const { allTasks } = useTaskStore();

  const { jiraUsers } = useJiraUserStore();
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    defaultValues,
  });

  const mutation = useBulkCreateTickets();
  const { data, isLoading } = mutation;

  useEffect(() => {
    setTableLoading(isLoading);
  }, [isLoading, setTableLoading]);

  const onSubmit = (data: TicketBulkEditForm) => {
    const updatedTickets = updateTickets(tickets as Ticket[], data);
    mutation.mutate({ tickets: updatedTickets });
  };

  useEffect(() => {
    if (data) {
      mergeTickets(data);
    }
  }, [data, mergeTickets]);

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
                    id={field.name}
                    value={field.value}
                    onChange={e => field.onChange(e.value)}
                    options={priorityBuckets}
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
                    options={schedules}
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
                    options={iterations}
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
                    options={availableStates}
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
                    options={labelTypes}
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
                    options={allTasks}
                    optionLabel="key"
                    optionValue="key"
                    showClear
                    placeholder="Task"

                    //   itemTemplate={TaskAssocationTemplate}
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
                    options={jiraUsers}
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
                isLoading
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
  const updatedTickets = tickets.map(ticket => {
    if (values.priorityBucket) {
      ticket.priorityBucket = values.priorityBucket;
    }
    if (values.schedule) {
      ticket.schedule = values.schedule;
    }
    if (values.iteration) {
      ticket.iteration = values.iteration;
    }
    if (values.state) {
      ticket.state = values.state;
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
      (ticket.taskAssociation === null ||
        ticket.taskAssociation?.taskId !== values.task)
    ) {
      ticket.taskAssociation = {
        ticketId: ticket.id,
        taskId: values.task,
        id: undefined,
      };
    }
    if (values.assignee) {
      ticket.assignee = values.assignee.name;
    }
    return ticket;
  });
  return updatedTickets;
};
