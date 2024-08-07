import promisify from 'cypress-promise';
import { Comment, Ticket, TicketDto } from '../../src/types/tickets/ticket';
import { AttachmentUploadResponse } from '../../src/types/attachment';
import { visitBacklogPage, visitDashboard } from './helpers/backlog';

describe('Logout Spec', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
  });

  it('can logout with profile icon', { scrollBehavior: false }, async () => {
    visitDashboard();
    cy.interceptGetLogout();
    cy.get('[data-testid="profile-button"]').click();
    cy.get('[data-testid="profile-card"]').should('exist');
    cy.get('[data-testid="profile-logout-icon"]').click();
    cy.wait('@getLogout');
    cy.url().should('include', 'login');
  });

  it('can logout through profile tab', { scrollBehavior: false }, async () => {
    visitDashboard();
    cy.interceptGetLogout();
    cy.get('[data-testid="profile-button"]').click();
    cy.get('[data-testid="profile-card"]').should('exist');
    cy.get('[data-testid="profile-card-settings-tab-button"]').click();
    cy.get('[data-testid="profile-card-profile-tab-logout"]').click();
    cy.wait('@getLogout');
    cy.url().should('include', 'login');
  });
});
