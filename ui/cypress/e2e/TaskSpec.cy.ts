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
