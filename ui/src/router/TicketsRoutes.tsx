import { useEffect, useState } from 'react';
import useJiraUserStore from '../stores/JiraUserStore';
import useTicketStore from '../stores/TicketStore';
import TicketsService from '../api/TicketsService';
import {
  AdditionalFieldType,
  AdditionalFieldTypeOfListType,
  Iteration,
  LabelType,
  PagedTicket,
  PriorityBucket,
  State,
} from '../types/tickets/ticket';
import Loading from '../components/Loading';
import { Route, Routes } from 'react-router-dom';
import TicketsBacklog from '../pages/tickets/TicketsBacklog';
import IndividualTicket from '../pages/tickets/individual/IndividualTicket';
import useInitializeTickets from '../hooks/api/useInitializeTickets';
import { useInitializeJiraUsers } from '../hooks/api/useInitializeJiraUsers';

function TicketsRoutes() {
  const { ticketsLoading } = useInitializeTickets();
  const { jiraUsersIsLoading } = useInitializeJiraUsers();

  if (ticketsLoading || jiraUsersIsLoading) {
    return <Loading />;
  }
  return (
    <Routes>
      <Route path="/backlog" element={<TicketsBacklog />} />
      <Route
        path="/board"
        // element={<TicketsBoard />}
        element={<div>Coming soon to a computer near you!</div>}
      />
      <Route path="/individual/:id" element={<IndividualTicket />} />
    </Routes>
  );
}

export default TicketsRoutes;
