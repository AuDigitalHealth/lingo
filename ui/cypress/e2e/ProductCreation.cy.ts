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

describe('Product creation Spec', () => {
  beforeEach(() => {
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
    // interceptAndFakeJiraUsers();
  });
  let taskKey: string = undefined; //'AUAMT-392';

  const timeOut = 130000;
  const testProductName = '700027211000036107';
  const testProduct2 = 'Picato';

  let ticketNumber: string = undefined; //'AMT-052335';
  let ticketId: number = undefined;

  // it('Clean up task', () => {
  //   deleteAllMyTasks(); //clean up
  // });

  it('Create parent branches', () => {
    createBranchIfNotExists({ parent: 'MAIN', name: 'SNOMEDCT-AU' });
    createBranchIfNotExists({ parent: 'MAIN/SNOMEDCT-AU', name: 'AUAMT' });
  });

  it('Set up Task', () => {
    setupTask(15000).then(key => {
      // Check if key is returned correctly
      expect(key).to.exist; // Ensure that key is not undefined
      taskKey = key;
      cy.wait('@postBranchCreation', { timeout: timeOut });
    });
  });
  it('Set up Ticket', async () => {
    const ticket = await promisify(createTicket('Test Product creation'));
    if (ticket.ticketNumber === undefined) {
      throw new Error('Invalid ticketNumber');
    }
    ticketNumber = ticket.ticketNumber;
    ticketId = ticket.id;

    // Associate ticket to task
    associateTicketToTask(ticketNumber);
  });

  it('Medication: Create a new brand(Tp) fails for duplicate', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;

    searchAndLoadProduct(testProductName, branch, timeOut);
    cy.get("[data-testid='create-new-brand']").click();
    cy.wait(500);

    cy.waitForConceptSearch(branch);
    cy.get("[data-testid='create-brand-input']").type('Amoxil', { delay: 500 });
    cy.wait('@getConceptSearch', { responseTimeout: timeOut });
    cy.get("[data-testid='create-brand-btn']").should('be.disabled');
    // verifyErrorMsg('create-brand-input', 'This name already exists!'); This fails occasionally
  });

  it('Medication: Create a new brand(Tp)', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;

    searchAndLoadProduct(testProductName, branch, timeOut);
    cy.get("[data-testid='create-new-brand']").click();
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
    cy.get(`[data-testid="package-brand"] input`).should(
      'have.value',
      testBrand,
    );
  });
  it('partial save product', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;

    searchAndLoadProduct(testProductName, branch, timeOut);
    const packSize = generateRandomFourDigit();
    changePackSize(packSize);

    cy.get("[data-testid='partial-save-btn']").click();
    // cy.interceptPutProduct(ticketId);
    cy.waitForTicketProductsLoad(ticketId);
    cy.waitForBulkTicketProductsLoad(ticketId);
    cy.get("[data-testid='partial-save-confirm-btn']").should('be.visible');
    cy.get("[data-testid='partial-save-confirm-btn']").click();
    cy.get(`[data-testid='link-Amoxil-${packSize}']`, {
      timeout: timeOut,
    }).should('be.visible');

    scrollTillElementIsVisible(`link-Amoxil-${packSize}`);

    cy.get(`[data-testid='link-Amoxil-${packSize}']`).should('be.visible');
    cy.get(`[data-testid='link-Amoxil-${packSize}']`).click(); //reload the product

    cy.get("[data-testid='preview-btn']").should('be.visible');
    verifyPackSizeChange(packSize);
    cy.get(`[data-testid='delete-Amoxil-${packSize}']`).click(); //delete the product
    cy.get(`[data-testid="confirmation-modal-action-button"]`).click();
  });

  it('Medication: Load and preview existing product', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;

    searchAndLoadProduct(testProductName, branch, timeOut);
    previewProduct(branch, timeOut);
    verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
  });
  //TODO fix this later
  // it('Medication: Load and preview product with multiple options', () => {
  //   loadTaskPage(taskKey, ticketNumber);
  //   cy.get("[data-testid='create-new-product']").click();
  //   const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
  //
  //   searchAndLoadProduct(
  //     'Povidone-iodine 10% (22.5 cm x 7.5 cm) dressing, 1 pad',
  //     branch,
  //     timeOut,
  //   );
  //   previewProduct(branch, timeOut);
  //   cy.get('[data-testid="product-group-MPUU"]').within(() => {
  //     cy.get('[data-testid="product-group-title-MPUU"]').should(
  //       'have.text',
  //       'Generic Product',
  //     );
  //
  //     multipleConceptCheckInPreview();
  //     cy.get('[data-testid="accodion-product"]').click();
  //     cy.get('[data-testid="existing-concepts-select"]').click();
  //     cy.get("[data-testid='existing-concept-option-0']").click();
  //
  //     cy.get("[data-testid='RefreshIcon']").click();
  //   });
  //
  //   verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
  // });
  it('Medication: Preview new product from scratch', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(
      branch,
      'package-brand',
      testProduct2,
      timeOut,
      false,
    );
    searchAndSelectAutocomplete(
      branch,
      'package-container',
      'Blister Pack',
      timeOut,
      true,
    );
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, timeOut);
    previewProduct(branch, timeOut);
  });

  it('Medication: Verify Fields on package level', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;

    addNewProduct();

    previewWithError('error', branch);
    verifyErrorMsg('package-brand-input', 'Brand name is mandatory');

    cy.get(`[data-testid="package-container"]`).click();
    cy.get(`[data-testid="package-container"]`).clear();
    previewWithError('error', branch);
    verifyErrorMsg('package-container', 'Container type is mandatory');
  });
  it('Medication: Validate Rule 1 One of Form, Container, or Device must be populated', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(branch, 'package-brand', testProduct2, timeOut);

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, timeOut);
    cy.get(`[data-testid="product-0-generic-dose-form-input"]`).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError(
      'error: Validate Rule 1: One of Form, Container, or Device must be populated',
      branch,
    );
  });
  it('Medication: Validate product brand name is required', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(branch, 'package-brand', testProduct2, timeOut);

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, timeOut);
    cy.get(`[data-testid="product-0-brand"]`).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('error:', branch);
    verifyErrorMsg('product-0-brand', 'Brand name is mandatory');
  });
  it('Medication: Validate product pack size', () => {
    loadTaskPage(taskKey, ticketNumber);

    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(branch, 'package-brand', testProduct2, timeOut);

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, timeOut);
    cy.get(`[data-testid="product-0-pack-size"]`).clear();
    cy.get(`[data-testid="product-0-pack-size-unit"]`).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('error:', branch);
    verifyErrorMsg('product-0-pack-size', 'Pack size is a required field');
  });
  it('Medication: Validate product pack size unit', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(branch, 'package-brand', testProduct2, timeOut);

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, timeOut);
    cy.get(`[data-testid="product-0-pack-size-unit"]`).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('error:', branch);
    verifyErrorMsg('product-0-pack-size-unit-input', 'Unit is required');
  });
  it('Medication: Validate product pack size when unit is each', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;

    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(branch, 'package-brand', testProduct2, timeOut);

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, timeOut);
    cy.get(`[data-testid="product-0-pack-size"]`).clear();
    cy.get(`[data-testid="product-0-pack-size"]`).type('0.5');
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('error:', branch);
    verifyErrorMsg(
      'product-0-pack-size',
      'Value must be a positive whole number.',
    );
  });
  it('Medication: Verify if form is populated device type must not be populated', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(branch, 'package-brand', testProduct2, timeOut);

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, timeOut);
    searchAndSelectAutocomplete(
      branch,
      'product-0-device-type',
      'strip',
      timeOut,
    );
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('error:', branch);
    verifyErrorMsg(
      'product-0-device-type-input',
      'If Form is populated, Device must not be populated',
    );
  });
  it('Medication: Fail if  The Unit Strength, Concentration Strength, and Unit Size values are not aligned', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(branch, 'package-brand', testProduct2, timeOut);

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, timeOut);
    cy.get(`[data-testid="product-0-unit-size"]`).type('50');
    searchAndSelectAutocomplete(
      branch,
      'product-0-unit-size-unit',
      'ml',
      timeOut,
    );

    cy.get(`[data-testid="product-0-ing-0-unit-strength"]`).type('500');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-unit-strength-unit',
      'mg',
      timeOut,
    );

    cy.get(`[data-testid="product-0-ing-0-concentration-strength"]`).type(
      '500',
    );
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-concentration-strength-unit',
      'mg/ml',
      timeOut,
    );

    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError(
      'error: Validate rule 7: The Unit Strength, Concentration Strength, and Unit Size values are not aligned.',
      branch,
    );
  });
  it('Medication: Success if  The Unit Strength, Concentration Strength, and Unit Size values are  aligned', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(branch, 'package-brand', testProduct2, timeOut);

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, timeOut);
    cy.get(`[data-testid="product-0-unit-size"]`).type('50');
    searchAndSelectAutocomplete(
      branch,
      'product-0-unit-size-unit',
      'ml',
      timeOut,
    );

    cy.get(`[data-testid="product-0-ing-0-unit-strength"]`).type('500');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-unit-strength-unit',
      'mg',
      timeOut,
    );

    cy.get(`[data-testid="product-0-ing-0-concentration-strength"]`).type('10');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-concentration-strength-unit',
      'mg/ml',
      timeOut,
    );

    previewProduct(branch, timeOut);
  });
  it('Medication: Success if the Unit Size Unit should match the Concentration Strength Unit denominator unit show warning', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(branch, 'package-brand', testProduct2, timeOut);

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, timeOut);
    cy.get(`[data-testid="product-0-unit-size"]`).type('50');
    searchAndSelectAutocomplete(
      branch,
      'product-0-unit-size-unit',
      'mg',
      timeOut,
    );

    cy.get(`[data-testid="product-0-ing-0-unit-strength"]`).type('500');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-unit-strength-unit',
      'mg',
      timeOut,
    );

    cy.get(`[data-testid="product-0-ing-0-concentration-strength"]`).type('10');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-concentration-strength-unit',
      'mg/ml',
      timeOut,
    );

    previewProduct(branch, timeOut, true);
  });

  it('Medication: Fail if the Unit Size, concentration, strength values are not aligned', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(branch, 'package-brand', testProduct2, timeOut);

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0, timeOut);
    cy.get(`[data-testid="product-0-unit-size"]`).type('12');
    searchAndSelectAutocomplete(
      branch,
      'product-0-unit-size-unit',
      'mL',
      timeOut,
    );

    cy.get(`[data-testid="product-0-ing-0-unit-strength"]`).type('250');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-unit-strength-unit',
      'mg',
      timeOut,
    );

    cy.get(`[data-testid="product-0-ing-0-concentration-strength"]`).type('15');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-concentration-strength-unit',
      'mg/ml',
      timeOut,
    );

    previewWithError('expected Concentration Strength is: 20.833333', branch);
  });

  it('Medication: validate a simple product from scratch', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    handleBrandHack(branch, 'package-brand', 'Amox', timeOut);
    searchAndSelectAutocomplete(branch, 'package-brand', testProduct2, timeOut);
    searchAndSelectAutocomplete(
      branch,
      'package-container',
      'Blister Pack',
      timeOut,
      true,
    );
    addNewProduct();
    expandOrHideProduct(0);
    searchAndSelectAutocomplete(
      branch,
      'product-0-generic-dose-form',
      'injection',
      timeOut,
    );
    searchAndSelectAutocomplete(
      branch,
      'product-0-specific-dose-form',
      'powder',
      timeOut,
    );
    searchAndSelectAutocomplete(
      branch,
      'product-0-container-type',
      'capsule',
      timeOut,
    );

    previewWithError('error', branch);

    cy.get(
      "[data-testid='product-0-ing-0-detailed-ingredient-panel'] div.MuiGrid-container",
    ).click();
    expandIngredient(0, 0);
    verifyErrorMsg(
      'product-0-ing-0-active-ing-input',
      'Active ingredient is mandatory',
    );
  });

  it('Medication: create a simple product by changing pack size', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    // handleBrandHack(branch,'package-brand',"Amox");
    searchAndLoadProduct(testProductName, branch, timeOut);
    const packSize = generateRandomFourDigit();
    changePackSize(packSize);
    previewProduct(branch, timeOut, undefined, undefined, true);
    verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1);
    createProduct(branch, timeOut, getGeneratedName(packSize), false, false);
    verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
  });

  it('Medication: create a multiPack product by changing pack size', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndLoadProduct('hp7', branch, timeOut);
    const packSize = generateRandomFourDigit();
    const timeoutMultiPack = timeOut * 2; //double the timeout for multipack
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
  it('Device: Create a device by changing pack size', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    selectDeviceType();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    // handleBrandHack(branch,'package-brand',"Amox");
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
  });
  it('Bulk pack: Create a bulk pack', () => {
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
  });

  it('Bulk pack: Invalid pack size(characters)', () => {
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
  });

  it('Bulk pack: Duplicate pack size', () => {
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

    //Adding duplicate pack
    const packSize = generateRandomFourDigit();
    setBulkPackSize(packSize.toString());
    cy.get("[data-testid='create-pack-btn']").click();

    setBulkPackSize(packSize.toString());
    verifyErrorMsg('pack-size-input', 'Not a valid pack size');
  });
  it('Bulk brand: create new Brand', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    selectBulkBrand();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndLoadProduct(testProductName, branch, timeOut, ActionType.newBrand);

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
  });
  it('Bulk brand: Duplicate brand', () => {
    loadTaskPage(taskKey, ticketNumber);
    cy.get("[data-testid='create-new-product']").click();
    selectBulkBrand();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndLoadProduct(testProductName, branch, timeOut, ActionType.newBrand);

    searchAndSelectAutocomplete(
      branch,
      'package-new-brand',
      'Amoxycillin (Sandoz)',
      timeOut,
      false,
    );
    verifyErrorMsg('package-new-brand', 'Brand name already exists');
  });
  it('delete task', () => {
    if (taskKey) {
      deleteTask(taskKey);
    }
  });
});
