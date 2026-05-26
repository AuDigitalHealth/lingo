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

import { setupMockInterceptors } from '../support/mock-interceptors';

describe('Logout Spec', () => {
  beforeEach(() => {
    if (Cypress.env('MOCK_MODE')) {
      setupMockInterceptors();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
    }
  });

  it('can logout with profile icon', { scrollBehavior: false }, () => {
    cy.visit('/dashboard');
    cy.url().should('include', 'dashboard');

    if (!Cypress.env('MOCK_MODE')) {
      cy.interceptGetLogout();
    }

    cy.get('[data-testid="profile-button"]', { timeout: 10000 }).click();
    cy.get('[data-testid="profile-card"]').should('exist');
    cy.get('[data-testid="profile-logout-icon"]').click();

    cy.wait(Cypress.env('MOCK_MODE') ? '@mockLogout' : '@getLogout');
    cy.url().should('include', 'login');
  });

  it('can logout through profile tab', { scrollBehavior: false }, () => {
    cy.visit('/dashboard');
    cy.url().should('include', 'dashboard');

    if (!Cypress.env('MOCK_MODE')) {
      cy.interceptGetLogout();
    }

    cy.get('[data-testid="profile-button"]', { timeout: 10000 }).click();
    cy.get('[data-testid="profile-card"]').should('exist');
    cy.get('[data-testid="profile-card-settings-tab-button"]').click();
    cy.get('[data-testid="profile-card-profile-tab-logout"]').click();

    cy.wait(Cypress.env('MOCK_MODE') ? '@mockLogout' : '@getLogout');
    cy.url().should('include', 'login');
  });
});
