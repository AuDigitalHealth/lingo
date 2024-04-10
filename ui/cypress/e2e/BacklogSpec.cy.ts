import promisify from 'cypress-promise';
import { Comment, Ticket } from '../../src/types/tickets/ticket';
import { AttachmentUploadResponse } from '../../src/types/attachment';

describe('Search Spec', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
  });
  it('can perform quicksearch', () => {
    visitBacklogPage();

    quickSearch('64435');

    openFirstTicketInTable();
  });

  it('can create a ticket', async () => {
    visitBacklogPage();

    cy.get('#create-ticket').click();
    cy.get('#create-ticket-modal').find('input').type('e2e test ticket');
    cy.interceptFetchTicket();
    const ticket = await promisify(
      cy
        .waitForCreateTicket(() => {
          cy.get('#create-ticket-modal').find('button').click();
        })
        .then(ticket => {
          return ticket as Ticket;
        }),
    );

    cy.wait('@getTicket');
    cy.url().should('include', `dashboard/tickets/individual/${ticket.id}`);

    testEditTicket(ticket);
  });

  //   it('can search by title', () => {
  //     visitBacklogPage();

  //     cy.get('.p-datatable-thead > tr > th')
  //       .eq(1)
  //       .find('.p-column-filter-menu-button')
  //       .click();

  //       cy.wait(6000);

  //     cy.get('input.p-inputtext').eq(1).type('64435');

  //     // cy.wait(10000)

  //     cy.get('button[aria-label="Apply"]').click();
  //     cy.wait('@getTicketList');
  //     cy.get('tbody > tr').should('exist').and('have.length', 1);

  //     // cy.injectAxe();
  //     // cy.checkPageA11y();
  //   });
});

function visitBacklogPage() {
  cy.visit('/dashboard');
  cy.waitForGetUsers();
  cy.waitForGetTicketList(() => cy.get('#backlog').click());
  cy.url().should('include', 'dashboard');
}

function openFirstTicketInTable() {
  cy.get('tbody > tr')
    .should('exist')
    .should('have.length', 1)
    .find('td')
    .eq(1)
    .find('a')
    .click();
  cy.url().should('match', /\/tickets\/individual\/\d+/);
}

function quickSearch(value: string) {
  cy.waitForGetTicketList(() => cy.get('#backlog-quick-search').type(value));
}

async function testEditTicket(ticket: Ticket) {
  testTitle(ticket);

  testLabels(ticket);
  testIteration(ticket);
  testState(ticket);
  testSchedule(ticket);
  testPriority(ticket);
  testAdditionalFields(ticket);

  testComments(ticket);
  testAttachments(ticket);
}

async function testTitle(ticket: Ticket) {
  cy.get('#ticket-title').should('have.text', ticket.title);

  cy.get('#ticket-header-edit').click();

  cy.get('#ticket-title-edit').type(' - updated');
  cy.interceptPutTicket();
  cy.get('#ticket-title-save').click();
  cy.wait('@putTicket');
  cy.get('#ticket-title').should('have.text', ticket.title + ' - updated');

  cy.get('#ticket-fields-edit').click();
}
async function testLabels(ticket: Ticket) {
  cy.interceptPutTicketLabel();
  cy.get(`#ticket-labels-select-${ticket.id}`).click();

  const labelText = await promisify(
    cy
      .get(`#ticket-labels-select-${ticket.id}-container > ul > li`)
      .eq(0)
      .find('.MuiChip-label')
      .invoke('text')
      .then(labelText => {
        return labelText;
      }),
  );
  cy.get(`#ticket-labels-select-${ticket.id}-container > ul > li`)
    .eq(0)
    .click();
  cy.wait('@putTicketLabel').wait(1000);
  cy.get('body').type('{esc}');
  cy.get(`#ticket-labels-select-${ticket.id}`).find('span').contains(labelText);
}

async function testIteration(ticket: Ticket) {
  cy.interceptPutTicketIteration();
  cy.get(`#ticket-iteration-select-${ticket.id}`).click();

  const iterationText = await promisify(
    cy
      .get(`#ticket-iteration-select-${ticket.id}-container > ul > li`)
      .eq(1)
      .find('.MuiChip-label')
      .invoke('text')
      .then(labelText => {
        return labelText;
      }),
  );
  cy.get(`#ticket-iteration-select-${ticket.id}-container > ul > li`)
    .eq(1)
    .click();
  cy.wait('@putTicketIteration').wait(1000);
  cy.get('body').type('{esc}');
  cy.get(`#ticket-iteration-select-${ticket.id}`)
    .find('span')
    .contains(iterationText);
}

async function testState(ticket: Ticket) {
  cy.interceptPutTicketState();
  cy.get(`#ticket-state-select-${ticket.id}`).click();

  const stateText = await promisify(
    cy
      .get(`#ticket-state-select-${ticket.id}-container > ul > li`)
      .eq(1)
      .find('.MuiChip-label')
      .invoke('text')
      .then(labelText => {
        return labelText;
      }),
  );
  cy.get(`#ticket-state-select-${ticket.id}-container > ul > li`).eq(1).click();
  cy.wait('@putTicketState').wait(1000);
  cy.get('body').type('{esc}');
  cy.get(`#ticket-state-select-${ticket.id}`).find('span').contains(stateText);
}

