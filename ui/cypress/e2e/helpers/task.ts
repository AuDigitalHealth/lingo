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

import { Task } from '../../../src/types/task';
import promisify from 'cypress-promise';
import { TaskAssocation } from '../../../src/types/tickets/ticket';
import {
  BranchCreationRequest,
  BranchDetails,
} from '../../../src/types/Project';

export function createNewTaskIfNotExists() {
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const url = Cypress.env('apUrl') + '/authoring-services/projects/my-tasks';
  cy.request(url).as('myTasks');

  const chainable = cy.request(url).then(response => {
    const tasks = response.body as Task[];
    if (tasks.length > 0) {
      return tasks[0].key;
    } else {
      createTask('Test task cypress', 'test task cypress').then(task => task);
    }
  });
  return chainable;
}
export function createBranchIfNotExists(branchRequest: BranchCreationRequest) {
  const url = `${Cypress.env('snowStormUrl')}/branches/${branchRequest.parent}/${branchRequest.name}`;

  // Use `failOnStatusCode: false` to handle non-2xx/3xx responses
  cy.request({
    url: url,
    failOnStatusCode: false, // Prevents test failure on non-2xx/3xx responses
  }).then(response => {
    if (response.status === 404) {
      // Call createBranch if the branch does not exist
      return createBranch(branchRequest);
    }
  });
}
export function createTask(
  description: string,
  summary: string,
): Cypress.Chainable<Task> {
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const url =
    Cypress.env('apUrl') +
    '/authoring-services/projects/' +
    Cypress.env('apProjectKey') +
    '/tasks';
  const chainable = cy
    .request('POST', url, { description: description, summary: summary })
    .then(response => {
      expect(response.body).to.have.property('summary', summary); // true
      const task = response.body as Task;
      return task;
    });
  return chainable;
}

export function createBranch(
  branchCreationRequest: BranchCreationRequest,
): Cypress.Chainable<BranchDetails> {
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const url = Cypress.env('snowStormUrl') + `/branches`;
  const chainable = cy
    .request('POST', url, branchCreationRequest)
    .then(response => {
      if (response.status != 200) {
        this.handleErrors();
      }
      return response.body as BranchDetails;
    });
  return chainable;
}

export function deleteAllMyTasks() {
  const url = Cypress.env('apUrl') + '/authoring-services/projects/my-tasks';
  cy.request(url).as('myTasks');

  const chainable = cy.request(url).then(response => {
    const tasks = response.body as Task[];
    if (tasks.length > 0) {
      tasks.map(task => deleteTask(task.key));
    }
  });
  return chainable;
}
export function deleteTask(taskKey: string): Cypress.Chainable<string> {
  const project = Cypress.env('apProjectKey');
  const url =
    Cypress.env('apUrl') +
    `/authoring-services/projects/${project}/tasks/${taskKey}`;
  const chainable = cy
    .request('PUT', url, { status: 'DELETED' })
    .then(response => {
      expect(response.body).to.have.property('status', 'Deleted'); // true
      const task = response.body as Task;
      return task.key;
    });
  return chainable;
}
export function setupTask(timeout: number) {
  const projectKey = Cypress.env('apProjectKey');

  return cy.visit('/dashboard/tasks').then(() => {
    // Wait for tasks to load
    cy.waitForGetTasks();
    cy.wait('@getTasks');

    // Click the 'Create Task' button
    cy.get("[data-testid='create-task']").click();
    cy.get("[data-testid='task-create-title']").click().type('test-ticket');
    cy.get('[data-testid="task-create-project"]').click();
    cy.get(`[data-testid='project-option-${projectKey}']`).click();

    // Wait for task creation and return the task key
    return cy
      .waitForCreateTask(() => {
        cy.waitForBranchCreation();
        cy.get("[data-testid='create-task-modal']").click();
      })
      .then((task: Task) => {
        return task.key;
      });
  });
}

export async function associateTicketToTask(ticketNumber: string) {
  cy.get("[data-testid='tickets-link']", { timeout: 60000 });
  //TODO Comment out ticket association
  cy.get("[data-testid='tickets-link']").click();
  cy.get("[data-testid='add-ticket-btn']").click();
  cy.get('[data-testid="ticket-association-input"]').type(ticketNumber, {
    delay: 5,
  });
  cy.wait(2000);
  cy.get('ul[role="listbox"]').should('be.visible');
  cy.get('li[data-option-index="0"]').click();
  const taskAssociation = await promisify(
    cy
      .waitForTaskTicketAssociation(() => {
        cy.get("[data-testid='add-ticket-association-btn']").click();
      })
      .then(taskAssociation => {
        return taskAssociation as TaskAssocation;
      }),
  );

  cy.get('main a span').click();
  cy.get("[data-testid='create-new-product']", { timeout: 30000 }).should(
    'be.visible',
  );
  return taskAssociation.id;
}

export function loadTaskPage(taskKey: string, ticketKey: string) {
  if (taskKey === undefined) {
    throw new Error('Invalid taskKey');
  }
  if (ticketKey === undefined) {
    throw new Error('Invalid ticketKey');
  }
  cy.waitForGetTaskDetails(taskKey);
  cy.visit(`/dashboard/tasks/edit/${taskKey}`);
  cy.visit(`/dashboard/tasks/edit/${taskKey}/${ticketKey}`);
  cy.get("[data-testid='create-new-product']", { timeout: 30000 });
}
