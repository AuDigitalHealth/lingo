import { Task } from '../../../src/types/task';
import promisify from 'cypress-promise';
import { TaskAssocation } from '../../../src/types/tickets/ticket';

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
export async function setupTask() {
  const projectKey = Cypress.env('apProjectKey');
  cy.visit('/dashboard/tasks');
  cy.waitForGetTasks();
  cy.wait('@getTasks');
  //TODO comment out task creation
  cy.get("[data-testid='create-task']").click();
  cy.get("[data-testid='task-create-title']").click();
  cy.get("[data-testid='task-create-title']").type('test-ticket');
  cy.get('[data-testid="task-create-project"]').click();
  cy.get(`[data-testid='project-option-${projectKey}']`).click();
  //
  const task = await promisify(
    cy
      .waitForCreateTask(() => {
        cy.get("[data-testid='create-task-modal']").click();
      })
      .then(task => {
        return task as Task;
      }),
  );
  cy.waitForGetTaskDetails(task.key);
  cy.visit(`/dashboard/tasks/edit/${task.key}`);
  return task.key;
}

export async function associateTicketToTask() {
  cy.get("[data-testid='tickets-link']", { timeout: 60000 });
  //TODO Comment out ticket association
  cy.get("[data-testid='tickets-link']").click();
  cy.get("[data-testid='add-ticket-btn']").click();
  cy.get('[data-testid="ticket-association-input"]').type('amox', { delay: 5 });
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

export function loadTaskPage(taskKey: string, ticketKey) {
  cy.waitForGetTaskDetails(taskKey);
  cy.visit(`/dashboard/tasks/edit/${taskKey}`);
  cy.visit(`/dashboard/tasks/edit/${taskKey}/${ticketKey}`);
  cy.get("[data-testid='create-new-product']", { timeout: 30000 });
}
