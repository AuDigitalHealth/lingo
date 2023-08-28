import { createTask } from './TaskSpec.cy';

describe('Task details spec', () => {
  before(() => {
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
    createTask('Test task cypress', 'Test task cypress');
  });

  it('displays the task details page', () => {
    cy.visit('/dashboard/tasks/all');
    //cy.url().should('include', 'dashboard');
    cy.url().should('include', 'dashboard/tasks/all');
    cy.get('.task-list', { timeout: 2000 })
      .should('be.visible')
      .find('a.task-details-link')
      .first()
      .click();
    cy.checkPageA11y();
  });
});
