import { useEffect, useState } from 'react';
import useTaskStore from '../stores/TaskStore';
import useJiraUserStore from '../stores/JiraUserStore';
import TicketsService from '../api/TicketsService';
import useTicketStore from '../stores/TicketStore';

export default function useInitializeApp() {
  const taskStore = useTaskStore();
  const jiraUserStore = useJiraUserStore();
  const {
    setTaskAssociations,
    setTickets,
    setAvailableStates,
    setLabelTypes,
    setIterations,
    setPriorityBuckets,
    setAdditionalFieldTypes,
  } = useTicketStore();
  const [loading, setLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(true);

  useEffect(() => {
    const allTasksPromise = taskStore.fetchAllTasks();
    const taskPromise = taskStore.fetchTasks();
    const jiraUserPromise = jiraUserStore.fetchJiraUsers();
    const taskAssociationsPromise = TicketsService.getTaskAssociations();
    Promise.allSettled([
      allTasksPromise,
      taskPromise,
      jiraUserPromise,
      taskAssociationsPromise,
    ])
      .then(results => {
        const [allTasks, tasks, jiraUsers, taskAssociations] = results;
        setTaskLoading(false);
        if (taskAssociations.status === 'fulfilled') {
          setTaskAssociations(taskAssociations.value);
        }
      })
      .catch(err => {
        console.error(err);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ticketsPromise = TicketsService.getPaginatedTickets(0, 20);
    const statesPromise = TicketsService.getAllStates();
    const labelsPromise = TicketsService.getAllLabelTypes();
    const iterationsPromise = TicketsService.getAllIterations();
    const priorityBucketsPromise = TicketsService.getAllPriorityBuckets();
    const additionalFieldsPromise = TicketsService.getAllAdditionalFields();

    void Promise.allSettled([
      ticketsPromise,
      statesPromise,
      labelsPromise,
      iterationsPromise,
      priorityBucketsPromise,
      additionalFieldsPromise,
    ]).then(results => {
      setTicketLoading(false);
      const [
        tickets,
        states,
        labels,
        iterations,
        priorityBuckets,
        additionalFields,
      ] = results;
      if (tickets.status === 'fulfilled') {
        setTickets(tickets.value._embedded.ticketDtoList);
      }

      if (states.status === 'fulfilled') {
        setAvailableStates(states.value);
      }

      if (labels.status === 'fulfilled') {
        setLabelTypes(labels.value);
      }

      if (iterations.status === 'fulfilled') {
        setIterations(iterations.value);
      }

      if (priorityBuckets.status === 'fulfilled') {
        setPriorityBuckets(priorityBuckets.value);
      }

      if (additionalFields.status === 'fulfilled') {
        setAdditionalFieldTypes(additionalFields.value);
      }
    });
  }, []);

  return taskLoading || ticketLoading;
}
