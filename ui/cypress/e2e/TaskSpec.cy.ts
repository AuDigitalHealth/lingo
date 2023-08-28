describe('Task spec', () => {
  before(() => {
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
    createTask('Test task cypress', 'Test task cypress');
  });
  it('displays the my task page', () => {
    cy.visit('/dashboard/tasks');
    //cy.url().should('include', 'dashboard');
    cy.url().should('include', 'dashboard/tasks');
    cy.checkPageA11y();
  });
  it('displays the all task page', () => {
    cy.visit('/dashboard/tasks/all');
    //cy.url().should('include', 'dashboard');
    cy.url().should('include', 'dashboard/tasks/all');
    cy.checkPageA11y();
  });
  it('displays tasks need review  page', () => {
    cy.visit('/dashboard/tasks/needReview');
    //cy.url().should('include', 'dashboard');
    cy.url().should('include', '/dashboard/tasks/needReview');
    cy.checkPageA11y();
  });
  it('displays tasks requested your review', () => {
    cy.visit('/dashboard/tasks/reviewRequested');
    //cy.url().should('include', 'dashboard');
    cy.url().should('include', '/dashboard/tasks/reviewRequested');
    cy.checkPageA11y();
  });
});

export function createTask(description: string, summary: string) {
  const url = Cypress.env('apUrl') + '/authoring-services/projects/AU/tasks';
  cy.request('POST', url, { description: description, summary: summary }).then(
    response => {
      expect(response.body).to.have.property('summary', summary); // true
    },
  );
}
