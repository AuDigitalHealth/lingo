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
