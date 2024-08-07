import {
  changePackSize,
  createProduct,
  expandIngredient,
  generateRandomFourDigit,
  getGeneratedName,
  previewWithError,
  previewProduct,
  searchAndLoadProduct,
  searchAndSelectAutocomplete,
  verifyErrorMsg,
  verifyLoadedProduct,
  verifyPackSizeChange,
  addNewProduct,
  expandOrHideProduct,
  fillSuccessfulProductDetails,
  scrollTillElementIsVisible,
  multipleConceptCheckInPreview,
} from './helpers/product';
import {
  associateTicketToTask,
  deleteTask,
  loadTaskPage,
  setupTask,
} from './helpers/task';

describe('Search Spec', () => {
  beforeEach(() => {
    cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'));
  });
  let taskKey: string = 'AUAMT-135';
  let ticketId: number = 1446;
  const timeOut = 130000;

  it('Set up Task and ticket', () => {
    void setupTask().then(key => {
      taskKey = key;
    });
    void associateTicketToTask().then(association => {
      ticketId = association;
    });
  });

  it('partial save product', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndLoadProduct('amoxil', branch, timeOut);
    const packSize = generateRandomFourDigit();
    changePackSize(packSize);

    cy.get("[data-testid='partial-save-btn']").click();
    cy.interceptPutProduct(ticketId);
    cy.waitForTicketProductsLoad(ticketId);
    cy.get("[data-testid='partial-save-confirm-btn']").should('be.visible');
    cy.get("[data-testid='partial-save-confirm-btn']").click();
    cy.wait('@getTicketProducts');

    scrollTillElementIsVisible(`link-Amoxil-${packSize}`);
    cy.get(`[data-testid='link-Amoxil-${packSize}']`).should('be.visible');
    cy.get(`[data-testid='link-Amoxil-${packSize}']`).click(); //reload the product

    cy.get("[data-testid='preview-btn']").should('be.visible');
    verifyPackSizeChange(packSize);
    cy.get(`[data-testid='delete-Amoxil-${packSize}']`).click(); //delete the product
    cy.get(`[data-testid="confirmation-modal-action-button"]`).click();
  });

  it('Load and preview a simple product', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;

    searchAndLoadProduct('amox', branch, timeOut);
    previewProduct(branch, timeOut);
    verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
  });
  it('Load and preview product with multiple options', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;

    searchAndLoadProduct(
      'Povidone-iodine 10% (22.5 cm x 7.5 cm) dressing, 1 pad',
      branch,
      timeOut,
    );
    previewProduct(branch, timeOut);
    cy.get('[data-testid="product-group-MPUU"]').within(() => {
      cy.get('[data-testid="product-group-title-MPUU"]').should(
        'have.text',
        'Generic Product',
      );

      multipleConceptCheckInPreview();
      cy.get('[data-testid="accodion-product"]').click();
      cy.get('[data-testid="existing-concepts-select"]').click();
      cy.get("[data-testid='existing-concept-option-0']").click();

      cy.get("[data-testid='RefreshIcon']").click();
    });

    // verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
  });
  it('preview new product from scratch', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndSelectAutocomplete(branch, 'package-brand', 'amox');
    // searchAndSelectAutocomplete(
    //   branch,
    //   'package-container',
    //   'Blister Pack',
    //   true,
    // );
    addNewProduct();
    fillSuccessfulProductDetails(branch, 0);
    previewProduct(branch, timeOut);
  });

  it('verify Fields on package level', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;

    addNewProduct();

    previewWithError('error');
    verifyErrorMsg('package-brand-input', 'Brand name is mandatory');

    cy.get(`[data-testid="package-container"]`).clear();
    previewWithError('error');
    verifyErrorMsg('package-container', 'Container type is mandatory');
  });
  it('Validate Rule 1: One of Form, Container, or Device must be populated', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndSelectAutocomplete(branch, 'package-brand', 'amox');

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0);
    cy.get(`[data-testid="product-0-generic-dose-form-input"]`).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError(
      'error: Validate Rule 1: One of Form, Container, or Device must be populated',
    );
  });
  it('validate product brand name is required', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndSelectAutocomplete(branch, 'package-brand', 'amox');

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0);
    cy.get(`[data-testid="product-0-brand"]`).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('error:');
    verifyErrorMsg('product-0-brand', 'Brand name is mandatory');
  });
  it('validate product pack size', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndSelectAutocomplete(branch, 'package-brand', 'amox');

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0);
    cy.get(`[data-testid="product-0-pack-size"]`).clear();
    cy.get(`[data-testid="product-0-pack-size-unit"]`).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('error:');
    verifyErrorMsg('product-0-pack-size', 'Pack size is a required field');
  });
  it('validate product pack size unit', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndSelectAutocomplete(branch, 'package-brand', 'amox');

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0);
    cy.get(`[data-testid="product-0-pack-size-unit"]`).clear();
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('error:');
    verifyErrorMsg('product-0-pack-size-unit-input', 'Unit is required');
  });
  it('validate product pack size when unit is each', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndSelectAutocomplete(branch, 'package-brand', 'amox');

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0);
    cy.get(`[data-testid="product-0-pack-size"]`).clear();
    cy.get(`[data-testid="product-0-pack-size"]`).type('0.5');
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('error:');
    verifyErrorMsg(
      'product-0-pack-size',
      'Value must be a positive whole number.',
    );
  });
  it('Verify if form is populated device type must not be populated', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndSelectAutocomplete(branch, 'package-brand', 'amox');

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0);
    searchAndSelectAutocomplete(branch, 'product-0-device-type', 'strip');
    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError('error:');
    verifyErrorMsg(
      'product-0-device-type-input',
      'If Form is populated, Device must not be populated',
    );
  });
  it('Fail if  The Unit Strength, Concentration Strength, and Unit Size values are not aligned', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndSelectAutocomplete(branch, 'package-brand', 'amox');

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0);
    cy.get(`[data-testid="product-0-unit-size"]`).type('50');
    searchAndSelectAutocomplete(branch, 'product-0-unit-size-unit', 'ml');

    cy.get(`[data-testid="product-0-ing-0-unit-strength"]`).type('500');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-unit-strength-unit',
      'mg',
    );

    cy.get(`[data-testid="product-0-ing-0-concentration-strength"]`).type(
      '500',
    );
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-concentration-strength-unit',
      'mg/ml',
    );

    expandOrHideProduct(0);
    cy.wait(3000);
    previewWithError(
      'error: Validate rule 7: The Unit Strength, Concentration Strength, and Unit Size values are not aligned.',
    );
  });
  it('Success if  The Unit Strength, Concentration Strength, and Unit Size values are  aligned', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndSelectAutocomplete(branch, 'package-brand', 'amox');

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0);
    cy.get(`[data-testid="product-0-unit-size"]`).type('50');
    searchAndSelectAutocomplete(branch, 'product-0-unit-size-unit', 'ml');

    cy.get(`[data-testid="product-0-ing-0-unit-strength"]`).type('500');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-unit-strength-unit',
      'mg',
    );

    cy.get(`[data-testid="product-0-ing-0-concentration-strength"]`).type('10');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-concentration-strength-unit',
      'mg/ml',
    );

    previewProduct(branch, timeOut);
  });
  it('Success if the Unit Size Unit should match the Concentration Strength Unit denominator unit show warning', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndSelectAutocomplete(branch, 'package-brand', 'amox');

    addNewProduct();
    fillSuccessfulProductDetails(branch, 0);
    cy.get(`[data-testid="product-0-unit-size"]`).type('50');
    searchAndSelectAutocomplete(branch, 'product-0-unit-size-unit', 'mg');

    cy.get(`[data-testid="product-0-ing-0-unit-strength"]`).type('500');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-unit-strength-unit',
      'mg',
    );

    cy.get(`[data-testid="product-0-ing-0-concentration-strength"]`).type('10');
    searchAndSelectAutocomplete(
      branch,
      'product-0-ing-0-concentration-strength-unit',
      'mg/ml',
    );

    previewProduct(branch, timeOut, true);
  });

  it('validate a simple product from scratch', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;
    searchAndSelectAutocomplete(branch, 'package-brand', 'amox');
    searchAndSelectAutocomplete(
      branch,
      'package-container',
      'Blister Pack',
      true,
    );
    addNewProduct();
    expandOrHideProduct(0);
    searchAndSelectAutocomplete(
      branch,
      'product-0-generic-dose-form',
      'injection',
    );
    searchAndSelectAutocomplete(
      branch,
      'product-0-specific-dose-form',
      'powder',
    );
    searchAndSelectAutocomplete(branch, 'product-0-container-type', 'capsule');

    previewWithError('error');

    cy.get(
      "[data-testid='product-0-ing-0-detailed-ingredient-panel'] div.MuiGrid-container",
    ).click();
    expandIngredient(0, 0);
    verifyErrorMsg(
      'product-0-ing-0-active-ing-input',
      'Active ingredient is mandatory',
    );
  });

  it('create a simple product by changing pack size', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;

    searchAndLoadProduct('amox', branch, timeOut);
    const packSize = generateRandomFourDigit();
    changePackSize(packSize);
    previewProduct(branch, timeOut);
    verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1);
    createProduct(branch, timeOut, getGeneratedName(packSize), false);
    verifyLoadedProduct(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0);
  });

  it('create a multiPack product by changing pack size', () => {
    loadTaskPage(taskKey, ticketId);
    cy.get("[data-testid='create-new-product']").click();
    const branch = `${Cypress.env('apDefaultBranch')}/${taskKey}`;

    searchAndLoadProduct('hp7', branch, timeOut);
    const packSize = generateRandomFourDigit();
    changePackSize(packSize);
    previewProduct(branch, timeOut);
    verifyLoadedProduct(3, 3, 4, 4, 3, 4, 4, 0, 0, 2, 0, 0, 2, 2);
    createProduct(branch, timeOut, getGeneratedName(packSize), true);
    verifyLoadedProduct(3, 3, 4, 4, 3, 4, 4, 0, 0, 0, 0, 0, 0, 0);
  });
  it('delete task', () => {
    if (taskKey) {
      deleteTask(taskKey);
    }
  });
});
