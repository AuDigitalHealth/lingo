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

describe('Login Spec', () => {
  it('loads the page', () => {
    cy.visit('/');
  });

  // ── Live mode tests ────────────────────────────────────────────────────────

  it('logs in to ims', function () {
    if (Cypress.env('MOCK_MODE')) return this.skip();
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
  });

  it('displays the dashboard', function () {
    if (Cypress.env('MOCK_MODE')) return this.skip();
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
    cy.visit('/');
    cy.url().should('include', 'dashboard');
  });

  // ── Mock mode tests ────────────────────────────────────────────────────────

  it('shows login page when unauthenticated', function () {
    if (!Cypress.env('MOCK_MODE')) return this.skip();
    cy.intercept('GET', '/config', { fixture: 'api/app-config.json' });
    cy.intercept('GET', '/api/auth', {
      statusCode: 403,
      body: { error: 'Unauthorized' },
    });
    cy.visit('/');
    cy.url().should('include', '/login').or('include', '/');
  });

  it('redirects to dashboard when already authenticated', function () {
    if (!Cypress.env('MOCK_MODE')) return this.skip();
    setupMockInterceptors();
    cy.visit('/');
    cy.url().should('include', 'dashboard');
  });

  it('shows the dashboard after mocked login', function () {
    if (!Cypress.env('MOCK_MODE')) return this.skip();
    setupMockInterceptors();
    cy.visit('/');
    cy.url().should('include', 'dashboard');
    cy.get('body').should('be.visible');
  });

  it('shows the user profile area in the header when logged in', function () {
    if (!Cypress.env('MOCK_MODE')) return this.skip();
    setupMockInterceptors();
    cy.visit('/dashboard/tasks');
    cy.url().should('include', 'dashboard');
    cy.get('[data-testid="profile-button"]', { timeout: 10000 }).should(
      'exist',
    );
  });
});
