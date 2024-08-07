import { Task } from '../../src/types/task';
import { createNewTaskIfNotExists } from './helpers/task';

describe('Task spec', () => {
  before(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
    // deleteAllMyTasks();
    createNewTaskIfNotExists();
  });
  it('displays the my task page', () => {
    cy.visit('/dashboard/tasks');
    //cy.url().should('include', 'dashboard');
    cy.url().should('include', 'dashboard/tasks');
    cy.injectAxe();
    cy.checkPageA11y();
  });
  it('displays the all task page', () => {
    cy.visit('/dashboard/tasks/all');
    //cy.url().should('include', 'dashboard');
    cy.url().should('include', 'dashboard/tasks/all');
    cy.injectAxe();
    cy.checkPageA11y();
  });
  it('displays tasks need review  page', () => {
    cy.visit('/dashboard/tasks/needReview');
    //cy.url().should('include', 'dashboard');
    cy.url().should('include', '/dashboard/tasks/needReview');
    cy.injectAxe();
    cy.checkPageA11y();
  });
  it('displays tasks requested your review', () => {
    cy.visit('/dashboard/tasks/reviewRequested');
    //cy.url().should('include', 'dashboard');
    cy.url().should('include', '/dashboard/tasks/reviewRequested');
    cy.injectAxe();
    cy.checkPageA11y();
  });
});
describe('Task details spec', () => {
  before(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
  });

  it('displays the task details page', () => {
    //commented out below as its taking time to load all the task
    // cy.visit('/dashboard/tasks/all');
    // cy.get('.MuiDataGrid-row', { timeout: 20000 })
    //   .should('be.visible')
    //   .find('a.task-details-link')
    //   .first()
    //   .click();
    const taskCreation = createNewTaskIfNotExists();
    taskCreation.then(value => {
      cy.visit('/dashboard/tasks/edit/' + value);
      cy.injectAxe();
      cy.checkPageA11y();
    });
  });
});
