import { yupResolver } from '@hookform/resolvers/yup';
import { Divider, FormControlLabel, Stack } from '@mui/material';
import { Dropdown } from 'primereact/dropdown';
import { Controller, useForm } from 'react-hook-form';
import useTicketStore from '../../../stores/TicketStore';
import useTaskStore from '../../../stores/TaskStore';
import useJiraUserStore from '../../../stores/JiraUserStore';
import { AssigneeValueTemplate, IterationValueTemplate, StateItemTemplate, StateValueTemplate } from './grid/Templates';
import { MultiSelect } from 'primereact/multiselect';
import { LabelItemTemplate } from './grid/Templates';
import { ExternalRequestorsTemplate } from './grid/Templates';
import { IterationItemTemplate } from './grid/Templates';
import { ScheduleItemTemplate } from './grid/Templates';
import { PriorityBucketTemplate } from './grid/Templates';
import { TaskAssocationTemplate } from './grid/Templates';
import { AssigneeItemTemplate } from './grid/Templates';
import { ExternalRequestor, Iteration, LabelType, PriorityBucket, Schedule, State, Ticket } from '../../../types/tickets/ticket';
import { JiraUser } from '../../../types/JiraUserResponse';
import { Button } from 'primereact/button';

const defaultValues : TicketBulkEditForm = {
  priorityBucket: null,
  schedule: null,
  iteration: null,
  state: null,
  labels: [],
  externalRequestors: [],
  task: null,
  assignee: null
};

interface TicketBulkEditForm {
    priorityBucket: PriorityBucket | null,
  schedule: Schedule | null,
  iteration: Iteration | null,
  state: State | null,
  labels: LabelType[] | [],
  externalRequestors: ExternalRequestor[] | [],
  task: Task | null,
  assignee: JiraUser | null
}

interface TicketsBulkEditProps {
    tickets: Ticket[] | null;
}

export default function TicketsBulkEdit({tickets}: TicketsBulkEditProps) {
  const {
    availableStates,
    labelTypes,
    priorityBuckets,
    schedules,
    iterations,
    externalRequestors,
  } = useTicketStore();
  
  const { allTasks } = useTaskStore();
  
  const { jiraUsers } = useJiraUserStore();
  const {
    register,
    control,
    reset,
    handleSubmit,

    formState: { errors, isDirty },
  } = useForm({
    defaultValues,
  });

  const onSubmit = (data: TicketBulkEditForm) => {
console.log('updated tickets');
    console.log(updateTickets(tickets as Ticket[], data));
  }
  return (
    <>
    <Divider />
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
    <Stack direction={'row'} sx={{maxWidth: '100%', padding: '1em 0', alignItems: 'center'}} gap={2}>
        <div>
            <em>Count: </em><span>{tickets?.length}</span>
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
              showClear
              placeholder='Priority'
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
              placeholder='Schedule'
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
              placeholder='Release'
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
              placeholder='Status'
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
            display='chip'
              id={field.name}
              value={field.value}
              onChange={e => field.onChange(e.value)}
              options={labelTypes}
              optionLabel="name"
              itemTemplate={LabelItemTemplate}
              placeholder='Labels'
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
            display='chip'
              id={field.name}
              value={field.value}
              onChange={e => field.onChange(e.value)}
              options={externalRequestors}
              optionLabel="name"
              itemTemplate={ExternalRequestorsTemplate}
              placeholder='External Requesters'
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
              optionValue='key'
              showClear
              placeholder='Task'
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
              placeholder='Assignee'
            />
          )}
        />
      </div>
      <div style={{marginLeft: 'auto'}}>
      <Button disabled={!isDirty} type="submit" label="Submit" />
      </div>
    </Stack>
    </form>
    </>
  );
}

const updateTickets = (tickets: Ticket[], values: TicketBulkEditForm) => {
    const updatedTickets = tickets.map(ticket => {
        if(values.priorityBucket){
            ticket.priorityBucket = values.priorityBucket;
        }
        if(values.schedule){

        }
        if(values.iteration){
            ticket.iteration = values.iteration;
        }
        if(values.state){
            ticket.state = values.state;
        }
        if(values.labels.length > 0){

        }
        if(values.externalRequestors.length > 0){

        }
        if(values.task){

        }
        if(values.assignee){
            ticket.assignee = values.assignee.displayName;
        }
        return ticket;
    });
    return updatedTickets;
}
