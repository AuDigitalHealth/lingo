import { useEffect, useState } from 'react';
import useJiraUserStore from '../stores/JiraUserStore';
import useTicketStore from '../stores/TicketStore';
import TicketsService from '../api/TicketsService';
import {
  AdditionalFieldType,
  Iteration,
  LabelType,
  PriorityBucket,
  State,
  Ticket,
} from '../types/tickets/ticket';
import Loading from '../components/Loading';
import { Route, Routes } from 'react-router-dom';
import TicketsBacklog from '../pages/tickets/TicketsBacklog';
import IndividualTicket from '../pages/tickets/individual/IndividualTicket';

function TicketsRoutes() {
  const {
    setTickets,
    setAvailableStates,
    setLabelTypes,
    setIterations,
    setPriorityBuckets,
    setAdditionalFieldTypes,
  } = useTicketStore();
  const { fetching, jiraUsers, fetchJiraUsers } = useJiraUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jiraUsers.length === 0) {
      fetchJiraUsers().catch(err => {
        console.log(err);
      });
    }
    TicketsService.getAllTickets()
      .then((tickets: Ticket[]) => {
        setTickets(tickets);
      })
      .catch(err => console.log(err));
    TicketsService.getAllStates()
      .then((states: State[]) => {
        setAvailableStates(states);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      })
      .catch(err => console.log(err));
    TicketsService.getAllLabelTypes()
      .then((labelTypes: LabelType[]) => {
        setLabelTypes(labelTypes);
      })
      .catch(err => {
        console.log(err);
      });

    TicketsService.getAllIterations()
      .then((iterations: Iteration[]) => {
        setIterations(iterations);
      })
      .catch(err => {
        console.log(err);
      });

    TicketsService.getAllPriorityBuckets()
      .then((buckets: PriorityBucket[]) => {
        setPriorityBuckets(buckets);
      })
      .catch(err => {
        console.log(err);
      });

    TicketsService.getAllAdditionalFields()
      .then((additionalFieldTypes: AdditionalFieldType[]) => {
        setAdditionalFieldTypes(additionalFieldTypes);
      })
      .catch(err => {
        console.log(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || fetching) {
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
