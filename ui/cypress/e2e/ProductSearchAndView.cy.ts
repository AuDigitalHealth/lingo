
describe('Search Spec', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
  });
  it('can perform search and load single product using term', () => {
    visitProductSearchPage();

    searchAndLoadProduct('amox', 25000, 5000);
    verifyLoadedProduct(1,1,1,1,1,1,1);

  });

  it('can perform search and load single product using sct Id', () => {
    visitProductSearchPage();
    setProductSearchFilter("Sct Id");

    searchAndLoadProduct('44207011000036100', 25000, 12000);
    verifyLoadedProduct(1,1,1,1,1,1,1);

  });

  it('can perform search and load single product using Artg Id', () => {
    visitProductSearchPage();
    setProductSearchFilter("Artg Id");

    searchAndLoadProduct('200051', 25000, 15000);
    verifyLoadedProduct(1,1,1,1,1,1,1);

  });

  it('can perform search and load Multi pack product using term', () => {
    visitProductSearchPage();

    searchAndLoadProduct('hp7', 120000, 5000);
    verifyLoadedProduct(3,3,4,4,3,4,4);

  });


  function visitProductSearchPage() {
    cy.visit('/dashboard');
    cy.waitForGetUsers();
    cy.url().should('include', 'dashboard');
  }
});

  function searchAndLoadProduct(value: string, timeout:number, searchTimeout:number) {
    cy.get('[data-testid="search-product-input"]').type(value, { delay: 5 });
    cy.wait(searchTimeout);
    cy.get('[data-testid="search-product-input"] input').should('have.value', value);
    // cy.get('ul[role="listbox"]').should('be.visible');
    cy.get('li[data-option-index="0"]').click();
    cy.waitForProductLoad(timeout);
    cy.url().should('include', 'products');
    cy.get('#product-view').should('be.visible');

  }
  function setProductSearchFilter(filterType:string){
    cy.get('[data-testid="search-product-filter-input"]').click();
    cy.contains('[role="option"]', filterType).click();

    // Optionally, you can assert that the selected option is displayed
    cy.get('[data-testid="search-product-filter-input"]').should('contain.text', filterType);


  }

function verifyLoadedProduct(mpCount:number, mpuuCount:number,mppCount:number,tpCount:number,tpuuCount:number,tppCount:number, ctppCount:number) {
  cy.get('[data-testid="product-group-MP"]').within(() => {
    cy.get('[data-testid="product-group-title-MP"]').should('have.text', 'Product');
    cy.get('[data-testid="accodion-product"]').should('have.length', mpCount);
  });
  cy.get('[data-testid="product-group-MPUU"]').within(() => {
    cy.get('[data-testid="product-group-title-MPUU"]').should('have.text', 'Generic Product');
    cy.get('[data-testid="accodion-product"]').should('have.length', mpuuCount);
  });

  cy.get('[data-testid="product-group-MPP"]').within(() => {
    cy.get('[data-testid="product-group-title-MPP"]').should('have.text', 'Generic Pack');
    cy.get('[data-testid="accodion-product"]').should('have.length', mppCount);
  });

  cy.get('[data-testid="product-group-TP"]').within(() => {
    cy.get('[data-testid="product-group-title-TP"]').should('have.text', 'Brand Name');
    cy.get('[data-testid="accodion-product"]').should('have.length', tpCount);
  });
  cy.get('[data-testid="product-group-TPUU"]').within(() => {
    cy.get('[data-testid="product-group-title-TPUU"]').should('have.text', 'Branded Product');
    cy.get('[data-testid="accodion-product"]').should('have.length', tpuuCount);
  });
  cy.get('[data-testid="product-group-TPP"]').within(() => {
    cy.get('[data-testid="product-group-title-TPP"]').should('have.text', 'Branded Pack');
    cy.get('[data-testid="accodion-product"]').should('have.length', tppCount);
  });
  cy.get('[data-testid="product-group-CTPP"]').within(() => {
    cy.get('[data-testid="product-group-title-CTPP"]').should('have.text', 'Branded Container');
    cy.get('[data-testid="accodion-product"]').should('have.length', ctppCount);
  });
}
