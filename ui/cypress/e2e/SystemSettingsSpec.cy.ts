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

import promisify from 'cypress-promise';
import { visitDashboard } from './helpers/backlog';
import {
  ExternalRequestorDto,
  Iteration,
  IterationDto,
  LabelTypeDto,
} from '../../src/types/tickets/ticket';

describe('Settings Spec', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
  });

  it('can create and edit labels', { scrollBehavior: false }, async () => {
    visitDashboard();
    cy.get('[data-testid="profile-button"]').click();
    cy.get('[data-testid="profile-card"]').should('exist');
    cy.get('[data-testid="profile-card-settings-tab-button"]').click();
    cy.get('[data-testid="profile-card-settings-tab-labels"]').click();
    cy.url().should('include', '/dashboard/settings/label');

    cy.get('[data-testid="profile-button"]').click();

    cy.get("[data-testid='create-label-button']").click();

    cy.get("[data-testid='label-modal-name']").click();
    cy.get("[data-testid='label-modal-name']").type('a');

    cy.get("[data-testid='label-modal-description']").click();
    cy.get("[data-testid='label-modal-description']").type('b');

    cy.get("[data-testid='label-modal-autocomplete'] > div").click();
    cy.get("[data-testid='li-color-option-Aqua'] > div").click();
    cy.interceptPostLabels();
    cy.interceptGetLabels();
    cy.get("[data-testid='label-modal-save']").click();

    const label = (await promisify(
      cy.wait('@postLabels').then(interceptor => {
        return interceptor.response.body;
      }),
    )) as LabelTypeDto;

    cy.wait('@getLabels');

    cy.get("[data-rowindex='0'] > div").eq(0).contains('a');
    cy.get("[data-rowindex='0'] > div").eq(1).contains('b');
    cy.get("[data-rowindex='0'] > div").eq(2).contains('Aqua');

    // edit what we just created
    cy.get(`[data-testid='label-settings-row-edit-${label.id}']`).eq(0).click();
    cy.get("[data-testid='label-modal-name']").click();
    cy.get("[data-testid='label-modal-name']").type('a');
    cy.get("[data-testid='label-modal-description']").click();
    cy.get("[data-testid='label-modal-description']").type('b');

    cy.get("[data-testid='label-modal-autocomplete'] > div").click();
    cy.contains('Red').click();

    cy.interceptGetLabels();

    cy.get("[data-testid='label-modal-save']").click();

    cy.wait('@postLabels');
    cy.wait('@getLabels');

    cy.get("[data-rowindex='0'] > div").eq(0).contains('aa');
    cy.get("[data-rowindex='0'] > div").eq(1).contains('bb');
    cy.get("[data-rowindex='0'] > div").eq(2).contains('Red');
  });

  it(
    'can create and edit external requestors',
    { scrollBehavior: false },
    async () => {
      visitDashboard();
      cy.get('[data-testid="profile-button"]').click();
      cy.get('[data-testid="profile-card"]').should('exist');
      cy.get('[data-testid="profile-card-settings-tab-button"]').click();
      cy.get(
        '[data-testid="profile-card-settings-tab-external-requestors"]',
      ).click();
      cy.url().should('include', '/dashboard/settings/externalRequestors');

      cy.get('[data-testid="profile-button"]').click();

      cy.get("[data-testid='create-external-requestor-button']").click();

      cy.get("[data-testid='external-requestor-modal-name']").click();
      cy.get("[data-testid='external-requestor-modal-name']").type('a');

      cy.get("[data-testid='external-requestor-modal-description']").click();
      cy.get("[data-testid='external-requestor-modal-description']").type('b');

      cy.get(
        "[data-testid='external-requestor-modal-autocomplete'] > div",
      ).click();
      cy.get("[data-testid='li-color-option-Aqua'] > div").click();
      cy.interceptPostExternalRequestors();
      cy.interceptGetExternalRequestors();
      cy.get("[data-testid='external-requestor-modal-save']").click();

      const externalRequestorDto = (await promisify(
        cy.wait('@postExternalRequestors').then(interceptor => {
          return interceptor.response.body;
        }),
      )) as ExternalRequestorDto;

      cy.wait('@getExternalRequestors');

      cy.get("[data-rowindex='0'] > div").eq(0).contains('a');
      cy.get("[data-rowindex='0'] > div").eq(1).contains('b');
      cy.get("[data-rowindex='0'] > div").eq(2).contains('Aqua');

      // edit what we just created
      cy.get(
        `[data-testid='external-requestor-settings-row-edit-${externalRequestorDto.id}']`,
      )
        .eq(0)
        .click();
      cy.get("[data-testid='external-requestor-modal-name']").click();
      cy.get("[data-testid='external-requestor-modal-name']").type('a');
      cy.get("[data-testid='external-requestor-modal-description']").click();
      cy.get("[data-testid='external-requestor-modal-description']").type('b');

      cy.get("[data-testid='external-modal-autocomplete'] > div").click();
      cy.contains('Red').click();

      cy.interceptGetExternalRequestors();

      cy.get("[data-testid='external-requestor-modal-save']").click();

      cy.wait('@postExternalRequestors');
      cy.wait('@getExternalRequestors');

      cy.get("[data-rowindex='0'] > div").eq(0).contains('aa');
      cy.get("[data-rowindex='0'] > div").eq(1).contains('bb');
      cy.get("[data-rowindex='0'] > div").eq(2).contains('Red');
    },
  );
  it('can create and edit releases', { scrollBehavior: false }, async () => {
    visitDashboard();
    cy.get('[data-testid="profile-button"]').click();
    cy.get('[data-testid="profile-card"]').should('exist');
    cy.get('[data-testid="profile-card-settings-tab-button"]').click();
    cy.get('[data-testid="profile-card-settings-tab-releases"]').click();
    cy.url().should('include', '/dashboard/settings/release');

    cy.get('[data-testid="profile-button"]').click();

    cy.get("[data-testid='create-release-button']").click();

    cy.get("[data-testid='release-modal-name']").click();
    cy.get("[data-testid='release-modal-name']").type('TestIteration');

    cy.get("[data-testid='release-modal-start-date']").click();
    cy.get("[data-testid='release-modal-start-date']").type('01/01/2024');

    cy.get("[data-testid='release-modal-end-date']").click();
    cy.get("[data-testid='release-modal-end-date']").type('31/01/2024');

    cy.get("[data-testid='release-modal-active']").click();

    cy.interceptPostIterations();
    cy.interceptGetIterations();
    cy.get("[data-testid='release-modal-save']").click();

    const iteration: IterationDto = {
      name: 'TestIteration',
      startDate: '01/01/2024',
      endDate: '31/01/2024',
      active: false,
      completed: false,
    };

    const release = (await promisify(
      cy.wait('@postIterations').then(interception => {
        return interception.response.body;
      }),
    )) as Iteration;

    cy.wait('@getIterations');

    cy.get(`[data-id='${release.id}'] > div`).eq(0).contains(iteration.name);
    cy.get(`[data-id='${release.id}'] > div`)
      .eq(1)
      .contains(iteration.startDate);
    cy.get(`[data-id='${release.id}'] > div`).eq(2).contains(iteration.endDate);
    cy.get(`[data-id='${release.id}'] > div`)
      .eq(3)
      .contains(iteration.active.toString());
    cy.get(`[data-id='${release.id}'] > div`)
      .eq(4)
      .contains(iteration.completed.toString());

    cy.get(`[data-testid='release-settings-row-edit-${release.id}']`)
      .eq(0)
      .click();

    const iterationUpdated: IterationDto = {
      name: 'TestIteration - updated',
      startDate: '01/01/2024',
      endDate: '31/01/2024',
      active: true,
      completed: true,
    };

    cy.get("[data-testid='release-modal-name']").click();
    cy.get("[data-testid='release-modal-name']").type(' - updated');
    cy.get("[data-testid='release-modal-active']").click();
    cy.get("[data-testid='release-modal-completed']").click();

    cy.get("[data-testid='release-modal-save']").click();
    cy.get(`[data-id='${release.id}'] > div`)
      .eq(0)
      .contains(iterationUpdated.name);
    cy.get(`[data-id='${release.id}'] > div`)
      .eq(1)
      .contains(iterationUpdated.startDate);
    cy.get(`[data-id='${release.id}'] > div`)
      .eq(2)
      .contains(iterationUpdated.endDate);
    cy.get(`[data-id='${release.id}'] > div`)
      .eq(3)
      .contains(iterationUpdated.active.toString());
    cy.get(`[data-id='${release.id}'] > div`)
      .eq(4)
      .contains(iterationUpdated.completed.toString());
    cy.wait('@getIterations');
  });
});
