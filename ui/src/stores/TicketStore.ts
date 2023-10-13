import { create } from 'zustand';
import {
  AdditionalFieldType,
  AdditionalFieldTypeOfListType,
  Iteration,
  LabelType,
  PagedTicket,
  PriorityBucket,
  State,
  TaskAssocation,
  Ticket,
  TicketDto,
} from '../types/tickets/ticket';
import { sortTicketsByPriority } from '../utils/helpers/tickets/priorityUtils';

interface TicketStoreConfig {
  queryString: string;
  tickets: TicketDto[];
  pagedTickets: PagedTicket[];
  queryPagedTickets: PagedTicket[];
  iterations: Iteration[];
  availableStates: State[];
  activeTicket: TicketDto | null;
  labelTypes: LabelType[];
  taskAssociations: TaskAssocation[];
  priorityBuckets: PriorityBucket[];
  additionalFieldTypes: AdditionalFieldType[];
  setAdditionalFieldTypes: (
    additionalFieldTypes: AdditionalFieldType[] | null,
  ) => void;
  clearQueryTickets: () => void;
  addQueryTickets: (pagedTicket: PagedTicket) => void;
  getQueryPagedTicketByPageNumber: (page: number) => PagedTicket | undefined;
  mergeQueryPagedTickets: (pagedTicket: PagedTicket) => void;
  additionalFieldTypesOfListType: AdditionalFieldTypeOfListType[];
  setAdditionalFieldTypesOfListType: (
    additionalFieldTypesOfListType: AdditionalFieldTypeOfListType[] | null,
  ) => void;
  addPagedTickets: (pagedTicket: PagedTicket) => void;
  getPagedTicketByPageNumber: (page: number) => PagedTicket | undefined;
  mergePagedTickets: (pagedTicket: PagedTicket) => void;
  setIterations: (iterations: Iteration[] | null) => void;
  setLabelTypes: (labelTypes: LabelType[] | null) => void;
  setAvailableStates: (states: State[] | null) => void;
  addTickets: (newTickets: TicketDto[]) => void;
  setPriorityBuckets: (buckets: PriorityBucket[]) => void;
  setActiveTicket: (ticket: Ticket | null) => void;
  addTaskAssociations: (taskAssocationsArray: TaskAssocation[]) => void;
  getTaskAssociationsByTaskId: (taskId: string | undefined) => TaskAssocation[];
  deleteTaskAssociation: (taskAssociationId: number) => void;
  getTicketsByStateId: (id: number) => Ticket[] | [];
  getTicketById: (id: number) => TicketDto | undefined;
  getLabelByName: (labelName: string) => LabelType | undefined;
  getAllTicketsByTaskAssociations: (
    taskAssociations: TaskAssocation[],
  ) => Ticket[];
  mergeTickets: (updatedTicket: Ticket) => void;
  addTicket: (newTicket: Ticket) => void;
  updateQueryString: (newQueryString: string) => void;
}

