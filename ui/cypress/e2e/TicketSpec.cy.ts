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

import promisify from 'cypress-promise';
import { Comment, Ticket } from '../../src/types/tickets/ticket';
import { AttachmentUploadResponse } from '../../src/types/attachment';
import { createTicket, interceptAndFakeJiraUsers } from './helpers/backlog';
import {
  testLabels,
  testState,
  testTitle,
  testAdditionalFields,
  testAttachments,
  testComments,
  testSchedule,
  updatePriority,
  deleteTicket,
} from './helpers/ticket';

describe('Ticket Spec', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
    interceptAndFakeJiraUsers();
    cy.setUpIteration();
    cy.setUpExternalRequestor();
  });

  it('can create a ticket', async () => {
    const ticket = await promisify(createTicket('Test Ticket One'));
    if (ticket.ticketNumber === undefined) {
      throw new Error('Invalid ticketNumber');
    }
    testEditTicket(ticket);
  });
});

function testEditTicket(ticket: Ticket) {
  testTitle(ticket);

  testLabels(ticket);
  // testIteration(ticket);
  testState(ticket);
  testSchedule(ticket);
  updatePriority(ticket);
  testAdditionalFields(ticket);

  testComments(ticket);
  testAttachments(ticket);
  deleteTicket(ticket);
}
