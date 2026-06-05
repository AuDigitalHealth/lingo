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

import { createNewTaskIfNotExists } from './helpers/task';

describe('Task Spec', () => {
  beforeEach(() => {
    // Cypress 13 `testIsolation` clears cookies before every test, so the
    // session must be restored per-test (cy.login is cached via cy.session).
    // Using `before` only authenticated the first test; later tests that make
    // a real cy.request to authoring-services then 403'd. Other specs
    // (BacklogSpec, TicketSpec) log in via beforeEach for the same reason.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
    createNewTaskIfNotExists();
  });

  it('displays the my tasks page', () => {
    cy.visit('/dashboard/tasks');
    cy.url().should('include', 'dashboard/tasks');
    cy.injectAxe();
    cy.checkPageA11y();
  });

  it('displays the all tasks page', () => {
    cy.visit('/dashboard/tasks/all');
    cy.url().should('include', 'dashboard/tasks/all');
    cy.injectAxe();
    cy.checkPageA11y();
  });

  it('displays the tasks needing review page', () => {
    cy.visit('/dashboard/tasks/needReview');
    cy.url().should('include', 'dashboard/tasks/needReview');
    cy.injectAxe();
    cy.checkPageA11y();
  });

  it('displays the tasks requested your review page', () => {
    cy.visit('/dashboard/tasks/reviewRequested');
    cy.url().should('include', 'dashboard/tasks/reviewRequested');
    cy.injectAxe();
    cy.checkPageA11y();
  });

  it('displays the task details edit page', () => {
    const taskCreation = createNewTaskIfNotExists();
    taskCreation.then(value => {
      cy.visit('/dashboard/tasks/edit/' + value);
      cy.injectAxe();
      cy.checkPageA11y();
    });
  });
});
