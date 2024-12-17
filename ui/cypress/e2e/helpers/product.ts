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

import { ActionType } from '../../../src/types/product';

export function verifyLoadedProduct(
  mpCount: number,
  mpuuCount: number,
  mppCount: number,
  tpCount: number,
  tpuuCount: number,
  tppCount: number,
  ctppCount: number,
  newMpCount: number,
  newMpuuCount: number,
  newMppCount: number,
  newTpCount: number,
  newTpuuCount: number,
  newTppCount: number,
  newCtppCount: number,
) {
  cy.get('[data-testid="product-group-MP"]').within(() => {
    cy.get('[data-testid="product-group-title-MP"]').should(
      'have.text',
      'Product',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', mpCount);
    if (newMpCount > 0) verifyNewConceptCreated(newMpCount);
  });
  cy.get('[data-testid="product-group-MPUU"]').within(() => {
    cy.get('[data-testid="product-group-title-MPUU"]').should(
      'have.text',
      'Generic Product',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', mpuuCount);
    if (newMpuuCount > 0) verifyNewConceptCreated(newMpuuCount);
  });

  cy.get('[data-testid="product-group-MPP"]').within(() => {
    cy.get('[data-testid="product-group-title-MPP"]').should(
      'have.text',
      'Generic Pack',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', mppCount);
    if (newMppCount > 0) verifyNewConceptCreated(newMppCount);
  });

  cy.get('[data-testid="product-group-TP"]').within(() => {
    cy.get('[data-testid="product-group-title-TP"]').should(
      'have.text',
      'Brand Name',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', tpCount);
    if (newTpCount > 0) verifyNewConceptCreated(newTpCount);
  });
  cy.get('[data-testid="product-group-TPUU"]').within(() => {
    cy.get('[data-testid="product-group-title-TPUU"]').should(
      'have.text',
      'Branded Product',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', tpuuCount);
    if (newTpuuCount > 0) verifyNewConceptCreated(newTpuuCount);
  });
  cy.get('[data-testid="product-group-TPP"]').within(() => {
    cy.get('[data-testid="product-group-title-TPP"]').should(
      'have.text',
      'Branded Pack',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', tppCount);
    if (newTppCount > 0) verifyNewConceptCreated(newTppCount);
  });
  cy.get('[data-testid="product-group-CTPP"]').within(() => {
    cy.get('[data-testid="product-group-title-CTPP"]').should(
      'have.text',
      'Branded Container',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', ctppCount);
    if (newCtppCount > 0) verifyNewConceptCreated(newCtppCount);
  });
}
export function verifyNewConceptCreated(numberOfNewConcept) {
  cy.get('[data-testid="accodion-product-summary"]')
    .filter((index, element) => {
      const backgroundColor = Cypress.$(element).css('background-color');
      return (
        backgroundColor === '#00A854' || backgroundColor === 'rgb(0, 168, 84)'
      ); // Example background color
    })
    .should('have.length', numberOfNewConcept);
}

export function multipleConceptCheckInPreview() {
  cy.get('[data-testid="accodion-product-summary"]').filter(
    (index, element) => {
      const backgroundColor = Cypress.$(element).css('background-color');
      return (
        backgroundColor === '#F04134' || backgroundColor === 'rgb(240, 65, 52)'
      ); // Example background color
    },
  );
}
export function generateRandomFourDigit() {
  return Math.floor(1000 + Math.random() * 9000);
}
export function getGeneratedName(packSize?: number) {
  if (!packSize) {
    packSize = Math.floor(1000 + Math.random() * 9000);
  }
  return `Snomio test-${packSize}`;
}
export function searchAndLoadProduct(
  value: string,
  branch: string,
  timeout: number,
  productType?: ActionType,
) {
  cy.waitForConceptSearch(branch);
  cy.get("main [data-testid='search-product-textfield'] > div").click();
  cy.get('main [data-testid="search-product-input"]').type(value, {
    delay: 5,
  });
  cy.wait(2000);
  cy.wait('@getConceptSearch');
  cy.get('main [data-testid="search-product-input"] input').should(
    'have.value',
    value,
  );

  cy.get('ul[role="listbox"]').should('be.visible');
  if (isMedicationType(productType)) {
    cy.waitForMedicationLoad(branch);
  } else if (isDeviceType(productType)) {
    cy.waitForDeviceLoad(branch);
  } else if (isBulkPack(productType)) {
    cy.waitForBulkPackLoad(branch);
  } else if (isBulkBrand(productType)) {
    cy.waitForBulkBrandLoad(branch);
  }

  cy.get('li[data-option-index="0"]').click();

  if (isMedicationType(productType)) {
    cy.wait('@getMedicationLoad', { responseTimeout: timeout }); //handling response timeout more than default 30s
  } else if (isDeviceType(productType)) {
    cy.wait('@getDeviceLoad', { responseTimeout: timeout }); //handling response timeout more than default 30s
  } else if (isBulkPack(productType)) {
    cy.wait('@getBulkPackLoad', { responseTimeout: timeout }); //handling response timeout more than default 30s
  } else if (isBulkBrand(productType)) {
    cy.wait('@getBulkBrandLoad', { responseTimeout: timeout }); //handling response timeout more than default 30s
  }

  cy.url().should('include', 'product');
  // cy.get('#product-view').should('be.visible');
  cy.get("[data-testid='product-creation-grid']").should('be.visible');
}
export function previewProduct(
  branch: string,
  timeout?: number,
  proceedWithWarning?: boolean,
  productType?: ActionType,
) {
  cy.get("[data-testid='preview-btn']").should('be.visible');
  if (isMedicationType(productType)) {
    cy.waitForCalculateMedicationLoad(branch);
    cy.waitForConceptSearch(branch);
  } else if (isDeviceType(productType)) {
    cy.waitForCalculateDeviceLoad(branch);
  } else if (isBulkProduct(productType)) {
    cy.waitForCalculateBrandPackLoad(branch);
  }

  cy.get("[data-testid='preview-btn']").click();
  if (isMedicationType(productType)) {
    cy.wait('@getConceptSearch', {
      responseTimeout: timeout,
      requestTimeout: 30000,
    });
  }
  if (proceedWithWarning) {
    cy.wait(1000);
    cy.get('[data-testid="warning-and-proceed-btn"]', {
      timeout: timeout,
    }).should('be.visible');
    cy.get('[data-testid="warning-and-proceed-btn"]').then($button => {
      if ($button.is(':visible')) {
        cy.get('[data-testid="warning-and-proceed-btn"]').click();
      }
    });
  }
  if (isMedicationType(productType)) {
    cy.wait('@postCalculateMedicationLoad', {
      responseTimeout: timeout,
      requestTimeout: 30000,
    });
  } else if (isDeviceType(productType)) {
    cy.wait('@postCalculateDeviceLoad', {
      responseTimeout: timeout,
      requestTimeout: 30000,
    });
  } else if (isBulkProduct(productType)) {
    cy.wait('@postCalculateBrandPack', {
      responseTimeout: timeout,
      requestTimeout: 30000,
    });
  }

  scrollTillElementIsVisible('preview-cancel');
}

export function changePackSize(packSize: number) {
  cy.wait(2000);
  cy.get('#panel1a-header div.MuiGrid-container').click();
  cy.wait(1000);
  cy.get('#pack-size-input').clear();
  cy.get('#pack-size-input').type(packSize.toString(), { delay: 5 });
  cy.wait(2000);
}
export function setBulkPackSize(packSize: string) {
  cy.get("[data-testid='pack-size-input']").click();
  cy.get("[data-testid='pack-size-input']").type(packSize, { delay: 5 });
}
export function verifyPackSizeChange(packSize: number) {
  cy.wait(2000);
  cy.get('#panel1a-header div.MuiGrid-container').click();
  cy.wait(1000);
  cy.get('#pack-size-input').should('have.value', packSize.toString());
}

export function createProduct(
  branch: string,
  timeout: number,
  generatedName: string | undefined,
  multiPack: boolean,
  warning: boolean,
  productType?: ActionType,
) {
  cy.waitForConceptSearch(branch);
  if (isMedicationType(productType)) {
    cy.waitForCreateMedication(branch);
  } else if (isDeviceType(productType)) {
    cy.waitForCreateDevice(branch);
  } else if (isBulkProduct(productType)) {
    cy.waitForCreateBulkBrandPack(branch);
  }

  if (multiPack && generatedName) {
    cy.get('[data-testid="product-group-CTPP"]').within(() => {
      cy.get('[data-testid="accodion-product"]').each((element, index) => {
        if (element.text().startsWith('Generated name unavailable')) {
          cy.wrap(element).click();
          cy.wrap(element).within(() => {
            cy.get(`[data-testid="fsn-input"]`).clear();
            cy.get(`[data-testid="fsn-input"]`).click();

            cy.get(`[data-testid="fsn-input"]`).type(generatedName, {
              delay: 5,
            });

            cy.get(`[data-testid="pt-input"]`).clear();
            cy.get(`[data-testid="pt-input"]`).click();

            cy.get(`[data-testid="pt-input"]`).type(generatedName, {
              delay: 5,
            });
          });
        }
      });

      cy.wait(2000);
    });
  } else if (generatedName) {
    cy.get('[data-testid="product-group-CTPP"]').within(() => {
      cy.get('[data-testid="accodion-product"]').click();
      cy.get('[data-testid="fsn-input"]').clear();
      cy.get('[data-testid="fsn-input"]').type(generatedName, { delay: 5 });

      cy.get('[data-testid="pt-input"]').clear();
      cy.get('[data-testid="pt-input"]').type(generatedName, { delay: 5 });
      cy.wait(2000);
    });
  }

  cy.get("[data-testid='create-product-btn']").click();
  if (warning) {
    cy.get('[data-testid="warning-and-proceed-btn"]', {
      timeout: timeout,
    }).then($button => {
      if ($button.is(':visible')) {
        cy.get('[data-testid="warning-and-proceed-btn"]').click();
      }
    });
  }
  if (isMedicationType(productType)) {
    cy.wait('@postMedication', {
      responseTimeout: timeout,
      requestTimeout: 30000,
    });
  } else if (isDeviceType(productType)) {
    cy.wait('@postDevice', {
      responseTimeout: timeout,
      requestTimeout: 30000,
    });
  } else if (isBulkProduct(productType)) {
    cy.wait('@postBulkBrandPack', {
      responseTimeout: timeout,
      requestTimeout: 30000,
    });
  }

  cy.url().should('include', 'product/view');
}
export function searchAndSelectAutocomplete(
  branch: string,
  dataTestId,
  value: string,
  timeOut: number,
  clearCurrentValue?: boolean,
) {
  cy.waitForConceptSearch(branch);
  cy.get(`[data-testid="${dataTestId}"]`).click();

  if (clearCurrentValue) {
    cy.get(`[data-testid="${dataTestId}-input"]`).clear();
  }

  // cy.waitForOntoSearch(branch);
  cy.get(`[data-testid="${dataTestId}-input"]`).type(value);
  cy.wait('@getConceptSearch', { responseTimeout: timeOut });
  // cy.wait(1000); // Adjust the wait time as needed

  cy.get(`[data-testid="${dataTestId}"] input`).should('have.value', value);
  cy.get('ul[role="listbox"]', { timeout: timeOut }).should('be.visible');

  cy.get('li[data-option-index="0"]').click();
}

export function handleBrandHack(
  branch: string,
  dataTestId: string,
  value: string,
  timeOut: number,
) {
  cy.waitForConceptSearch(branch);
  cy.get(`[data-testid="${dataTestId}"]`).click();
  cy.get(`[data-testid="${dataTestId}"] input`) // Select the input element inside the Autocomplete
    .focus() // Focus on the input field
    .type(value, { delay: 100 });
  cy.wait('@getConceptSearch', { responseTimeout: timeOut });
  cy.get(`[data-testid="${dataTestId}"] input`).clear();
}
export function verifyErrorMsg(dataTestId: string, expectedError) {
  cy.get(`[data-testid="${dataTestId}"]`).within(() => {
    cy.get('.MuiFormHelperText-root').should('contain', expectedError);
  });
}
export function verifyGenericError(errorPattern: string) {
  cy.get('#notistack-snackbar', { timeout: 20000 }).should('be.visible');
  cy.get('#notistack-snackbar').should('include.text', errorPattern);
}
export function previewWithError(error: string, branch: string) {
  cy.waitForConceptSearch(branch);
  cy.get("[data-testid='preview-btn']").should('be.visible');
  cy.get("[data-testid='preview-btn']").click();
  cy.wait('@getConceptSearch', { responseTimeout: 600000 });
  verifyGenericError(error);
}
export function addNewProduct() {
  cy.get("[data-testid='add-new-product']").click();
}
export function expandOrHideProduct(productIndex: number) {
  cy.get(
    `[data-testid='product-${productIndex}-detailed-product-panel'] div.MuiGrid-container`,
  ).click();
}
export function expandIngredient(productIndex: number, ingIndex: number) {
  cy.get(
    `[data-testid='product-${productIndex}-ing-${ingIndex}-detailed-ingredient-panel'] div.MuiGrid-container`,
  ).click();
}
export function fillSuccessfulProductDetails(
  branch: string,
  productIndex: number,
  timeOut: number,
) {
  expandOrHideProduct(productIndex);
  searchAndSelectAutocomplete(
    branch,
    `product-${productIndex}-generic-dose-form`,
    'injection',
    timeOut,
  );
  searchAndSelectAutocomplete(
    branch,
    `product-${productIndex}-specific-dose-form`,
    'powder',
    timeOut,
  );
  // searchAndSelectAutocomplete(branch,`product-${productIndex}-container-type`,"capsule");

  expandIngredient(productIndex, 0);
  fillSuccessfulIngredientIndex(branch, productIndex, 0, timeOut);
}
export function fillSuccessfulIngredientIndex(
  branch: string,
  productIndex: number,
  ingIndex: number,
  timeOut: number,
) {
  searchAndSelectAutocomplete(
    branch,
    `product-${productIndex}-ing-${ingIndex}-active-ing`,
    'codeine',
    timeOut,
  );
  searchAndSelectAutocomplete(
    branch,
    `product-${productIndex}-ing-${ingIndex}-precise-ing`,
    'codeine',
    timeOut,
  );
}
export function scrollTillElementIsVisible(dataTestId: string) {
  cy.get(`[data-testid='${dataTestId}']`, { timeout: 10000 })
    .scrollIntoView({ easing: 'linear' })
    .should('be.visible'); // Ensure that the element is visible
}

export function clearForm() {
  scrollTillElementIsVisible('product-clear-btn');
  cy.get(`[data-testid="product-clear-btn"]`).click();
  cy.get(`[data-testid="confirmation-modal-action-button"]`).click();
}

export function isNameContainsKeywords(name: string, keywords: string[]) {
  return keywords.some(substring =>
    name.toLowerCase().includes(substring.toLowerCase()),
  );
}
export function selectDeviceType() {
  cy.get("[data-testid='device-toggle']").click();
}
export function selectBulkPack() {
  cy.get("[data-testid='bulk-pack-toggle']").click();
}
export function selectBulkBrand() {
  cy.get("[data-testid='bulk-brand-toggle']").click();
}
export function isMedicationType(productType: ActionType) {
  return !productType || productType === ActionType.newMedication;
}
export function isDeviceType(productType: ActionType) {
  return productType === ActionType.newDevice;
}

export function isBulkPack(productType: ActionType) {
  return productType === ActionType.newPackSize;
}
export function isBulkBrand(productType: ActionType) {
  return productType === ActionType.newBrand;
}

export function isBulkProduct(productType: ActionType) {
  return isBulkPack(productType) || isBulkBrand(productType);
}
