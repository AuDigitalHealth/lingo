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
  cy.waitForGetTicketList(() => cy.get('#backlog').click());
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

export async function setUpIteration() {
  const allIterationsResponse = (await fetch('/api/tickets/iterations', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(res => res.json())) as Iteration[];

  if (allIterationsResponse.length > 0) {
    // Create an array of promises for all delete requests
    const deletePromises = allIterationsResponse.map(iteration =>
      fetch(`/api/tickets/iterations/${iteration.id}`, {
        method: 'DELETE',
      }),
    );

    // Wait for all delete requests to complete
    try {
      await Promise.all(deletePromises);
      console.log('All iterations have been deleted successfully');
    } catch (error) {
      console.error('An error occurred while deleting iterations:', error);
    }
  }

  const workingDirectory = Cypress.config('fileServerFolder');
  const filePath = '/cypress/fixtures/test-iteration.json';

  const iterationResponse = cy
    .readFile(workingDirectory + filePath)
    .then(async file => {
      const iterationResponse = (await fetch('/api/tickets/iterations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(file),
      }).then(res => res.json())) as Iteration[];

      return iterationResponse;
    });
}

export async function setUpExternalRequestor() {
  // Fetch all external requestors
  const allExternalRequestorsResponse = (await fetch(
    '/api/tickets/externalRequestors',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  ).then(res => res.json())) as ExternalRequestor[];

  if (allExternalRequestorsResponse.length > 0) {
    // Create an array of promises for all delete requests
    const deletePromises = allExternalRequestorsResponse.map(
      externalRequestor =>
        fetch(`/api/tickets/externalRequestors/${externalRequestor.id}`, {
          method: 'DELETE',
        }),
    );

    // Wait for all delete requests to complete
    try {
      await Promise.all(deletePromises);
      console.log('All external requestors have been deleted successfully');
    } catch (error) {
      console.error(
        'An error occurred while deleting external requestors:',
        error,
      );
    }
  }

  const workingDirectory = Cypress.config('fileServerFolder');
  const filePath = '/cypress/fixtures/test-external-requestor.json';

  const externalRequestorResponse = cy
    .readFile(workingDirectory + filePath)
    .then(async file => {
      return (await fetch('/api/tickets/externalRequestors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(file),
      }).then(res => res.json())) as ExternalRequestor[];
    });
}
