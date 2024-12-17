import promisify from 'cypress-promise';
import { Comment, Ticket, TicketDto } from '../../../src/types/tickets/ticket';
import { AttachmentUploadResponse } from '../../../src/types/attachment';
import { createTicket, interceptAndFakeJiraUsers } from './backlog';

export async function testTitle(ticket: Ticket) {
  cy.get('#ticket-title').should('have.text', ticket.title);

  cy.get('#ticket-header-edit').click();

  cy.get('#ticket-title-edit').type(' - updated');
  cy.interceptPutTicket();
  cy.get('#ticket-title-save').click();
  cy.wait('@putTicket');
  cy.get('#ticket-title').should('have.text', ticket.title + ' - updated');

  cy.get('#ticket-fields-edit').click();
}

export function testLabels(ticket: Ticket) {
  cy.interceptPutTicketLabel();
  cy.get(`#ticket-labels-select-${ticket.id}`).click();

  return cy
    .get(`#ticket-labels-select-${ticket.id}-container > ul > li`)
    .eq(0)
    .find('.MuiChip-label')
    .invoke('text')
    .then(labelText => {
      cy.get(`#ticket-labels-select-${ticket.id}-container > ul > li`)
        .eq(0)
        .click();

      cy.wait('@putTicketLabel').wait(1000);
      cy.get('body').type('{esc}');

      cy.get(`#ticket-labels-select-${ticket.id}`)
        .find('span')
        .contains(labelText);
    });
}

export function testIteration(ticket: Ticket) {
  cy.interceptPutTicketIteration();
  cy.get(`#ticket-iteration-select-${ticket.id}`).click();

  return cy
    .get(`#ticket-iteration-select-${ticket.id}-container > ul > li`)
    .eq(1)
    .find('.MuiChip-label')
    .invoke('text')
    .then(iterationText => {
      cy.get(`#ticket-iteration-select-${ticket.id}-container > ul > li`)
        .eq(1)
        .click();

      cy.wait('@putTicketIteration').wait(1000);
      cy.get('body').type('{esc}');

      cy.get(`#ticket-iteration-select-${ticket.id}`)
        .find('span')
        .contains(iterationText);
    });
}

export function testState(ticket: Ticket) {
  cy.interceptPutTicketState();
  cy.get(`#ticket-state-select-${ticket.id}`).click();

  return cy
    .get(`#ticket-state-select-${ticket.id}-container > ul > li`)
    .eq(1)
    .find('.MuiChip-label')
    .invoke('text')
    .then(stateText => {
      cy.get(`#ticket-state-select-${ticket.id}-container > ul > li`)
        .eq(1)
        .click();

      cy.wait('@putTicketState').wait(1000);

      cy.get(`#ticket-state-select-${ticket.id}`)
        .find('span')
        .contains(stateText);
    });
}

export async function testSchedule(ticket: Ticket) {
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
  cy.get(`#ticket-schedule-select-${ticket.id}`)
    .find('p')
    .contains(scheduleText);
}

export function updatePriority(ticket: Ticket) {
  cy.interceptPutTicketPriority();
  cy.get(`#ticket-priority-select-${ticket.id}`).click();

  return cy
    .get(`#ticket-priority-select-${ticket.id}-container > ul > li`)
    .eq(1)
    .find('p')
    .invoke('text')
    .then(priorityText => {
      cy.get(`#ticket-priority-select-${ticket.id}-container > ul > li`)
        .eq(1)
        .click();

      cy.wait('@putTicketPriority').wait(1000);

      cy.get(`#ticket-priority-select-${ticket.id}`)
        .find('p')
        .contains(priorityText);

      // return cy.then(priorityText);
    });
}

export async function testAdditionalFields(ticket: Ticket) {
  cy.interceptPostAdditionalFieldValue();
  editAdditionalFieldTextField(`#ticket-af-input-ARTGID`, '69420');
  editAdditionalFieldTextField(`#ticket-af-input-StartDate`, '04/02/1993');
  editAdditionalFieldTextField(`#ticket-af-input-EffectiveDate`, '04/02/1993');
  editAdditionalFieldTextField(`#ticket-af-input-DateRequested`, '04/02/1993');
  editAdditionalFieldTextField(`#ticket-af-input-InactiveDate`, '04/02/1993');
}

export function editAdditionalFieldTextField(idPrefix: string, value: string) {
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

export async function editAdditionalFieldSelectField(idPrefix: string) {
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

export async function testComments(ticket: Ticket) {
  const commentText = 'This is a tester comment';
  cy.interceptPostComment();
  cy.get('[data-testid="ticket-comment-edit"]').find('p').type(commentText);
  cy.get('[data-testid="ticket-comment-submit"]').click();

  const comment: Comment = await promisify(
    cy.wait('@postComment').then(interception => {
      return interception.response.body;
    }),
  );

  cy.get('[data-testid="ticket-comment-viewbox"] > div')
    .eq(0)
    .find('p')
    .contains(commentText);

  cy.get(`[data-testid="ticket-comment-edit-${comment.id}"]`).click();

  const commentTextEdited = commentText + '- edited';
  cy.get('[data-testid="ticket-comment-editmode"]').find('p').type('- edited');

  cy.get(`[data-testid="ticket-comment-update-submit"]`).click();

  cy.get('[data-testid="ticket-comment-viewbox"] > div')
    .eq(0)
    .find('p')
    .contains(commentTextEdited);

  cy.interceptDeleteComment();
  cy.get(`[data-testid="ticket-comment-delete-${comment.id}"]`).click();

  cy.get(`[data-testid="confirmation-modal-action-button"]`).click();
  cy.wait('@deleteComment');

  cy.wait(1000);
  cy.get('[data-testid="ticket-comment-viewbox"]')
    .eq(0)
    .should('exist')
    .and('be.empty');
}

export async function testAttachments(ticket: Ticket) {
  const workingDirectory = Cypress.config('fileServerFolder');
  const uploadFile =
    workingDirectory + '/cypress/fixtures/test-file-upload.json';

  // the button just opens the input type=file element, we are not going to test the button.
  cy.interceptPostAttachment();
  cy.get(`[data-testid="ticket-attachment-upload-${ticket?.id}"]`).selectFile(
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
    `[data-testid="ticket-attachment-${attachmentResponse.attachmentId}"]`,
  ).should('exist');

  cy.get(
    `[data-testid="ticket-attachment-${attachmentResponse.attachmentId}"]`,
  ).trigger('mouseover');
  cy.get(
    `[data-testid="ticket-attachment-${attachmentResponse.attachmentId}-delete"]`,
  ).click();
  cy.interceptDeleteAttachment();
  cy.get(`[data-testid="confirmation-modal-action-button"]`).click();

  cy.wait('@deleteAttachment');
  cy.get(
    `[data-testid="ticket-attachment-${attachmentResponse.attachmentId}"]`,
  ).should('not.exist');
}

export async function deleteTicket(ticket: Ticket) {
  const deletedTicket = (await promisify(
    cy
      .request({
        method: 'DELETE',
        url: `/api/tickets/${ticket.id}`,
      })
      .then(res => {
        return res.body;
      }),
  )) as TicketDto;
}