const useTicketStore = create<TicketStoreConfig>()((set, get) => ({
  queryString: '',
  tickets: [],
  iterations: [],
  availableStates: [],
  pagedTickets: [],
  queryPagedTickets: [],
  labelTypes: [],
  priorityBuckets: [],
  additionalFieldTypes: [],
  taskAssociations: [],
  additionalFieldTypesOfListType: [],
  activeTicket: null,
  addTickets: (newTickets: TicketDto[]) => {
    newTickets = newTickets !== null ? newTickets : [];
    const existingIds = new Set(get().tickets.map(ticket => ticket.id));
    const merged = [
      ...get().tickets,
      ...newTickets.filter(ticket => !existingIds.has(ticket.id)),
    ];
    const mergedAndSorted = sortTicketsByPriority(merged);
    set({ tickets: mergedAndSorted });
  },
  addPagedTickets: (pagedTicket: PagedTicket) => {
    const existingPagedTickets = get().pagedTickets;
    const alreadyExists = existingPagedTickets.find(ticket => {
      return ticket.page.number === pagedTicket.page.number;
    });
    if (alreadyExists) {
      get().mergePagedTickets(pagedTicket);
    } else if (pagedTicket._embedded?.ticketDtoList) {
      const updatedPagedTickets = get().pagedTickets.concat(pagedTicket);
      get().addTickets(pagedTicket._embedded.ticketDtoList);
      set({ pagedTickets: [...updatedPagedTickets] });
    }
  },
  getPagedTicketByPageNumber: (page: number) => {
    const foundTickets = get().pagedTickets.find(ticket => {
      return ticket.page.number === page;
    });

    return foundTickets;
  },
  mergePagedTickets: (pagedTicket: PagedTicket) => {
    const updatedPagedTickets = get().pagedTickets.map(
      (existingPagedTicket: PagedTicket): PagedTicket => {
        return pagedTicket.page.number === existingPagedTicket.page.number
          ? pagedTicket
          : existingPagedTicket;
      },
    );
    set({ pagedTickets: [...updatedPagedTickets] });
  },
  addQueryTickets: (pagedTicket: PagedTicket) => {
    const existingPagedTickets = get().queryPagedTickets;
    const alreadyExists = existingPagedTickets.find(ticket => {
      return ticket.page.number === pagedTicket.page.number;
    });
    if (alreadyExists) {
      get().mergeQueryPagedTickets(pagedTicket);
    } else if (pagedTicket._embedded?.ticketDtoList) {
      const updatedPagedTickets = get().queryPagedTickets.concat(pagedTicket);
      get().addTickets(pagedTicket._embedded.ticketDtoList);
      set({ queryPagedTickets: [...updatedPagedTickets] });
    }
  },
  getQueryPagedTicketByPageNumber: (page: number) => {
    const foundTickets = get().queryPagedTickets.find(ticket => {
      return ticket.page.number === page;
    });

    return foundTickets;
  },
  mergeQueryPagedTickets: (pagedTicket: PagedTicket) => {
    const updatedPagedTickets = get().queryPagedTickets.map(
      (existingPagedTicket: PagedTicket): PagedTicket => {
        return pagedTicket.page.number === existingPagedTicket.page.number
          ? pagedTicket
          : existingPagedTicket;
      },
    );
    set({ queryPagedTickets: [...updatedPagedTickets] });
  },
  clearQueryTickets: () => {
    set({ queryPagedTickets: [] });
  },
  setIterations: (iterations: Iteration[] | null) => {
    set({ iterations: iterations ? iterations : [] });
  },
  setLabelTypes: (labelTypes: LabelType[] | null) => {
    set({ labelTypes: labelTypes ? labelTypes : [] });
  },
  setAvailableStates: (states: State[] | null) => {
    set({ availableStates: states ? states : [] });
  },
  setActiveTicket: ticket => {
    set({ activeTicket: ticket });
  },
  setPriorityBuckets: (buckets: PriorityBucket[]) => {
    buckets.sort((aBucket, bBucket) => {
      return aBucket.orderIndex - bBucket.orderIndex;
    });
    set({ priorityBuckets: buckets ? buckets : [] });
  },
  addTaskAssociations: (taskAssocationsArray: TaskAssocation[]) => {
    taskAssocationsArray =
      taskAssocationsArray !== null ? taskAssocationsArray : [];
    const existingIds = new Set(
      get().taskAssociations.map(taskAssociation => taskAssociation.id),
    );
    const merged = [
      ...get().taskAssociations,
      ...taskAssocationsArray.filter(
        taskAssociation => !existingIds.has(taskAssociation.id),
      ),
    ];
    set({ taskAssociations: merged });
  },
  getTaskAssociationsByTaskId: (
    taskId: string | undefined,
  ): TaskAssocation[] => {
    return get().taskAssociations.filter(taskAssociation => {
      return taskAssociation.taskId === taskId;
    });
  },
  deleteTaskAssociation: (taskAssociationId: number) => {
    const taskAssociationsNotDeleted = get().taskAssociations.filter(
      taskAssociation => {
        return taskAssociation.id !== taskAssociationId;
      },
    );

    set({ taskAssociations: taskAssociationsNotDeleted });
  },
  setAdditionalFieldTypes: (
    additionalFieldTypes: AdditionalFieldType[] | null,
  ) => {
    set({
      additionalFieldTypes: additionalFieldTypes ? additionalFieldTypes : [],
    });
  },
  setAdditionalFieldTypesOfListType: (
    additionalFieldTypesOfListType: AdditionalFieldTypeOfListType[] | null,
  ) => {
    set({
      additionalFieldTypesOfListType: additionalFieldTypesOfListType
        ? additionalFieldTypesOfListType
        : [],
    });
  },
  getTicketsByStateId: (id: number): TicketDto[] | [] => {
    const returnTickets = get().tickets.filter(ticket => {
      return ticket?.state?.id === id;
    });

    return returnTickets;
  },
  getTicketById: (id: number): TicketDto | undefined => {

    return get().tickets.find(ticket => {
      return ticket?.id === id;
    });
  },
  getLabelByName: (labelName: string): LabelType | undefined => {
    return get().labelTypes.find(labelType => {
      return labelType.name === labelName;
    });
  },
  getAllTicketsByTaskAssociations: (taskAssociations: TaskAssocation[]) => {
    const returnTickets = get().tickets.filter(ticket => {
      return taskAssociations.some((taskAssociation: TaskAssocation) => {
        return taskAssociation.ticketId === ticket.id;
      });
    });
    return returnTickets;
  },
  mergeTickets: (updatedTicket: Ticket) => {
    let updatedTickets = get().tickets;
    // if it exists in the store already, merge it with the existing ticket
    if (
      get().tickets.filter(ticket => {
        return ticket.id === updatedTicket.id;
      }).length === 1
    ) {
      updatedTickets = get().tickets.map((ticket: Ticket): Ticket => {
        return ticket.id === updatedTicket.id ? updatedTicket : ticket;
      });
      // else, add it to the ticket list
    } else {
      updatedTickets.push(updatedTicket);
    }

    sortTicketsByPriority(updatedTickets);
    set({ tickets: [...updatedTickets] });
  },
  addTicket: (newTicket: Ticket) => {
    set({ tickets: get().tickets.concat(newTicket) });
  },
  updateQueryString: (newQueryString: string) => {
    set({ queryString: newQueryString });
  },
}));

export default useTicketStore;
