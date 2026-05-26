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
import {
  addNewProduct,
  changePackSize,
  createProduct,
  expandIngredient,
  expandOrHideProduct,
  fillSuccessfulProductDetails,
  generateRandomFourDigit,
  getGeneratedName,
  handleBrandHack,
  multipleConceptCheckInPreview,
  previewProduct,
  previewWithError,
  scrollTillElementIsVisible,
  searchAndLoadProduct,
  searchAndSelectAutocomplete,
  selectDeviceType,
  selectBulkPack,
  verifyErrorMsg,
  verifyLoadedProduct,
  selectBulkBrand,
  verifyPackSizeChange,
  setBulkPackSize,
} from './helpers/product';
import {
  associateTicketToTask,
  createBranchIfNotExists,
  deleteAllMyTasks,
  deleteTask,
  loadTaskPage,
  setupTask,
} from './helpers/task';
import { ActionType } from '../../src/types/product';
import promisify from 'cypress-promise';
import { createTicket } from './helpers/backlog';

// ── Mock mode constants ───────────────────────────────────────────────────────
const MOCK_TASK_KEY = 'AUAMT-E2E-1';
const MOCK_TICKET_NUMBER = 'AMT-E2E-001';
const MOCK_TICKET_ID = 1001;
const MOCK_BRANCH = 'MAIN/SNOMEDCT-AU/AUAMT/AUAMT-E2E-1';

/**
 * Preview the product in mock mode without requiring a Snowstorm concept search.
 * After clicking preview, the $calculate endpoint returns the fixture which
 * renders the product model.
 */
function previewProductMocked(
  branch: string,
  timeOut = 30000,
  proceedWithWarning = false,
  productType?: ActionType,
) {
  cy.get("[data-testid='preview-btn']", { timeout: timeOut })
    .scrollIntoView()
    .should('be.visible')
    .should('not.be.disabled');

  if (
    productType === ActionType.newPackSize ||
    productType === ActionType.newBrand
  ) {
    cy.waitForCalculateBrandPackLoad(branch);
  } else if (productType === ActionType.newDevice) {
    cy.waitForCalculateDeviceLoad(branch);
  } else {
    cy.waitForCalculateMedicationLoad(branch);
  }

  cy.get("[data-testid='preview-btn']").click();

  if (proceedWithWarning) {
    cy.get('[data-testid="warning-and-proceed-btn"]', { timeout: timeOut })
      .should('be.visible')
      .click();
  }

  if (
    productType === ActionType.newPackSize ||
    productType === ActionType.newBrand
  ) {
    cy.wait('@postCalculateBrandPack', {
      responseTimeout: timeOut,
      requestTimeout: 30000,
    });
  } else if (productType === ActionType.newDevice) {
    cy.wait('@postCalculateDeviceLoad', {
      responseTimeout: timeOut,
      requestTimeout: 30000,
    });
  } else {
    cy.wait('@postCalculateMedicationLoad', {
      responseTimeout: timeOut,
      requestTimeout: 30000,
    });
  }

  scrollTillElementIsVisible('preview-cancel');
}

