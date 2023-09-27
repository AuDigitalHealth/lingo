import { Task } from '../../src/types/task';

describe('Task spec', () => {
  before(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
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

function createNewTaskIfNotExists() {
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const url = Cypress.env('apUrl') + '/authoring-services/projects/my-tasks';
  cy.request(url).as('myTasks');

  const chainable = cy.request(url).then(response => {
    const tasks = response.body as Task[];
    if (tasks.length > 0) {
      return tasks[0].key;
    } else {
      createTask('Test task cypress', 'test task cypress').then(
        taskId => taskId,
      );
    }
  });
  return chainable;
}
function createTask(
  description: string,
  summary: string,
): Cypress.Chainable<string> {
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
      return task.key;
    });
  return chainable;
}
// function deleteAllMyTasks() {
//   const url = Cypress.env('apUrl') + '/authoring-services/projects/my-tasks';
//   cy.request(url).as('myTasks');
//
//   const chainable = cy.request(url).then(response => {
//     const tasks = response.body as Task[];
//     if (tasks.length > 0) {
//       tasks.map(task => (deleteTask(task.key)));
//     }
//   });
//   return chainable;
// }
// function deleteTask(
//     taskKey:string
// ): Cypress.Chainable<string> {
//
//   const url = Cypress.env('apUrl') + `/authoring-services/projects/AU/tasks/${taskKey}`;
//   const chainable = cy
//       .request('PUT', url, { status: "DELETED" })
//       .then(response => {
//         expect(response.body).to.have.property('status', "Deleted"); // true
//         const task = response.body as Task;
//         return task.key;
//       });
//   return chainable;
// }
