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

import { verifyLoadedProduct } from './helpers/product';

describe('Search Spec', () => {
  beforeEach(() => {
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
  });
  it('can perform search and load single product using term', () => {
    visitProductSearchPage();

    searchAndLoadProduct('amox');
    verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
  });

  it('can perform search and load single product using sct Id', () => {
    visitProductSearchPage();
    setProductSearchFilter('Sct Id');

    // searchAndLoadProduct('44207011000036100');
    searchAndLoadProduct('700027211000036107');

    verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
  });

  it('can perform search and load single product using Artg Id', () => {
    visitProductSearchPage();
    setProductSearchFilter('Artg Id');

    searchAndLoadProduct('200051');
    verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
  });

  it('can perform search and load Multi pack product using term', () => {
    visitProductSearchPage();

    searchAndLoadProduct('hp7', 120000);
    verifyLoadedProduct(3, 3, 4, 4, 3, 4, 4, 0, 0, 0, 0, 0, 0, 0);
  });

  function visitProductSearchPage() {
    cy.visit('/dashboard');
    cy.waitForGetUsers();
    cy.url().should('include', 'dashboard');
  }
});

function searchAndLoadProduct(value: string, timeout?: number) {
  if (!timeout) {
    timeout = 30000; //default timeout
  }
  cy.waitForConceptSearch(Cypress.env('apDefaultBranch'));
  cy.get('[data-testid="search-product-input"]').type(value, { delay: 5 });
  cy.wait(2000); //adding a delay for type to complete
  cy.wait('@getConceptSearch');
  cy.get('[data-testid="search-product-input"] input').should(
    'have.value',
    value,
  );

  cy.get('ul[role="listbox"]').should('be.visible');
  cy.waitForProductLoad(Cypress.env('apDefaultBranch'));
  cy.get('li[data-option-index="0"]').click();
  cy.wait('@getProductLoad', { responseTimeout: timeout }); //handling response timeout more than default 30s
  cy.url().should('include', 'products');
  cy.get('#product-view').should('be.visible');
}
function setProductSearchFilter(filterType: string) {
  cy.get('[data-testid="search-product-filter-input"]').click();
  cy.contains('[role="option"]', filterType).click();
  cy.get('[data-testid="search-product-filter-input"]').should(
    'contain.text',
    filterType,
  );
}
