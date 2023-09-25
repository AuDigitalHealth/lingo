import { useEffect, useState } from 'react';
import useJiraUserStore from '../stores/JiraUserStore';
import useTicketStore from '../stores/TicketStore';
import TicketsService from '../api/TicketsService';
import {
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
import IndividualTicket from '../pages/tickets/IndividualTicket';

function TicketsRoutes() {
  const {
    addPagedTickets,
    setTickets,
    setAvailableStates,
    setLabelTypes,
    setIterations,
    setPriorityBuckets,
    setAdditionalFieldTypesOfListType,
  } = useTicketStore();
  const { fetching, jiraUsers, fetchJiraUsers } = useJiraUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jiraUsers.length === 0) {
      fetchJiraUsers().catch(err => {
        console.log(err);
      });
    }
    TicketsService.getPaginatedTickets(0, 20)
      .then((pagedTickets: PagedTicket) => {
        setTickets(pagedTickets._embedded.ticketDtoList);
        addPagedTickets(pagedTickets);
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

    TicketsService.getAllAdditionalFieldTypessWithValues()
      .then((additionalFieldTypesOfListType: AdditionalFieldTypeOfListType[]) => {
        setAdditionalFieldTypesOfListType(additionalFieldTypesOfListType);
      })
      .catch(err => {
        console.log(err);
      });
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
