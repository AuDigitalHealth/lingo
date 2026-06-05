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

import { promisify } from 'cypress/types/bluebird';
import {
  ExternalRequestor,
  Iteration,
  Ticket,
} from '../../../src/types/tickets/ticket';

export function visitBacklogPage() {
  cy.visit('/dashboard');
  // The dashboard nav can be slow to render (shared dev env / proxy latency),
  // so wait beyond Cypress's 4s default for the backlog link.
  cy.waitForGetTicketList(() => {
    cy.get('#backlog', { timeout: 30000 }).click();
  });
  cy.url().should('include', 'dashboard/tickets/backlog');
}

export function closeTicket() {
  cy.get('[data-testid="close-ticket"]').click();
}

export function createTicket(title: string): Cypress.Chainable<Ticket> {
  visitBacklogPage();

  cy.get('[data-testid="create-ticket"]').click();
  cy.get('[data-testid="create-ticket-title"]').type(title);
  // Intercept the POST request to /api/tickets
  cy.intercept('POST', '/api/tickets').as('createTicketRequest');

  cy.get('[data-testid="create-ticket-submit"]').click();

  // Wait for the intercepted request and return its response body as a Ticket
  return cy.wait('@createTicketRequest').then(interception => {
    if (interception.response && interception.response.statusCode === 200) {
      return interception.response.body as Ticket;
    } else {
      throw new Error('Failed to create ticket or invalid response');
    }
  });
}

export function visitDashboard() {
  cy.visit('/dashboard');
  cy.url().should('include', 'dashboard');
}

export function interceptAndFakeJiraUsers(): void {
  const filePath = '/cypress/fixtures/test-jiraUsers.json';
  const workingDirectory = Cypress.config('fileServerFolder');

  cy.readFile(`${workingDirectory}${filePath}`).then(usersData => {
    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: usersData,
    }).as('getUsers');
  });
}

// Fixture payloads (previously cypress/fixtures/test-iteration.json and
// test-external-requestor.json). Inlined as constants because these plain
// async helpers can't use cy.readFile — a queued Cypress command can't be
// awaited from a Promise.
const TEST_ITERATION = {
  name: 'TestIteration',
  startDate: '2024-09-30T14:00:00.000Z',
  endDate: '2024-10-30T14:00:00.000Z',
  active: true,
  completed: false,
};

const TEST_EXTERNAL_REQUESTOR = {
  name: 'TestExternalRequestor',
  description: 'A test',
  displayColor: '#F04134',
};

// Ensure the test iteration EXISTS (idempotent get-or-create). Called from
// BacklogSpec / TicketSpec `beforeEach`, so it must be safe to run repeatedly.
//
// The original reset — DELETE every iteration, then POST the fixture — could
// never work on the shared/populated dev environment and was disabled:
//   • DELETE → 409 ResourceInUseProblem: an iteration mapped to any ticket
//     can't be deleted (IterationController.deleteIteration), and a blanket
//     delete would wipe other users' shared data.
//   • POST  → 409 ResourceAlreadyExists: once the fixture iteration exists,
//     re-POSTing the same name conflicts (IterationController.createIteration).
// Both 409s are intentional backend guards, not bugs — so the correct test
// setup is get-or-create: reuse the fixture iteration when present, create it
// only when missing.
export async function setUpIteration(): Promise<Iteration> {
  const existing = (await fetch('/api/tickets/iterations', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())) as Iteration[];

  const found = existing.find(i => i.name === TEST_ITERATION.name);
  if (found) {
    return found;
  }

  const response = await fetch('/api/tickets/iterations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_ITERATION),
  });

  // Tolerate a concurrent create (409 ResourceAlreadyExists): re-fetch and use
  // the existing iteration.
  if (response.status === 409) {
    const refetched = (await fetch('/api/tickets/iterations', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json())) as Iteration[];
    const conflict = refetched.find(i => i.name === TEST_ITERATION.name);
    if (conflict) {
      return conflict;
    }
  }
  if (!response.ok) {
    throw new Error(
      `Failed to create test iteration (${response.status}): ${await response.text()}`,
    );
  }
  return (await response.json()) as Iteration;
}

// Ensure the test external requestor EXISTS (idempotent get-or-create) — same
// rationale and 409 guards as setUpIteration above
// (ExternalRequestorController.createExternalRequestor / deleteExternalRequestor).
export async function setUpExternalRequestor(): Promise<ExternalRequestor> {
  const existing = (await fetch('/api/tickets/externalRequestors', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())) as ExternalRequestor[];

  const found = existing.find(e => e.name === TEST_EXTERNAL_REQUESTOR.name);
  if (found) {
    return found;
  }

  const response = await fetch('/api/tickets/externalRequestors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_EXTERNAL_REQUESTOR),
  });

  if (response.status === 409) {
    const refetched = (await fetch('/api/tickets/externalRequestors', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json())) as ExternalRequestor[];
    const conflict = refetched.find(
      e => e.name === TEST_EXTERNAL_REQUESTOR.name,
    );
    if (conflict) {
      return conflict;
    }
  }
  if (!response.ok) {
    throw new Error(
      `Failed to create test external requestor (${response.status}): ${await response.text()}`,
    );
  }
  return (await response.json()) as ExternalRequestor;
}
