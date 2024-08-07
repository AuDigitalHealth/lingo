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
    verifyNewConceptCreated(newMpCount);
  });
  cy.get('[data-testid="product-group-MPUU"]').within(() => {
    cy.get('[data-testid="product-group-title-MPUU"]').should(
      'have.text',
      'Generic Product',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', mpuuCount);
    verifyNewConceptCreated(newMpuuCount);
  });

  cy.get('[data-testid="product-group-MPP"]').within(() => {
    cy.get('[data-testid="product-group-title-MPP"]').should(
      'have.text',
      'Generic Pack',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', mppCount);
    verifyNewConceptCreated(newMppCount);
  });

  cy.get('[data-testid="product-group-TP"]').within(() => {
    cy.get('[data-testid="product-group-title-TP"]').should(
      'have.text',
      'Brand Name',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', tpCount);
    verifyNewConceptCreated(newTpCount);
  });
  cy.get('[data-testid="product-group-TPUU"]').within(() => {
    cy.get('[data-testid="product-group-title-TPUU"]').should(
      'have.text',
      'Branded Product',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', tpuuCount);
    verifyNewConceptCreated(newTpuuCount);
  });
  cy.get('[data-testid="product-group-TPP"]').within(() => {
    cy.get('[data-testid="product-group-title-TPP"]').should(
      'have.text',
      'Branded Pack',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', tppCount);
    verifyNewConceptCreated(newTppCount);
  });
  cy.get('[data-testid="product-group-CTPP"]').within(() => {
    cy.get('[data-testid="product-group-title-CTPP"]').should(
      'have.text',
      'Branded Container',
    );
    cy.get('[data-testid="accodion-product"]').should('have.length', ctppCount);
    verifyNewConceptCreated(newCtppCount);
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
) {
  cy.waitForConceptSearch(branch);
  cy.get("main [data-testid='search-product-textfield'] > div").click();
  cy.get('main [data-testid="search-product-input"]').type(value, {
    delay: 5,
  });
  cy.wait(2000);
  cy.wait('@getConceptSearch', { responseTimeout: 60000 });
  cy.get('main [data-testid="search-product-input"] input').should(
    'have.value',
    value,
  );

  cy.get('ul[role="listbox"]').should('be.visible');
  cy.waitForMedicationLoad(branch);
  cy.get('li[data-option-index="0"]').click();
  cy.wait('@getMedicationLoad', { responseTimeout: timeout }); //handling response timeout more than default 30s
  cy.url().should('include', 'product');
  // cy.get('#product-view').should('be.visible');
  cy.get("[data-testid='product-creation-grid']").should('be.visible');
}
export function previewProduct(
  branch: string,
  timeout?: number,
  proceedWithWarning?: boolean,
) {
  cy.get("[data-testid='preview-btn']").should('be.visible');
  cy.waitForCalculateMedicationLoad(branch);
  cy.get("[data-testid='preview-btn']").click();
  if (proceedWithWarning) {
    cy.wait(1000);
    cy.get('[data-testid="warning-and-proceed-btn"]').should('be.visible');
    cy.get('[data-testid="warning-and-proceed-btn"]').then($button => {
      if ($button.is(':visible')) {
        cy.get('[data-testid="warning-and-proceed-btn"]').click();
      }
    });
  }

  cy.wait('@postCalculateMedicationLoad', {
    responseTimeout: timeout,
    requestTimeout: 30000,
  });
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
export function verifyPackSizeChange(packSize: number) {
  cy.wait(2000);
  cy.get('#panel1a-header div.MuiGrid-container').click();
  cy.wait(1000);
  cy.get('#pack-size-input').should('have.value', packSize.toString());
}

export function createProduct(
  branch: string,
  timeout: number,
  generatedName: string,
  multiPack: boolean,
) {
  cy.waitForCreateMedication(branch);

  if (multiPack) {
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
  } else {
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
  cy.get('[data-testid="warning-and-proceed-btn"]').then($button => {
    if ($button.is(':visible')) {
      cy.get('[data-testid="warning-and-proceed-btn"]').click();
    }
  });
  cy.wait('@postMedication', {
    responseTimeout: timeout,
    requestTimeout: 30000,
  });
  cy.url().should('include', 'product/view');
}
export function searchAndSelectAutocomplete(
  branch: string,
  dataTestId,
  value: string,
  clearCurrentValue?: boolean,
) {
  cy.waitForConceptSearch(branch);

  if (clearCurrentValue) {
    cy.get(`[data-testid="${dataTestId}-input"]`).clear();
  }

  cy.get(`[data-testid="${dataTestId}"]`).type(value);
  cy.wait('@getConceptSearch', { responseTimeout: 60000 });
  cy.get(`[data-testid="${dataTestId}"] input`).should('have.value', value);
  cy.get('ul[role="listbox"]', { timeout: 60000 }).should('be.visible');

  cy.get('li[data-option-index="0"]').click();
}
export function verifyErrorMsg(dataTestId: string, expectedError) {
  cy.get(`[data-testid="${dataTestId}"]`).within(() => {
    cy.get('.MuiFormHelperText-root').should('contain', expectedError);
  });
}
export function verifyGenericError(errorPattern: string) {
  cy.get('#notistack-snackbar').should('be.visible');
  cy.get('#notistack-snackbar').should('include.text', errorPattern);
}
export function previewWithError(error: string) {
  cy.get("[data-testid='preview-btn']").should('be.visible');
  cy.get("[data-testid='preview-btn']").click();
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
) {
  expandOrHideProduct(productIndex);
  searchAndSelectAutocomplete(
    branch,
    `product-${productIndex}-generic-dose-form`,
    'injection',
  );
  searchAndSelectAutocomplete(
    branch,
    `product-${productIndex}-specific-dose-form`,
    'powder',
  );
  // searchAndSelectAutocomplete(branch,`product-${productIndex}-container-type`,"capsule");

  expandIngredient(productIndex, 0);
  fillSuccessfulIngredientIndex(branch, productIndex, 0);
}
export function fillSuccessfulIngredientIndex(
  branch: string,
  productIndex: number,
  ingIndex: number,
) {
  searchAndSelectAutocomplete(
    branch,
    `product-${productIndex}-ing-${ingIndex}-active-ing`,
    'codeine',
  );
  searchAndSelectAutocomplete(
    branch,
    `product-${productIndex}-ing-${ingIndex}-precise-ing`,
    'codeine',
  );
}
export function scrollTillElementIsVisible(dataTestId: string) {
  cy.get(`[data-testid='${dataTestId}']`)
    .scrollIntoView({ easing: 'linear' })
    .should('be.visible');
}

export function clearForm() {
  scrollTillElementIsVisible('product-clear-btn');
  cy.get(`[data-testid="product-clear-btn"]`).click();
  cy.get(`[data-testid="confirmation-modal-action-button"]`).click();
}
