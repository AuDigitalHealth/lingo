import promisify from 'cypress-promise';
import { Comment, Ticket } from '../../src/types/tickets/ticket';
import { AttachmentUploadResponse } from '../../src/types/attachment';
import { visitBacklogPage } from './helpers/backlog';

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

  it('can search by title', { scrollBehavior: false }, () => {
    visitBacklogPage();
    cy.scrollTo('top', { duration: 1000 });
    searchByTitle('64435');
  });

  it('can save and load filters', { scrollBehavior: false }, () => {
    visitBacklogPage();

    searchByTitle('64435');
    cy.get('[data-testid="backlog-filter-save"]').click();

    // save, so it's always unique, in case you are running it locally
    const currentTimeInMs = Date.now();
    cy.get('[data-testid="save-filter-modal-input"]').type(
      '64435 - ' + currentTimeInMs,
    );
    cy.interceptPostTicketFilter();
    cy.interceptGetTicketFilter();
    cy.get('[data-testid="save-filter-modal-save"]').click();
    cy.wait('@postTicketFilter');
    cy.wait('@getTicketFilter');

    // clear the list

    cy.waitForGetTicketList(() =>
      cy.get('[data-testid="backlog-filter-clear"]').click(),
    );

    // load the saved filter
    cy.get('[data-testid="backlog-filter-load"]').click();

    cy.get('[data-testid="load-filter-modal-input"]').click();

    cy.get('[data-testid="load-filter-modal-input-dropdown"] > ul > li')
      .contains('64435 - ' + currentTimeInMs)
      .click();

    cy.waitForGetTicketList(() =>
      cy.get('[data-testid="load-filter-modal-submit"]').click(),
    );

    // check the filter is loaded, should be 1 entry

    cy.get('tbody > tr').should('exist').and('have.length', 1);
  });
});

function searchByTitle(title: string) {
  cy.scrollTo('top', { duration: 1000 });
  cy.get('.p-datatable-thead > tr > th')
    .eq(1)
    .find('.p-column-filter-menu-button')
    .click();

  cy.wait(1000);

  cy.get('[data-testid="title-filter-input"]').type(title, { delay: 1000 });

  //   cy.get('input.p-inputtext').eq(1).type('64435', {delay: 1000});

  // cy.wait(10000)

  cy.get('button[aria-label="Apply"]').click();
  cy.wait('@getTicketList');
  cy.get('tbody > tr').should('exist').and('have.length', 1);
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
