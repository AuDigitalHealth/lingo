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

import {setupMockInterceptors} from "../support/mock-interceptors";

describe('Login Spec', () => {

    const login = () => {
        cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
    };

  it('loads the page', () => {
    cy.visit('/');
  });

  it('logs in to ims', function () {
    login();
  });

  it('displays the dashboard', function () {
    login();
    cy.visit('/');
    cy.url().should('include', 'dashboard');
  });


  it('shows login page when unauthenticated', function () {
    cy.intercept('GET', '/config', { fixture: 'api/app-config.json' });
    cy.intercept('GET', '/api/auth', {
      statusCode: 403,
      body: { error: 'Unauthorized' },
    });
    cy.visit('/');
    cy.url().should('match', /\/(login)?\/?$/);
  });

  it('redirects to dashboard when already authenticated', function () {
    login();
    cy.visit('/');
    cy.reload();
    cy.url().should('include', 'dashboard');
  });

  it('shows the user profile area in the header when logged in', function () {
    login();
    cy.visit('/dashboard/tasks');
    cy.url().should('include', 'dashboard');
    cy.get('[data-testid="profile-button"]', { timeout: 10000 }).should(
      'exist',
    );
  });
});
