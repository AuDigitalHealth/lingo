///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import promisify from 'cypress-promise';
import { Ticket, TicketDto } from '../../src/types/tickets/ticket';
import { closeTicket, createTicket, visitBacklogPage } from './helpers/backlog';
import {
  deleteTicket,
  testIteration,
  testLabels,
  testState,
  updatePriority,
} from './helpers/ticket';

const TEST_ITERATION_NAME = 'TestIteration';
const TEST_LABELS_NAME = 'ARTG Cancelled';
const columnsIndex = {
  priority: 0,
  ticketNumber: 1,
  title: 2,
  schedule: 3,
  release: 4,
  status: 5,
  labels: 6,
  externalRequestors: 7,
  task: 8,
  assigne: 9,
  created: 10,
};

describe('Search Spec', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
    // interceptAndFakeJiraUsers();
    cy.setUpIteration();
    cy.setUpExternalRequestor();
  });
  let ticket: Ticket | undefined = undefined;
  it('Set up Ticket', async () => {
    ticket = await promisify(createTicket('TestTicket'));
    if (ticket.ticketNumber === undefined) {
      throw new Error('Invalid ticketNumber');
    }
    closeTicket();
  });
  it('can do all filters', { scrollBehavior: false }, () => {
    visitBacklogPage();
    searchByTitle(ticket.title, 1);
    updatePriority(ticket).then(priority => {
      searchByPriority('1a', 'Not Equals', 1);
      searchByPriority('1a', 'Equals', 1);
    });

    testLabels(ticket).then(label => {
      searchByLabels(TEST_LABELS_NAME, 1);
    });
    testIteration(ticket).then(iteration => {
      searchByRelease(TEST_ITERATION_NAME, 1);
    });
    testState(ticket).then(state => {
      searchByStatus('To Do', 1);
    });
    return;
  });

  it('can save and load filters', { scrollBehavior: false }, () => {
    visitBacklogPage();
    searchByTitle(ticket.title, 1);
    cy.get('[data-testid="backlog-filter-save"]').click();

    // save, so it's always unique, in case you are running it locally
    const currentTimeInMs = Date.now();
    cy.get('[data-testid="save-filter-modal-input"]').type(
      '64435 - ' + currentTimeInMs,
    );
    cy.interceptPostTicketFilter();
    cy.interceptGetTicketFilter();
    cy.get('[data-testid="save-filter-modal-save"]').click();
    cy.wait('@postTicketFilter');
    cy.wait('@getTicketFilter');

    // clear the list

    cy.waitForGetTicketList(() =>
      cy.get('[data-testid="backlog-filter-clear"]').click(),
    );

    // load the saved filter
    cy.get('[data-testid="backlog-filter-load"]').click();

    cy.get('[data-testid="load-filter-modal-input"]').click();

    cy.get('[data-testid="load-filter-modal-input-dropdown"] > ul > li')
      .contains('64435 - ' + currentTimeInMs)
      .click();

    // cy.waitForGetTicketList(() =>
    //   ,
    // );

    cy.wait('@getTicketList');
    cy.get('[data-testid="load-filter-modal-submit"]').click();
    // check the filter is loaded, should be 1 entry

    cy.get('tbody > tr').should('exist').and('have.length', 1);
  });

  it('deletes the ticket', () => {
    deleteTicket(ticket);
  });
});

function searchByTitle(title: string, expect: number) {
  // cy.scrollTo('top', { timeout: 1000 });
  openFilter(columnsIndex.title);

  cy.get('[data-testid="title-filter-input"]').type(title, { delay: 100 });

  applyFilterAndWait();
  testNumberOfRows(expect);
}

function searchByPriority(
  val: string,
  equalsOrNotEquals: 'Not Equals' | 'Equals',
  count: number,
) {
  openFilter(columnsIndex.priority);

  cy.get('.p-column-filter-matchmode-dropdown').click();
  cy.get('.p-dropdown-items-wrapper')
    .find('li')
    .contains(equalsOrNotEquals)
    .click();

  cy.get('[data-testid="priority-filter-input"]').click();
  cy.get('.p-multiselect-panel', { timeout: 1000 }).should('be.visible');
  cy.get('.p-multiselect-panel')
    .find('li')
    .contains(val)
    .click({ force: true });
  cy.wait(500);
  cy.get('[data-testid="priority-filter-input"]').click();
  applyFilterAndWait();
  testNumberOfRows(count);
}

