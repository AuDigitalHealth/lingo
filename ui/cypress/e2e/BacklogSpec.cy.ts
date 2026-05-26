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
import { setupMockInterceptors } from '../support/mock-interceptors';

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

describe('Backlog Spec', () => {
  beforeEach(() => {
    if (Cypress.env('MOCK_MODE')) {
      setupMockInterceptors();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
      cy.setUpIteration();
      cy.setUpExternalRequestor();
    }
  });

  // ── Mock mode tests ────────────────────────────────────────────────────────

  it('navigates to the backlog page', () => {
    cy.visit('/dashboard/tickets/backlog');
    cy.url().should('include', 'dashboard/tickets/backlog');
  });

  it('displays ticket rows when tickets exist in search results', function () {
    if (!Cypress.env('MOCK_MODE')) return this.skip();
    cy.visit('/dashboard/tickets/backlog');
    cy.url().should('include', 'dashboard/tickets/backlog');
    cy.wait('@mockTicketSearch', { timeout: 10000 });
    cy.get('tbody > tr', { timeout: 10000 }).should('exist');
  });

  it('shows the create ticket button', () => {
    cy.visit('/dashboard/tickets/backlog');
    cy.get('[data-testid="create-ticket"]', { timeout: 10000 }).should(
      'be.visible',
    );
  });

  it('can open the create ticket modal', function () {
    if (!Cypress.env('MOCK_MODE')) return this.skip();
    cy.visit('/dashboard/tickets/backlog');
    cy.get('[data-testid="create-ticket"]', { timeout: 10000 }).click();
    cy.get('[data-testid="create-ticket-title"]').should('be.visible');
  });

  it('can create a ticket via the modal', function () {
    if (!Cypress.env('MOCK_MODE')) return this.skip();
    cy.visit('/dashboard/tickets/backlog');
    cy.get('[data-testid="create-ticket"]', { timeout: 10000 }).click();
    cy.get('[data-testid="create-ticket-title"]').type('E2E Mocked Ticket');
    cy.get('[data-testid="create-ticket-submit"]').click();
    cy.wait('@mockCreateTicket');
  });

  it('shows the filter controls', function () {
    if (!Cypress.env('MOCK_MODE')) return this.skip();
    cy.visit('/dashboard/tickets/backlog');
    cy.get('.p-datatable-thead', { timeout: 10000 }).should('be.visible');
  });

  it('shows the save filter button', () => {
    cy.visit('/dashboard/tickets/backlog');
    cy.get('[data-testid="backlog-filter-save"]', { timeout: 10000 }).should(
      'be.visible',
    );
  });

  // ── Live mode tests ────────────────────────────────────────────────────────

  let ticket: Ticket | undefined = undefined;

  it('Set up Ticket', async function () {
    if (Cypress.env('MOCK_MODE')) return this.skip();
    ticket = await promisify(createTicket('TestTicket'));
    if (ticket.ticketNumber === undefined) {
      throw new Error('Invalid ticketNumber');
    }
    closeTicket();
  });

  it('can do all filters', { scrollBehavior: false }, function () {
    if (Cypress.env('MOCK_MODE')) return this.skip();
    visitBacklogPage();
    searchByTitle(ticket.title, 1);
    updatePriority(ticket).then(() => {
      searchByPriority('1a', 'Not Equals', 1);
      searchByPriority('1a', 'Equals', 1);
    });
    testLabels(ticket).then(() => {
      searchByLabels(TEST_LABELS_NAME, 1);
    });
    testIteration(ticket).then(() => {
      searchByRelease(TEST_ITERATION_NAME, 1);
    });
    testState(ticket).then(() => {
      searchByStatus('To Do', 1);
    });
  });

  it('can save and load filters', { scrollBehavior: false }, function () {
    if (Cypress.env('MOCK_MODE')) return this.skip();
    visitBacklogPage();
    searchByTitle(ticket.title, 1);
    cy.get('[data-testid="backlog-filter-save"]').click();

    const currentTimeInMs = Date.now();
    cy.get('[data-testid="save-filter-modal-input"]').type(
      '64435 - ' + currentTimeInMs,
    );
    cy.interceptPostTicketFilter();
    cy.interceptGetTicketFilter();
    cy.get('[data-testid="save-filter-modal-save"]').click();
    cy.wait('@postTicketFilter');
    cy.wait('@getTicketFilter');

    cy.waitForGetTicketList(() =>
      cy.get('[data-testid="backlog-filter-clear"]').click(),
    );

    cy.get('[data-testid="backlog-filter-load"]').click();
    cy.get('[data-testid="load-filter-modal-input"]').click();
    cy.get('[data-testid="load-filter-modal-input-dropdown"] > ul > li')
      .contains('64435 - ' + currentTimeInMs)
      .click();

    cy.wait('@getTicketList');
    cy.get('[data-testid="load-filter-modal-submit"]').click();
    cy.get('tbody > tr').should('exist').and('have.length', 1);
  });

  it('deletes the ticket', function () {
    if (Cypress.env('MOCK_MODE')) return this.skip();
    deleteTicket(ticket);
  });
});

function searchByTitle(title: string, expect: number) {
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