describe('Product creation Spec', () => {
  // ── Live mode state ─────────────────────────────────────────────────────────
  let taskKey: string = undefined;
  let ticketNumber: string = undefined;
  let ticketId: number = undefined;

  const timeOut = 130000;
  const mockTimeOut = 30000;
  const testProductName = '700027211000036107';
  const testProduct2 = 'Picato'; // live mode; mock uses 'Amoxil'
  const mockTestProduct2 = 'Amoxil'; // matches first result from concept-search.json

  beforeEach(() => {
    if (Cypress.env('MOCK_MODE')) {
      setupMockInterceptors();
      cy.intercept('POST', '/api/**/medications/product/$calculate', {
        statusCode: 200,
        fixture: 'api/calculate-response.json',
      }).as('postCalculateMedicationLoad');
      cy.intercept('POST', '/api/**/devices/product/$calculate', {
        statusCode: 200,
        fixture: 'api/calculate-response.json',
      }).as('postCalculateDeviceLoad');
      cy.intercept(
        'POST',
        '/api/**/medications/product/$calculateNewBrandPackSizes',
        {
          statusCode: 200,
          fixture: 'api/calculate-response.json',
        },
      ).as('postCalculateBrandPack');
    } else {
      cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
    }
  });

  // ── Navigation ───────────────────────────────────────────────────────────────

  it('can navigate to task page and see create-product button', function () {
    if (!Cypress.env('MOCK_MODE')) return this.skip();
    loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    cy.get("[data-testid='create-new-product']").should('be.visible');
  });

  // ── Live-only setup/teardown ─────────────────────────────────────────────────

  it('Create parent branches', function () {
    if (Cypress.env('MOCK_MODE')) return this.skip();
    createBranchIfNotExists({ parent: 'MAIN', name: 'SNOMEDCT-AU' });
    createBranchIfNotExists({ parent: 'MAIN/SNOMEDCT-AU', name: 'AUAMT' });
  });

  it('Set up Task', function () {
    if (Cypress.env('MOCK_MODE')) return this.skip();
    setupTask(15000).then(key => {
      expect(key).to.exist;
      taskKey = key;
      cy.wait('@postBranchCreation', { timeout: timeOut });
    });
  });

  it('Set up Ticket', async function () {
    if (Cypress.env('MOCK_MODE')) return this.skip();
    const ticket = await promisify(createTicket('Test Product creation'));
    if (ticket.ticketNumber === undefined) {
      throw new Error('Invalid ticketNumber');
    }
    ticketNumber = ticket.ticketNumber;
    ticketId = ticket.id;
    associateTicketToTask(ticketNumber);
  });

  // ── Brand creation ───────────────────────────────────────────────────────────

  it('Medication: Create a new brand(Tp) fails for duplicate', () => {
    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();
      searchAndLoadProduct(testProductName, MOCK_BRANCH, mockTimeOut);
      cy.get("[aria-label='Create Brand']").click();
      cy.wait(500);
      cy.waitForConceptSearch(MOCK_BRANCH);
      cy.get("[data-testid='create-primitive-input']").type('Amoxil', {
        delay: 500,
      });
      cy.wait('@getConceptSearch', { responseTimeout: mockTimeOut });
      cy.get("[data-testid='create-primitive-btn']").should('be.disabled');
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      searchAndLoadProduct(testProductName, branch, timeOut);
      cy.get("[aria-label='Create Brand']").click();
      cy.wait(500);
      cy.waitForConceptSearch(branch);
      cy.get("[data-testid='create-brand-input']").type('Amoxil', {
        delay: 500,
      });
      cy.wait('@getConceptSearch', { responseTimeout: timeOut });
      cy.get("[data-testid='create-brand-btn']").should('be.disabled');
    }
  });

  it('Medication: Create a new brand(Tp)', () => {
    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();
      searchAndLoadProduct(testProductName, MOCK_BRANCH, mockTimeOut);
      cy.get("[aria-label='Create Brand']").click();
      cy.wait(500);
      const testBrand = `A-${generateRandomFourDigit()}`;
      cy.waitForConceptSearch(MOCK_BRANCH);
      cy.get("[data-testid='create-primitive-input']").type(testBrand, {
        delay: 500,
      });
      cy.wait('@getConceptSearch', { responseTimeout: mockTimeOut });
      cy.waitForCreateTpBrand(MOCK_BRANCH);
      cy.get("[data-testid='create-primitive-btn']").click();
      cy.wait('@postTpBrand', { responseTimeout: mockTimeOut });
      cy.wait(1000);
      cy.get(`[data-testid="root_productName"] input`).should(
        'have.value',
        'MockBrand',
      );
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      searchAndLoadProduct(testProductName, branch, timeOut);
      cy.get("[aria-label='Create Brand']").click();
      cy.wait(500);
      const testBrand = `A-${generateRandomFourDigit()}`;
      cy.waitForConceptSearch(branch);
      cy.get("[data-testid='create-brand-input']").type(testBrand, {
        delay: 500,
      });
      cy.wait('@getConceptSearch', { responseTimeout: timeOut });
      cy.waitForCreateTpBrand(branch);
      cy.get("[data-testid='create-brand-btn']").click();
      cy.wait('@postTpBrand', { responseTimeout: timeOut });
      cy.wait(2000);
      cy.get(`[data-testid="root_productName"] input`).should(
        'have.value',
        testBrand,
      );
    }
  });

  // ── Pack size change ─────────────────────────────────────────────────────────

  it('partial save product', () => {
    if (Cypress.env('MOCK_MODE')) {
      let savedProductDto: any = null;

      cy.intercept('PUT', `/api/tickets/${MOCK_TICKET_ID}/products`, req => {
        savedProductDto = {
          ...req.body,
          id: 1,
          created: new Date().toISOString(),
        };
        req.reply({ statusCode: 200, body: {} });
      }).as('mockDraftProduct');

      cy.intercept('GET', `/api/tickets/${MOCK_TICKET_ID}/products`, req => {
        req.reply({
          statusCode: 200,
          body: savedProductDto ? [savedProductDto] : [],
        });
      });

      cy.intercept(
        'GET',
        `/api/tickets/${MOCK_TICKET_ID}/products/id/*`,
        req => {
          req.reply({ statusCode: 200, body: savedProductDto || {} });
        },
      );

      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();

      searchAndLoadProduct(testProductName, MOCK_BRANCH, mockTimeOut);
      const packSize = generateRandomFourDigit();
      changePackSize(packSize);

      cy.get("[data-testid='partial-save-btn']", { timeout: mockTimeOut })
        .should('not.be.disabled')
        .click();
      cy.waitForTicketProductsLoad(MOCK_TICKET_ID);
      cy.waitForBulkTicketProductsLoad(MOCK_TICKET_ID);
      cy.get("[data-testid='partial-save-confirm-btn']").should('be.visible');
      cy.get("[data-testid='partial-save-confirm-btn']").click();
      cy.wait('@mockDraftProduct', { timeout: mockTimeOut });
      cy.get(`[data-testid='link-Amoxil-${packSize}']`, {
        timeout: mockTimeOut,
      }).should('be.visible');

      scrollTillElementIsVisible(`link-Amoxil-${packSize}`);
      cy.get(`[data-testid='link-Amoxil-${packSize}']`).click();

      cy.get("[data-testid='preview-btn']").should('be.visible');
      verifyPackSizeChange(packSize);
      cy.get(`[data-testid='delete-Amoxil-${packSize}']`).click();
      cy.get(`[data-testid="confirmation-modal-action-button"]`).click();
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      searchAndLoadProduct(testProductName, branch, timeOut);
      const packSize = generateRandomFourDigit();
      changePackSize(packSize);

      cy.get("[data-testid='partial-save-btn']").click();
      cy.waitForTicketProductsLoad(ticketId);
      cy.waitForBulkTicketProductsLoad(ticketId);
      cy.get("[data-testid='partial-save-confirm-btn']").should('be.visible');
      cy.get("[data-testid='partial-save-confirm-btn']").click();
      cy.get(`[data-testid='link-Amoxil-${packSize}']`, {
        timeout: timeOut,
      }).should('be.visible');

      scrollTillElementIsVisible(`link-Amoxil-${packSize}`);
      cy.get(`[data-testid='link-Amoxil-${packSize}']`).click();

      cy.get("[data-testid='preview-btn']").should('be.visible');
      verifyPackSizeChange(packSize);
      cy.get(`[data-testid='delete-Amoxil-${packSize}']`).click();
      cy.get(`[data-testid="confirmation-modal-action-button"]`).click();
    }
  });

  // ── Product loading ───────────────────────────────────────────────────────────

  it('Medication: Load and preview existing product', () => {
    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();
      searchAndLoadProduct(testProductName, MOCK_BRANCH, mockTimeOut);
      previewProductMocked(MOCK_BRANCH, mockTimeOut);
      verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      searchAndLoadProduct(testProductName, branch, timeOut);
      previewProduct(branch, timeOut);
      verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
    }
  });

  // ── Preview from scratch ──────────────────────────────────────────────────────

  it('Medication: Preview new product from scratch', () => {
    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();
      handleBrandHack(MOCK_BRANCH, 'root_productName', 'Amox', mockTimeOut);
      searchAndSelectAutocomplete(
        MOCK_BRANCH,
        'root_productName',
        mockTestProduct2,
        mockTimeOut,
        false,
      );
      searchAndSelectAutocomplete(
        MOCK_BRANCH,
        'root_containerType',
        'Blister Pack',
        mockTimeOut,
        true,
      );
      addNewProduct();
      fillSuccessfulProductDetails(MOCK_BRANCH, 0, mockTimeOut);
      previewProductMocked(MOCK_BRANCH, mockTimeOut);
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      handleBrandHack(branch, 'root_productName', 'Amox', timeOut);
      searchAndSelectAutocomplete(
        branch,
        'root_productName',
        testProduct2,
        timeOut,
        false,
      );
      searchAndSelectAutocomplete(
        branch,
        'root_containerType',
        'Blister Pack',
        timeOut,
        true,
      );
      addNewProduct();
      fillSuccessfulProductDetails(branch, 0, timeOut);
      previewProduct(branch, timeOut);
    }
  });

  // ── Field validation ──────────────────────────────────────────────────────────

  it('Medication: Verify Fields on package level', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;

    if (Cypress.env('MOCK_MODE')) {
      cy.intercept('POST', '/api/**/medications/product/$calculate', {
        statusCode: 400,
        body: {
          status: 400,
          detail: 'Error Validating Product Definition',
          instance: '/api/medications/product/$calculate',
        },
      }).as('postCalculateMedicationError');

      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    cy.get("[data-testid='product-creation-grid']", { timeout: tOut }).should(
      'be.visible',
    );
    addNewProduct();

    previewWithError('Error Validating Product Definition', branch);
    if (!Cypress.env('MOCK_MODE')) {
      verifyErrorMsg(
        '[data-testid="root_productName"] input',
        'Brand Name must be populated.',
      );
    }

    cy.get(`[data-testid="root_containerType"] input`, {
      timeout: tOut,
    }).click();
    cy.get(`[data-testid="root_containerType"] input`).clear();
    previewWithError('Error Validating Product Definition', branch);
    if (!Cypress.env('MOCK_MODE')) {
      verifyErrorMsg('root_containerType', 'Container Type must be populated.');
    }
  });

  it('Medication: Validate Rule 1 One of Form, Container, or Device must be populated', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;
    const product2 = Cypress.env('MOCK_MODE') ? mockTestProduct2 : testProduct2;

    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    handleBrandHack(branch, 'root_productName', 'Amox', tOut);
    searchAndSelectAutocomplete(branch, 'root_productName', product2, tOut);
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, tOut);
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_genericForm"] input`,
    ).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError(
      'Error Validating Product Definition: ContainerType [ Container Type must be populated. ], ContainedProducts [ undefined ]',
      branch,
    );
  });

  it('Medication: Validate product brand name is required', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;
    const product2 = Cypress.env('MOCK_MODE') ? mockTestProduct2 : testProduct2;

    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    handleBrandHack(branch, 'root_productName', 'Amox', tOut);
    searchAndSelectAutocomplete(branch, 'root_productName', product2, tOut);
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, tOut);
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_productName"] input`,
    ).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('Error Validating Product Definition', branch);
    if (!Cypress.env('MOCK_MODE')) {
      verifyErrorMsg(
        'root_containedProducts_0_productDetails_productName',
        'Brand Name must be populated.',
      );
    }
  });

  it('Medication: Validate product pack size', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;
    const product2 = Cypress.env('MOCK_MODE') ? mockTestProduct2 : testProduct2;

    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    handleBrandHack(branch, 'root_productName', 'Amox', tOut);
    searchAndSelectAutocomplete(branch, 'root_productName', product2, tOut);
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, tOut);
    cy.get(`[data-testid="root_containedProducts_0_value"] input`).clear();
    cy.get(`[data-testid="root_containedProducts_0_unit"] input`).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('Error Validating Product Definition', branch);
    if (!Cypress.env('MOCK_MODE')) {
      verifyErrorMsg(
        'root_containedProducts_0_value',
        'Pack Size must be populated.',
      );
    }
  });

  it('Medication: Validate product pack size unit', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;
    const product2 = Cypress.env('MOCK_MODE') ? mockTestProduct2 : testProduct2;

    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    handleBrandHack(branch, 'root_productName', 'Amox', tOut);
    searchAndSelectAutocomplete(branch, 'root_productName', product2, tOut);
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, tOut);
    cy.get(`[data-testid="root_containedProducts_0_unit"] input`).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('Error Validating Product Definition', branch);
    if (!Cypress.env('MOCK_MODE')) {
      verifyErrorMsg('root_containedProducts_0_unit', 'Invalid Pack Size Unit');
    }
  });

  it('Medication: Validate product pack size when unit is each', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;
    const product2 = Cypress.env('MOCK_MODE') ? mockTestProduct2 : testProduct2;

    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    handleBrandHack(branch, 'root_productName', 'Amox', tOut);
    searchAndSelectAutocomplete(branch, 'root_productName', product2, tOut);
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, tOut);
    cy.get(`[data-testid="root_containedProducts_0_value"] input`).clear();
    cy.get(`[data-testid="root_containedProducts_0_value"] input`).type('-0.5');
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('Error Validating Product Definition', branch);
    if (!Cypress.env('MOCK_MODE')) {
      verifyErrorMsg(
        'root_containedProducts_0_value',
        'Value must be at least 0',
      );
    }
  });

  it('Medication: Verify if form is populated device type must not be populated', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;
    const product2 = Cypress.env('MOCK_MODE') ? mockTestProduct2 : testProduct2;
    const deviceSearch = Cypress.env('MOCK_MODE') ? 'strip' : 'strip';

    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    handleBrandHack(branch, 'root_productName', 'Amox', tOut);
    searchAndSelectAutocomplete(branch, 'root_productName', product2, tOut);
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, tOut);
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_deviceType',
      deviceSearch,
      tOut,
    );
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('Error', branch);
    if (!Cypress.env('MOCK_MODE')) {
      verifyErrorMsg(
        'root_containedProducts_0_productDetails_deviceType',
        'If Form is populated, Device must not be populated',
      );
    }
  });

  it('Medication: Fail if The Unit Strength, Concentration Strength, and Unit Size values are not aligned', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;
    const product2 = Cypress.env('MOCK_MODE') ? mockTestProduct2 : testProduct2;
    const mlSearch = Cypress.env('MOCK_MODE') ? 'mil' : 'ml';
    const mgSearch = Cypress.env('MOCK_MODE') ? 'mgs' : 'mg';

    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    handleBrandHack(branch, 'root_productName', 'Amox', tOut);
    searchAndSelectAutocomplete(branch, 'root_productName', product2, tOut);
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, tOut);
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_quantity"] input`,
    ).type('50');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_quantity_unit',
      mlSearch,
      tOut,
    );
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_activeIngredients_0_totalQuantity"] input`,
    ).type('500');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_activeIngredients_0_totalQuantity_unit',
      mgSearch,
      tOut,
    );
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_activeIngredients_0_concentrationStrength"] input`,
    ).type('500');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_activeIngredients_0_concentrationStrength_unit',
      'mg/ml',
      tOut,
    );
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError(
      'Validate rule 7: The Unit Strength, Concentration Strength, and Unit Size values are not aligned.',
      branch,
    );
  });

  it('Medication: Success if The Unit Strength, Concentration Strength, and Unit Size values are aligned', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;
    const product2 = Cypress.env('MOCK_MODE') ? mockTestProduct2 : testProduct2;
    const mlSearch = Cypress.env('MOCK_MODE') ? 'mil' : 'ml';
    const mgSearch = Cypress.env('MOCK_MODE') ? 'mgs' : 'mg';

    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    handleBrandHack(branch, 'root_productName', 'Amox', tOut);
    searchAndSelectAutocomplete(branch, 'root_productName', product2, tOut);
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, tOut);
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_quantity"] input`,
    ).type('50');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_quantity_unit',
      mlSearch,
      tOut,
    );
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_activeIngredients_0_totalQuantity"] input`,
    ).type('500');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_activeIngredients_0_totalQuantity_unit',
      mgSearch,
      tOut,
    );
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_activeIngredients_0_concentrationStrength"] input`,
    ).type('10');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_activeIngredients_0_concentrationStrength_unit',
      'mg/ml',
      tOut,
    );

    if (Cypress.env('MOCK_MODE')) {
      previewProductMocked(branch, tOut);
    } else {
      previewProduct(branch, tOut);
    }
  });

  it('Medication: Success if the Unit Size Unit should match the Concentration Strength Unit denominator unit show warning', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;
    const product2 = Cypress.env('MOCK_MODE') ? mockTestProduct2 : testProduct2;
    const mgSearch = Cypress.env('MOCK_MODE') ? 'mgs' : 'mg';

    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    handleBrandHack(branch, 'root_productName', 'Amox', tOut);
    searchAndSelectAutocomplete(branch, 'root_productName', product2, tOut);
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, tOut);
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_quantity"] input`,
    ).type('50');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_quantity_unit',
      mgSearch,
      tOut,
    );
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_activeIngredients_0_totalQuantity"] input`,
    ).type('500');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_activeIngredients_0_totalQuantity_unit',
      mgSearch,
      tOut,
    );
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_activeIngredients_0_concentrationStrength"] input`,
    ).type('10');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_activeIngredients_0_concentrationStrength_unit',
      'mg/ml',
      tOut,
    );

    if (Cypress.env('MOCK_MODE')) {
      previewProductMocked(branch, tOut, true);
    } else {
      previewProduct(branch, tOut, true);
    }
  });

  it('Medication: Fail if the Unit Size, concentration, strength values are not aligned', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;
    const product2 = Cypress.env('MOCK_MODE') ? mockTestProduct2 : testProduct2;
    const mLSearch = Cypress.env('MOCK_MODE') ? 'mLi' : 'mL';
    const mgSearch = Cypress.env('MOCK_MODE') ? 'mgs' : 'mg';

    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    handleBrandHack(branch, 'root_productName', 'Amox', tOut);
    searchAndSelectAutocomplete(branch, 'root_productName', product2, tOut);
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, tOut);
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_quantity"] input`,
    ).type('12');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_quantity_unit',
      mLSearch,
      tOut,
    );
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_activeIngredients_0_totalQuantity"] input`,
    ).type('250');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_activeIngredients_0_totalQuantity_unit',
      mgSearch,
      tOut,
    );
    cy.get(
      `[data-testid="root_containedProducts_0_productDetails_activeIngredients_0_concentrationStrength"] input`,
    ).type('15');
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_activeIngredients_0_concentrationStrength_unit',
      'mg/ml',
      tOut,
    );
    previewWithError('expected Concentration Strength is: 20.833333', branch);
  });

  it('Medication: validate a simple product from scratch', () => {
    const branch = Cypress.env('MOCK_MODE')
      ? MOCK_BRANCH
      : `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    const tOut = Cypress.env('MOCK_MODE') ? mockTimeOut : timeOut;
    const product2 = Cypress.env('MOCK_MODE') ? mockTestProduct2 : testProduct2;

    if (Cypress.env('MOCK_MODE')) {
      cy.intercept('POST', '/api/**/medications/product/$calculate', {
        statusCode: 400,
        body: {
          status: 400,
          detail: 'Error Validating Product Definition',
          instance: '/api/medications/product/$calculate',
        },
      }).as('postCalculateMedicationError');
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
    } else {
      loadTaskPage(taskKey, ticketNumber);
    }

    cy.get("[data-testid='create-new-product']").click();
    handleBrandHack(branch, 'root_productName', 'Amox', tOut);
    searchAndSelectAutocomplete(branch, 'root_productName', product2, tOut);
    searchAndSelectAutocomplete(
      branch,
      'root_containerType',
      'Blister Pack',
      tOut,
      true,
    );
    addNewProduct();
    expandOrHideProduct(0);
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_genericForm',
      'injection',
      tOut,
    );
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_specificForm',
      'powder',
      tOut,
    );
    searchAndSelectAutocomplete(
      branch,
      'root_containedProducts_0_productDetails_containerType',
      'capsule',
      tOut,
    );

    previewWithError('error', branch);

    if (!Cypress.env('MOCK_MODE')) {
      cy.get(
        "[data-testid='root_containedProducts_0_productDetails_activeIngredients_0_container'] div.MuiGrid-container",
      ).click();
    }
    expandIngredient(0, 0);
    if (!Cypress.env('MOCK_MODE')) {
      verifyErrorMsg(
        'root_containedProducts_0_productDetails_activeIngredients_0_activeIngredient',
        'Active Ingredient must be populated.',
      );
    }
  });

  // ── Product creation (pack size) ─────────────────────────────────────────────

  it('Medication: create a simple product by changing pack size', () => {
    if (Cypress.env('MOCK_MODE')) {
      let callCount = 0;
      cy.intercept('POST', '/api/**/medications/product/$calculate', req => {
        callCount++;
        req.reply({
          statusCode: 200,
          fixture:
            callCount === 1
              ? 'api/calculate-response-new.json'
              : 'api/calculate-response.json',
        });
      }).as('postCalculateMedicationLoad');

      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();
      searchAndLoadProduct(testProductName, MOCK_BRANCH, mockTimeOut);
      const packSize = generateRandomFourDigit();
      changePackSize(packSize);
      previewProductMocked(MOCK_BRANCH, mockTimeOut);
      verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1);
      createProduct(
        MOCK_BRANCH,
        mockTimeOut,
        getGeneratedName(packSize),
        false,
        false,
      );
      verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      searchAndLoadProduct(testProductName, branch, timeOut);
      const packSize = generateRandomFourDigit();
      changePackSize(packSize);
      previewProduct(branch, timeOut, undefined, undefined, true);
      verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1);
      createProduct(branch, timeOut, getGeneratedName(packSize), false, false);
      verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
    }
  });

  it('Medication: create a multiPack product by changing pack size', function () {
    if (Cypress.env('MOCK_MODE')) return this.skip();
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndLoadProduct('hp7', branch, timeOut);
    const packSize = generateRandomFourDigit();
    const timeoutMultiPack = timeOut * 2;
    changePackSize(packSize);
    previewProduct(branch, timeoutMultiPack, undefined, undefined, true);
    verifyLoadedProduct(3, 3, 4, 4, 3, 4, 4, 0, 0, 2, 0, 0, 2, 2);
    createProduct(
      branch,
      timeoutMultiPack,
      getGeneratedName(packSize),
      true,
      false,
    );
    verifyLoadedProduct(3, 3, 4, 4, 3, 4, 4, 0, 0, 0, 0, 0, 0, 0);
  });

  // ── Device creation ───────────────────────────────────────────────────────────

  it('Device: Create a device by changing pack size', () => {
    if (Cypress.env('MOCK_MODE')) {
      cy.intercept('POST', '/api/**/devices/product/$calculate', {
        statusCode: 200,
        fixture: 'api/calculate-response-new.json',
      }).as('postCalculateDeviceLoad');

      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();
      selectDeviceType();
      searchAndLoadProduct(
        'nu-gel',
        MOCK_BRANCH,
        mockTimeOut,
        ActionType.newDevice,
      );
      const packSize = generateRandomFourDigit();
      changePackSize(packSize);
      previewProductMocked(
        MOCK_BRANCH,
        mockTimeOut,
        false,
        ActionType.newDevice,
      );
      verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1);
      createProduct(
        MOCK_BRANCH,
        mockTimeOut,
        getGeneratedName(packSize),
        false,
        false,
        ActionType.newDevice,
      );
      verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      selectDeviceType();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      searchAndLoadProduct('nu-gel', branch, timeOut, ActionType.newDevice);
      const packSize = generateRandomFourDigit();
      changePackSize(packSize);
      previewProduct(branch, timeOut, false, ActionType.newDevice);
      verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1);
      createProduct(
        branch,
        timeOut,
        getGeneratedName(packSize),
        false,
        false,
        ActionType.newDevice,
      );
      verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
    }
  });

  // ── Bulk pack ─────────────────────────────────────────────────────────────────

  it('Bulk pack: Create a bulk pack', () => {
    if (Cypress.env('MOCK_MODE')) {
      cy.intercept(
        'POST',
        '/api/**/medications/product/$calculateNewBrandPackSizes',
        {
          statusCode: 200,
          fixture: 'api/calculate-response-new-pack.json',
        },
      ).as('postCalculateBrandPack');
      cy.intercept('POST', '/api/**/medications/product/new-brand-pack-sizes', {
        statusCode: 201,
        fixture: 'api/calculate-response-pack-done.json',
      });

      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();
      selectBulkPack();
      searchAndLoadProduct(
        testProductName,
        MOCK_BRANCH,
        mockTimeOut,
        ActionType.newPackSize,
      );
      const packSize = generateRandomFourDigit();
      cy.get("[data-testid='product-creation-grid']", {
        timeout: mockTimeOut,
      }).click();
      cy.get("[data-testid='pack-size-input'] input").click();
      cy.get("[data-testid='pack-size-input'] input").type(
        packSize.toString(),
        { delay: 5 },
      );
      cy.get("[data-testid='create-pack-btn']", {
        timeout: mockTimeOut,
      }).click();
      cy.wait(1000);
      previewProductMocked(
        MOCK_BRANCH,
        mockTimeOut,
        false,
        ActionType.newPackSize,
      );
      verifyLoadedProduct(1, 1, 2, 1, 1, 2, 2, 0, 0, 1, 0, 0, 1, 1);
      createProduct(
        MOCK_BRANCH,
        mockTimeOut,
        undefined,
        false,
        false,
        ActionType.newPackSize,
      );
      verifyLoadedProduct(1, 1, 2, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0);
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      selectBulkPack();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      searchAndLoadProduct(
        testProductName,
        branch,
        timeOut,
        ActionType.newPackSize,
      );
      const packSize = generateRandomFourDigit();
      cy.get("[data-testid='product-creation-grid']").click();
      cy.get("[data-testid='pack-size-input']").click();
      cy.get("[data-testid='pack-size-input']").type(packSize.toString(), {
        delay: 5,
      });
      cy.get("[data-testid='create-pack-btn']").click();
      cy.wait(1000);
      previewProduct(branch, timeOut, false, ActionType.newPackSize);
      verifyLoadedProduct(1, 1, 2, 1, 1, 2, 2, 0, 0, 1, 0, 0, 1, 1);
      createProduct(
        branch,
        timeOut,
        undefined,
        false,
        false,
        ActionType.newPackSize,
      );
      verifyLoadedProduct(1, 1, 2, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0);
    }
  });

  it('Bulk pack: Invalid pack size(characters)', () => {
    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();
      selectBulkPack();
      searchAndLoadProduct(
        testProductName,
        MOCK_BRANCH,
        mockTimeOut,
        ActionType.newPackSize,
      );
      cy.get("[data-testid='product-creation-grid']", {
        timeout: mockTimeOut,
      }).click();
      setBulkPackSize('xyz');
      verifyErrorMsg('pack-size-input', 'Not a valid pack size');
      cy.get("[data-testid='create-pack-btn']", {
        timeout: mockTimeOut,
      }).should('be.disabled');
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      selectBulkPack();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      searchAndLoadProduct(
        testProductName,
        branch,
        timeOut,
        ActionType.newPackSize,
      );
      cy.get("[data-testid='product-creation-grid']").click();
      setBulkPackSize('xyz');
      verifyErrorMsg('pack-size-input', 'Not a valid pack size');
      cy.get("[data-testid='create-pack-btn']").should('be.disabled');
    }
  });

  it('Bulk pack: Duplicate pack size', () => {
    if (Cypress.env('MOCK_MODE')) {
      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();
      selectBulkPack();
      searchAndLoadProduct(
        testProductName,
        MOCK_BRANCH,
        mockTimeOut,
        ActionType.newPackSize,
      );
      cy.get("[data-testid='product-creation-grid']", {
        timeout: mockTimeOut,
      }).click();
      const packSize = generateRandomFourDigit();
      setBulkPackSize(packSize.toString());
      cy.get("[data-testid='create-pack-btn']", {
        timeout: mockTimeOut,
      }).click();
      setBulkPackSize(packSize.toString());
      verifyErrorMsg('pack-size-input', 'Not a valid pack size');
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      selectBulkPack();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      searchAndLoadProduct(
        testProductName,
        branch,
        timeOut,
        ActionType.newPackSize,
      );
      cy.get("[data-testid='product-creation-grid']").click();
      const packSize = generateRandomFourDigit();
      setBulkPackSize(packSize.toString());
      cy.get("[data-testid='create-pack-btn']").click();
      setBulkPackSize(packSize.toString());
      verifyErrorMsg('pack-size-input', 'Not a valid pack size');
    }
  });

  // ── Bulk brand ────────────────────────────────────────────────────────────────

  it('Bulk brand: create new Brand', () => {
    if (Cypress.env('MOCK_MODE')) {
      cy.intercept(
        'POST',
        '/api/**/medications/product/$calculateNewBrandPackSizes',
        {
          statusCode: 200,
          fixture: 'api/calculate-response-new-brand.json',
        },
      ).as('postCalculateBrandPack');
      cy.intercept('POST', '/api/**/medications/product/new-brand-pack-sizes', {
        statusCode: 201,
        fixture: 'api/calculate-response-brand-done.json',
      });

      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();
      selectBulkBrand();
      searchAndLoadProduct(
        testProductName,
        MOCK_BRANCH,
        mockTimeOut,
        ActionType.newBrand,
      );
      searchAndSelectAutocomplete(
        MOCK_BRANCH,
        'package-new-brand',
        'Duodopa',
        mockTimeOut,
        false,
      );
      cy.get("[data-testid='create-new-brand-btn']").click();
      cy.wait(1000);
      previewProductMocked(
        MOCK_BRANCH,
        mockTimeOut,
        false,
        ActionType.newBrand,
      );
      verifyLoadedProduct(1, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0, 1, 1, 1);
      createProduct(
        MOCK_BRANCH,
        mockTimeOut,
        undefined,
        false,
        false,
        ActionType.newBrand,
      );
      verifyLoadedProduct(1, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0);
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      selectBulkBrand();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      searchAndLoadProduct(
        testProductName,
        branch,
        timeOut,
        ActionType.newBrand,
      );
      searchAndSelectAutocomplete(
        branch,
        'package-new-brand',
        'Duodopa',
        timeOut,
        false,
      );
      cy.get("[data-testid='create-new-brand-btn']").click();
      cy.wait(1000);
      previewProduct(branch, timeOut, false, ActionType.newBrand);
      verifyLoadedProduct(1, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0, 1, 1, 1);
      createProduct(
        branch,
        timeOut,
        undefined,
        false,
        false,
        ActionType.newBrand,
      );
      verifyLoadedProduct(1, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0);
    }
  });

  it('Bulk brand: Duplicate brand', () => {
    if (Cypress.env('MOCK_MODE')) {
      cy.intercept('GET', '/api/**/medications/**/brands', {
        statusCode: 200,
        body: {
          brands: [
            {
              brand: {
                conceptId: '700027211000036107',
                pt: { term: 'Amoxil 500 mg capsule, 20' },
              },
              nonDefiningProperties: [],
            },
          ],
        },
      }).as('getBulkBrandLoadWithExisting');

      loadTaskPage(MOCK_TASK_KEY, MOCK_TICKET_NUMBER);
      cy.get("[data-testid='create-new-product']").click();
      selectBulkBrand();
      searchAndLoadProduct(
        testProductName,
        MOCK_BRANCH,
        mockTimeOut,
        ActionType.newBrand,
      );
      searchAndSelectAutocomplete(
        MOCK_BRANCH,
        'package-new-brand',
        'Amoxycillin (Sandoz)',
        mockTimeOut,
        false,
      );
      verifyErrorMsg('package-new-brand', 'Brand name already exists');
    } else {
      loadTaskPage(taskKey, ticketNumber);
      cy.get("[data-testid='create-new-product']").click();
      selectBulkBrand();
      const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
      searchAndLoadProduct(
        testProductName,
        branch,
        timeOut,
        ActionType.newBrand,
      );
      searchAndSelectAutocomplete(
        branch,
        'package-new-brand',
        'Amoxycillin (Sandoz)',
        timeOut,
        false,
      );
      verifyErrorMsg('package-new-brand', 'Brand name already exists');
    }
  });

  // ── Live-only teardown ────────────────────────────────────────────────────────

  it('delete task', function () {
    if (Cypress.env('MOCK_MODE')) return this.skip();
    if (taskKey) {
      deleteTask(taskKey);
    }
  });
});
