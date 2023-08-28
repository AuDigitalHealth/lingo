describe('login spec', () => {
  it('loads the page', () => {
    cy.visit('/');
  });

  it('logs in to ims', () => {
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
  });

  it('displays the dashboard', () => {
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));

    cy.visit('/');

    cy.url().should('include', 'dashboard');
  });
});