function searchBySchedule(val: string, count: number) {
  openFilter(columnsIndex.schedule);

  cy.get('[data-testid="schedule-filter-input"]').click();
  cy.get('.p-multiselect-panel', { timeout: 1000 }).should('be.visible');
  cy.get('.p-multiselect-panel')
    .find('li')
    .contains(val)
    .click({ force: true });
  cy.wait(500);
  cy.get('[data-testid="schedule-filter-input"]').click({ force: true });

  applyFilterAndWait();
  testNumberOfRows(count);
}

function searchByRelease(val: string, count: number) {
  openFilter(columnsIndex.release);

  cy.get('[data-testid="iteration-filter-input"]').click();
  cy.get('.p-multiselect-panel', { timeout: 1000 }).should('be.visible');
  cy.get('.p-multiselect-panel')
    .find('li')
    .contains(val)
    .click({ force: true });
  cy.wait(500);
  cy.get('[data-testid="iteration-filter-input"]').click();

  applyFilterAndWait();
  testNumberOfRows(count);
}
function searchByExternalRequestors(val: string, count: number) {
  openFilter(columnsIndex.externalRequestors);

  cy.get('[data-testid="external-requestor-filter-input"]').click();
  cy.get('.p-multiselect-panel', { timeout: 1000 }).should('be.visible');
  cy.get('.p-multiselect-panel')
    .find('li')
    .contains(val)
    .click({ force: true });
  cy.wait(500);
  cy.get('[data-testid="external-requestor-filter-input"]').click();

  applyFilterAndWait();
  testNumberOfRows(count);
}

function searchByStatus(val: string, count: number) {
  openFilter(columnsIndex.status);

  cy.get('[data-testid="state-filter-input"]').click();
  cy.get('.p-multiselect-panel', { timeout: 1000 }).should('be.visible');
  cy.get('.p-multiselect-panel')
    .find('li')
    .contains(val)
    .click({ force: true });
  cy.wait(500);
  cy.get('[data-testid="state-filter-input"]').click();

  applyFilterAndWait();
  testNumberOfRows(count);
}

function searchByLabels(label: string, count: number) {
  openFilter(columnsIndex.labels);

  cy.get('[data-testid="label-filter-input"]');

  cy.get('[data-testid="label-filter-input"]').click();
  cy.get('.p-multiselect-panel', { timeout: 1000 }).should('be.visible');
  cy.get('.p-multiselect-panel')
    .find('li')
    .contains(label)
    .click({ force: true });
  cy.wait(500);
  cy.get('[data-testid="label-filter-input"]').click();

  applyFilterAndWait();
  testNumberOfRows(count);
}

function searchByTask(priority: string) {
  openFilter(columnsIndex.task);

  cy.get('[data-testid="task-filter-input"]');

  applyFilterAndWait();
  testNumberOfRows(1);
}

function searchByAssignee(val: string, count: number) {
  openFilter(columnsIndex.assigne);

  cy.get('[data-testid="assignee-filter-input"]').click();
  cy.get('.p-multiselect-panel', { timeout: 1000 }).should('be.visible');
  cy.get('.p-multiselect-panel')
    .find('li')
    .contains(val)
    .click({ force: true });
  cy.wait(500);
  cy.get('[data-testid="assignee-filter-input"]').click();

  applyFilterAndWait();
  testNumberOfRows(count);
}

function searchByCreated(priority: string) {
  // needs updating
  openFilter(columnsIndex.created);

  cy.get('[data-testid="created-filter-input"]');

  applyFilterAndWait();
  testNumberOfRows(1);
}

function testNumberOfRows(count: number) {
  if (count === 0) {
    cy.get('tbody > tr').contains('No Tickets Found');
  } else {
    cy.get('tbody > tr').should('exist').and('have.length', count);
  }
}

function applyFilterAndWait() {
  cy.wait('@getTicketList');
  cy.get('button[aria-label="Apply"]').click({ force: true });

  cy.get('body').click();
}

function openFilter(index: number) {
  cy.get('.p-datatable-thead > tr > th')
    .eq(index)
    .find('.p-column-filter-menu-button')
    .click();
}

function openFirstTicketInTable() {
  cy.get('tbody > tr')
    .should('exist')
    .should('have.length', 1)
    .find('td')
    .eq(1)
    .find('a')
    .click();
  cy.url().should('match', /\/tickets\/individual\/\d+/);
}

function quickSearch(value: string) {
  cy.waitForGetTicketList(() => cy.get('#backlog-quick-search').type(value));
}

function updateBacklogTicket() {}
