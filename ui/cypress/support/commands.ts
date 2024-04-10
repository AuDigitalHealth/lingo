/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//         checkAxeViolations(context, options, label)
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
import { Ticket } from '../../src/types/tickets/ticket';
function printAccessibilityViolations(violations) {
  cy.task(
    'table',
    violations.map(({ id, impact, description, nodes }) => ({
      impact,
      description: `${description} (${id})`,
      nodes: nodes.length,
    })),
  );
}

Cypress.Commands.add(
  'checkPageA11y',
  {
    prevSubject: 'optional',
  },
  (subject, { skipFailures = true } = {}) => {
    cy.checkA11y(subject, null, printAccessibilityViolations, skipFailures);
  },
);

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session(email, () => {
    cy.visit('/');
    cy.contains('Log In').click();

    cy.url().should('include', 'ims.ihtsdotools.org');
    cy.url().should('include', '/login');

    cy.get('#username').type(Cypress.env('ims_username'));
    cy.get('#password').type(Cypress.env('ims_password'));

    cy.intercept('/api/authenticate').as('authenticate');

    cy.get('button[type="submit"]').click();

    cy.wait('@authenticate');

    cy.url().should('include', 'snomio');
  });
});

Cypress.Commands.add('waitForGetTicketList', callback => {
  cy.intercept({
    method: 'POST',
    url: '/api/tickets/search?**',
  }).as('getTicketList');
  callback();
  cy.wait('@getTicketList');
});

Cypress.Commands.add('waitForGetUsers', () => {
  cy.intercept({
    method: 'GET',
    url: '/api/users',
  }).as('getUsers');
  cy.wait('@getUsers');
});

Cypress.Commands.add('waitForCreateTicket', callback => {
  cy.intercept({
    method: 'POST',
    url: '/api/tickets',
  }).as('createTicket');
  callback();
  return cy.wait('@createTicket').then(interception => {
    return interception.response.body as Ticket;
  });
});

Cypress.Commands.add('interceptFetchTicket', () => {
  cy.intercept({
    method: 'GET',
    url: `/api/tickets/*`,
  }).as('getTicket');
});

Cypress.Commands.add('interceptPutTicket', () => {
  cy.intercept({
    method: 'PUT',
    url: `/api/tickets/*`,
  }).as('putTicket');
});

Cypress.Commands.add('interceptPutTicketLabel', () => {
  cy.intercept({
    method: 'POST',
    url: `/api/tickets/*/labels/*`,
  }).as('putTicketLabel');
});

Cypress.Commands.add('interceptPutTicketIteration', () => {
  cy.intercept({
    method: 'PUT',
    url: `/api/tickets/*/iteration/*`,
  }).as('putTicketIteration');
});

Cypress.Commands.add('interceptPutTicketState', () => {
  cy.intercept({
    method: 'PUT',
    url: `/api/tickets/*/state/*`,
  }).as('putTicketState');
});

Cypress.Commands.add('interceptPutTicketSchedule', () => {
  cy.intercept({
    method: 'PUT',
    url: `/api/tickets/*/schedule/*`,
  }).as('putTicketSchedule');
});

Cypress.Commands.add('interceptPutTicketPriority', () => {
  cy.intercept({
    method: 'PUT',
    url: `/api/tickets/*/priorityBuckets/*`,
  }).as('putTicketPriority');
});

Cypress.Commands.add('interceptPostAdditionalFieldValue', () => {
  cy.intercept({
    method: 'POST',
    url: `/api/tickets/*/additionalFieldValue/*/*`,
  }).as('postAdditionalFieldValue');
});

Cypress.Commands.add('interceptPostComment', () => {
  cy.intercept({
    method: 'POST',
    url: `/api/tickets/*/comments`,
  }).as('postComment');
});

Cypress.Commands.add('interceptDeleteComment', () => {
  cy.intercept({
    method: 'DELETE',
    url: `/api/tickets/*/comments/*`,
  }).as('deleteComment');
});

Cypress.Commands.add('interceptPostAttachment', () => {
  cy.intercept({
    method: 'POST',
    url: `/api/attachments/upload/*`,
  }).as('postAttachment');
});

Cypress.Commands.add('interceptDeleteAttachment', () => {
  cy.intercept({
    method: 'DELETE',
    url: `/api/attachments/*`,
  }).as('deleteAttachment');
});

Cypress.Commands.add('waitForProductLoad', (timeout:number) => {
  cy.intercept({
    method: 'GET',
    url: `/api/MAIN/SNOMEDCT-AU/AUAMT/product-model/*`,
  }).as('getProductLoad');
  cy.wait(timeout);
});
