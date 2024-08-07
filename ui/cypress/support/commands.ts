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
import { TaskAssocation, Ticket } from '../../src/types/tickets/ticket';
import { Task } from '../../src/types/task';
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

Cypress.Commands.add('waitForProductLoad', (branch: string) => {
  cy.intercept({
    method: 'GET',
    url: `/api/${branch}/product-model/*`,
  }).as('getProductLoad');
});
Cypress.Commands.add('waitForMedicationLoad', (branch: string) => {
  cy.intercept({
    method: 'GET',
    url: `/api/${branch}/medications/*`,
  }).as('getMedicationLoad');
});

Cypress.Commands.add('waitForCalculateMedicationLoad', (branch: string) => {
  cy.intercept({
    method: 'POST',
    url: `/api/${branch}/medications/product/$calculate`,
  }).as('postCalculateMedicationLoad');
});
Cypress.Commands.add('waitForCreateMedication', (branch: string) => {
  cy.intercept({
    method: 'POST',
    url: `/api/${branch}/medications/product`,
  }).as('postMedication');
});
Cypress.Commands.add('waitForConceptSearch', (branch: string) => {
  cy.intercept({
    method: 'GET',
    url: `/snowstorm/${branch}/concepts?*`,
  }).as('getConceptSearch');
});
Cypress.Commands.add('interceptPostCreateTask', () => {
  cy.intercept({
    method: 'POST',
    url: `/api/tasks`,
  }).as('postCreateTask');
});

Cypress.Commands.add('waitForGetTasks', () => {
  cy.intercept({
    method: 'GET',
    url: '/api/tasks',
  }).as('getTasks');
});

Cypress.Commands.add('waitForGetTaskDetails', (key: string) => {
  cy.intercept({
    method: 'GET',
    url: `/authoring-services/projects/AUAMT/tasks/${key}`,
  }).as('getTaskDetails');
});

Cypress.Commands.add('interceptPutTask', (key: string) => {
  cy.intercept({
    method: 'PUT',
    url: `/authoring-services/projects/AUAMT/tasks/${key}`,
  }).as('updateTask');
});

Cypress.Commands.add('waitForCreateTask', callback => {
  cy.intercept({
    method: 'POST',
    url: '/api/tasks',
  }).as('createTask');
  callback();
  return cy.wait('@createTask').then(interception => {
    return interception.response.body as Task;
  });
});

Cypress.Commands.add('waitForTaskTicketAssociation', callback => {
  cy.intercept({
    method: 'POST',
    url: '/api/tickets/*/taskAssociations/*',
  }).as('associateTaskTicket');
  callback();
  return cy.wait('@associateTaskTicket').then(interception => {
    return interception.response.body as TaskAssocation;
  });
});

Cypress.Commands.add('interceptPutProduct', (key: number) => {
  cy.intercept({
    method: 'PUT',
    url: `/api/tickets/${key}/products`,
  }).as('updateProduct');
});

Cypress.Commands.add('waitForTicketProductsLoad', (ticketKey: number) => {
  cy.intercept({
    method: 'GET',
    url: `/api/tickets/${ticketKey}/products*`,
  }).as('getTicketProducts');
});

Cypress.Commands.add('waitForTicketProductLoad', (ticketKey: number) => {
  cy.intercept({
    method: 'GET',
    url: `/api/tickets/${ticketKey}/products/*`,
  }).as('getTicketProduct');
});

Cypress.Commands.add('interceptGetLogout', () => {
  cy.intercept({
    method: 'GET',
    url: `/api/auth/logout`,
  }).as('getLogout');
});

Cypress.Commands.add('interceptGetLabels', () => {
  cy.intercept({
    method: 'GET',
    url: `/api/tickets/labelType`,
  }).as('getLabels');
});

Cypress.Commands.add('interceptPostLabels', () => {
  cy.intercept({
    method: 'POST',
    url: `/api/tickets/labelType`,
  }).as('postLabels');
});

Cypress.Commands.add('interceptGetExternalRequestors', () => {
  cy.intercept({
    method: 'GET',
    url: `/api/tickets/externalRequestors`,
  }).as('getExternalRequestors');
});

Cypress.Commands.add('interceptPostExternalRequestors', () => {
  cy.intercept({
    method: 'POST',
    url: `/api/tickets/externalRequestors`,
  }).as('postExternalRequestors');
});

Cypress.Commands.add('interceptGetIterations', () => {
  cy.intercept({
    method: 'GET',
    url: `/api/tickets/iterations`,
  }).as('getIterations');
});

Cypress.Commands.add('interceptPostIterations', () => {
  cy.intercept({
    method: 'POST',
    url: `/api/tickets/iterations`,
  }).as('postIterations');
});

Cypress.Commands.add('interceptGetTicketFilter', () => {
  cy.intercept({
    method: 'GET',
    url: `/api/tickets/ticketFilters`,
  }).as('getTicketFilter');
});

Cypress.Commands.add('interceptPostTicketFilter', () => {
  cy.intercept({
    method: 'POST',
    url: `/api/tickets/ticketFilters`,
  }).as('postTicketFilter');
});
