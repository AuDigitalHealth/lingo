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

    cy.url().should('include', 'dashboard');
  });
});

export function login(name: string){
  cy.session(name, () => {
    cy.visit(Cypress.env('frontend_url'));
    debugger;
    cy.contains('Log In').click();

    cy.url().should('include', 'ims.ihtsdotools.org');
    cy.url().should('include', '/login');

    cy.get('#username').type(Cypress.env('ims_username'));
    cy.get('#password').type(Cypress.env('ims_password'));

    cy.intercept('/api/authenticate').as('authenticate');

    cy.get('button[type="submit"]').click();

    cy.wait('@authenticate');

    cy.url().should('include', 'snomio');
  });
};
