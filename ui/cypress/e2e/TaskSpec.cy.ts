import {login} from "./LoginSpec.cy";

describe('login spec', () => {
  it('loads the page', () => {
    cy.visit(Cypress.env('frontend_url'));
  });

  it('logs in to ims', () => {
    login('login');
  });

  it('displays the dashboard', () => {
    login('login');

    cy.visit(Cypress.env('frontend_url'));
    cy.ch

    cy.url().should('include', 'dashboard');
  });
});

