export function visitBacklogPage() {
  cy.visit('/dashboard');
  cy.waitForGetUsers();
  cy.waitForGetTicketList(() => cy.get('#backlog').click());
  cy.url().should('include', 'dashboard');
}