async function testSchedule(ticket: Ticket) {
  cy.interceptPutTicketSchedule();
  cy.get(`#ticket-schedule-select-${ticket.id}`).click();

  const scheduleText = await promisify(
    cy
      .get(`#ticket-schedule-select-${ticket.id}-container > ul > li`)
      .eq(1)
      .find('p')
      .invoke('text')
      .then(scheduleText => {
        return scheduleText;
      }),
  );
  cy.get(`#ticket-schedule-select-${ticket.id}-container > ul > li`)
    .eq(1)
    .click();
  cy.wait('@putTicketSchedule').wait(1000);
  cy.get('body').type('{esc}');
  cy.get(`#ticket-schedule-select-${ticket.id}`)
    .find('p')
    .contains(scheduleText);
}

async function testPriority(ticket: Ticket) {
  cy.interceptPutTicketPriority();
  cy.get(`#ticket-priority-select-${ticket.id}`).click();

  const priorityText = await promisify(
    cy
      .get(`#ticket-priority-select-${ticket.id}-container > ul > li`)
      .eq(1)
      .find('p')
      .invoke('text')
      .then(scheduleText => {
        return scheduleText;
      }),
  );
  cy.get(`#ticket-priority-select-${ticket.id}-container > ul > li`)
    .eq(1)
    .click();
  cy.wait('@putTicketPriority').wait(1000);
  cy.get('body').type('{esc}');
  cy.get(`#ticket-priority-select-${ticket.id}`)
    .find('p')
    .contains(priorityText);
}

async function testAdditionalFields(ticket: Ticket) {
  cy.interceptPostAdditionalFieldValue();
  editAdditionalFieldTextField(`#ticket-af-input-ARTGID`, '69420');
  editAdditionalFieldTextField(`#ticket-af-input-StartDate`, '04/02/1993');
  editAdditionalFieldTextField(`#ticket-af-input-EffectiveDate`, '04/02/1993');
  editAdditionalFieldTextField(`#ticket-af-input-DateRequested`, '04/02/1993');
  editAdditionalFieldTextField(`#ticket-af-input-InactiveDate`, '04/02/1993');
  editAdditionalFieldSelectField(`#ticket-af-input-AMTFlags`);
}

function editAdditionalFieldTextField(idPrefix: string, value: string) {
  cy.get(idPrefix + '-save').should('be.disabled');
  cy.get(idPrefix + '-reset').should('be.disabled');
  cy.get(idPrefix + '-delete').should('be.disabled');
  cy.get(idPrefix).type(value);
  // check enabled
  cy.get(idPrefix + '-save').should('not.be.disabled');
  cy.get(idPrefix + '-reset').should('not.be.disabled');
  cy.get(idPrefix + '-delete').should('be.disabled');
  cy.get(idPrefix + '-save').click();

  cy.wait('@postAdditionalFieldValue');

  cy.get(idPrefix + '-save').should('be.disabled');
  cy.get(idPrefix + '-reset').should('be.disabled');
  cy.get(idPrefix + '-delete').should('not.be.disabled');
}

async function editAdditionalFieldSelectField(idPrefix: string) {
  cy.get(idPrefix).click();
  const afText = await promisify(
    cy
      .get(`${idPrefix}-container > ul > li`)
      .eq(1)
      .invoke('text')
      .then(scheduleText => {
        return scheduleText;
      }),
  );
  cy.get(`${idPrefix}-container > ul > li`).eq(1).click();

  cy.wait('@postAdditionalFieldValue');

  cy.get(`${idPrefix}`).contains(afText);
}

async function testComments(ticket: Ticket) {
  const commentText = 'This is a tester comment';
  cy.interceptPostComment();
  cy.get('[data-cy="ticket-comment-edit"]').find('p').type(commentText);
  cy.get('[data-cy="ticket-comment-submit"]').click();

  const comment: Comment = await promisify(
    cy.wait('@postComment').then(interception => {
      return interception.response.body;
    }),
  );

  cy.get('[data-cy="ticket-comment-viewbox"] > div')
    .eq(0)
    .find('p')
    .contains(commentText);

  cy.interceptDeleteComment();
  cy.get(`[data-cy="ticket-comment-delete-${comment.id}"]`).click();

  cy.get(`[data-cy="confirmation-modal-action-button"]`).click();
  cy.wait('@deleteComment');

  cy.get('[data-cy="ticket-comment-viewbox"] > div').eq(0).should('not.exist');
}

async function testAttachments(ticket: Ticket) {
  const workingDirectory = Cypress.config('fileServerFolder');
  const uploadFile =
    workingDirectory + '/cypress/fixtures/test-file-upload.json';

  // the button just opens the input type=file element, we are not going to test the button.
  cy.interceptPostAttachment();
  cy.get(`[data-cy="ticket-attachment-upload-${ticket?.id}"]`).selectFile(
    uploadFile,
    { force: true },
  );
  cy.interceptFetchTicket();
  const attachmentResponse: AttachmentUploadResponse = await promisify(
    cy.wait('@postAttachment').then(interception => {
      return interception.response.body;
    }),
  );
  cy.wait('@getTicket');

  cy.get(
    `[data-cy="ticket-attachment-${attachmentResponse.attachmentId}"]`,
  ).should('exist');

  cy.get(
    `[data-cy="ticket-attachment-${attachmentResponse.attachmentId}"]`,
  ).trigger('mouseover');
  cy.get(
    `[data-cy="ticket-attachment-${attachmentResponse.attachmentId}-delete"]`,
  ).click();
  cy.interceptDeleteAttachment();
  cy.get(`[data-cy="confirmation-modal-action-button"]`).click();

  cy.wait('@deleteAttachment');
  cy.get(
    `[data-cy="ticket-attachment-${attachmentResponse.attachmentId}"]`,
  ).should('not.exist');
}
