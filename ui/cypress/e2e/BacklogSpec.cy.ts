import promisify from 'cypress-promise';
import { Ticket } from '../../src/types/tickets/ticket';

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

    cy.get('#ticket-title').should('have.text', 'e2e test ticket');

    cy.get('#ticket-header-edit').click();

    cy.get('#ticket-title-edit').type(' - updated');
    cy.interceptPutTicket();
    cy.get('#ticket-title-save').click();
    cy.wait('@putTicket');
    cy.get('#ticket-title').should('have.text', 'e2e test ticket - updated');
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

// describe('Create Spec', () => {
//     before(() => {
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//         cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
//     })

// })

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
