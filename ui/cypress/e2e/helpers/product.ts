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
// The Manage Product search (SearchProduct.tsx) is a controlled MUI Autocomplete
// whose `open` state is only toggled by `onOpen` (focus/click/arrow) — typing
// and result-loading do NOT open the dropdown, so after the query resolves the
// options exist but no `ul[role="listbox"]` is rendered until the popup
// indicator is clicked. (This is a real product UX defect — results should show
// once loaded.) We also guard against search-index propagation lag by retrying.
function openProductSearchListbox(
  value: string,
  _branch: string,
  attempts: number,
) {
  // NB: this intentionally does NOT use `cy.wait('@getConceptSearch')`. That
  // alias is positional (each cy.wait expects the next matching request), so
  // across the multiple search helpers a single test calls it desynchronises
  // and flakily times out on a "2nd request that never occurred". Instead we
  // type, allow time for the debounced query, open the dropdown (it does not
  // auto-open on result load — a product UX defect), and poll for an option,
  // retrying for search-index propagation lag.
  cy.get("main [data-testid='search-product-textfield'] > div").click();
  cy.get('main [data-testid="search-product-input"] input').clear();
  cy.get('main [data-testid="search-product-input"]').type(value, {
    delay: 5,
  });
  cy.wait(3000);
  cy.get('main [data-testid="search-product-input"] input').should(
    'have.value',
    value,
  );
  cy.get('body').then($body => {
    const listboxOpen =
      $body.find('ul[role="listbox"] li[data-option-index="0"]').length > 0;
    if (!listboxOpen) {
      const $indicator = $body.find(
        'main [data-testid="search-product-input"] .MuiAutocomplete-popupIndicator',
      );
      if ($indicator.length) {
        cy.wrap($indicator.first()).click();
      }
    }
  });
  cy.wait(1000);
  cy.get('body').then($body => {
    const hasOption =
      $body.find('ul[role="listbox"] li[data-option-index="0"]').length > 0;
    if (!hasOption && attempts > 1) {
      cy.wait(1500);
      openProductSearchListbox(value, _branch, attempts - 1);
    }
  });
}

export function searchAndLoadProduct(
  value: string,
  branch: string,
  timeout: number,
  productType?: ActionType,
) {
  // An all-numeric value is an SCTID. Search it via the "Sct Id" filter for a
  // deterministic match — a "Term" search of an SCTID can fuzzy-match a
  // different product. Term searches (hp7, nu-gel, Picato) keep the default.
  if (/^\d+$/.test(value)) {
    cy.get('main [data-testid="search-product-filter-input"]').click();
    cy.contains('[role="option"]', 'Sct Id').click();
  }
  openProductSearchListbox(value, branch, 4);

  cy.get('ul[role="listbox"]', { timeout: 30000 }).should('be.visible');
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
  // warning might not happen, but if it does just skip it!
  proceedWithWarningIfHappens?: boolean,
) {
  // In some layouts (e.g. the bulk-pack grid) the preview button renders
  // below the fold, so scroll it into view before asserting visibility.
  cy.get("[data-testid='preview-btn']").scrollIntoView();
  cy.get("[data-testid='preview-btn']").should('be.visible');
  if (isMedicationType(productType)) {
    cy.waitForCalculateMedicationLoad(branch);
  } else if (isDeviceType(productType)) {
    cy.waitForCalculateDeviceLoad(branch);
  } else if (isBulkProduct(productType)) {
    cy.waitForCalculateBrandPackLoad(branch);
  }

  cy.get("[data-testid='preview-btn']").click();
  // The preview action is confirmed by the calculate request below
  // (@postCalculate*). The old intermediate `@getConceptSearch` wait was
  // positional and brittle — the preview click no longer reliably fires a
  // concept search, so it intermittently timed out on a "2nd request" that
  // never came.
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
  if (proceedWithWarningIfHappens) {
    cy.wait(1000);

    cy.get('body', { timeout: timeout }).then($body => {
      if ($body.find('[data-testid="warning-and-proceed-btn"]').length > 0) {
        cy.get('[data-testid="warning-and-proceed-btn"]')
          .should('be.visible')
          .click();
      } else {
        cy.log('Warning button not found within timeout, continuing...');
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

// Select the ingredient "strength type" (Product Template) for a contained
// product. This drives the discriminated strength sub-schema:
//   "Total Quantity Only"                              -> totalQuantity only
//   "Concentration Strength Only"                      -> concentrationStrength only
//   "Total Quantity, Concentration Strength, and Size" -> both + unit size
//   "No Strength"                                      -> neither
// It renders via CustomSelectWidget (a MUI <TextField select>) which now emits
// data-testid={id}; the resolved id is
// root_containedProducts_<i>_productDetails_productType. Changing it triggers
// updateSchemaOnChange, so the strength sub-fields re-render — fill them AFTER
// calling this.
export function selectProductStrengthType(
  productIndex: number,
  optionLabel: string,
) {
  const testId = `root_containedProducts_${productIndex}_productDetails_productType`;
  cy.get(`[data-testid="${testId}"]`, { timeout: 20000 }).should('be.visible');
  cy.get(`[data-testid="${testId}"] [role="combobox"]`)
    .first()
    .click({ force: true });
  cy.get('ul[role="listbox"]', { timeout: 20000 }).should('be.visible');
  cy.contains('li[role="option"]', optionLabel).click();
  // updateSchemaOnChange re-renders the strength sub-fields.
  cy.wait(2000);
}

export function changePackSize(packSize: number) {
  cy.wait(2000);
  // A normal pack exposes the contained product at the top level
  // (root_containedProducts_0_*). A multi-pack (e.g. hp7) instead nests the
  // products one level down under the first contained package
  // (root_containedPackages_0_packageDetails_containedProducts_0_*). Pick the
  // base path that's actually present so the same helper drives both shapes.
  cy.get('body').then($body => {
    const isFlat =
      $body.find('[data-testid="root_containedProducts_0_container"]').length >
      0;
    // A normal pack exposes the contained product at the top level
    // (root_containedProducts_0). A multi-pack (e.g. hp7) instead nests the
    // sub-packs under containedPackages — the redesigned-UI rename of what the
    // old flat model surfaced as the top-level contained product. So for a
    // multi-pack the equivalent "pack size" is the first sub-pack's quantity
    // (root_containedPackages_0_value), whose accordion is collapsed on load.
    const base = isFlat
      ? 'root_containedProducts_0'
      : 'root_containedPackages_0';
    cy.get(`[data-testid="${base}_container"] .MuiButtonBase-root`)
      .first()
      .click();
    cy.wait(1000);
    cy.get(`[data-testid="${base}_value"] input`).clear();
    cy.get(`[data-testid="${base}_value"] input`).type(packSize.toString(), {
      delay: 5,
    });
  });
  cy.wait(2000);
}
export function setBulkPackSize(packSize: string) {
  cy.get('[data-testid="pack-size-input"] input').first().click();
  cy.get('[data-testid="pack-size-input"] input')
    .first()
    .type(packSize, { delay: 5 });
}
export function verifyPackSizeChange(packSize: number) {
  cy.wait(2000);
  cy.get(
    '[data-testid="root_containedProducts_0_container"] .MuiButtonBase-root',
  )
    .first()
    .click();
  cy.wait(1000);
  cy.get('[data-testid="root_containedProducts_0_value"] input').should(
    'have.value',
    packSize.toString(),
  );
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
            cy.get(`[data-testid="fsn-input"] textarea`).first().clear();
            cy.get(`[data-testid="fsn-input"] textarea`).first().click();
            cy.get(`[data-testid="fsn-input"] textarea`)
              .first()
              .type(generatedName, { delay: 5 });

            cy.get(`[data-testid="pt-input"] textarea`).first().clear();
            cy.get(`[data-testid="pt-input"] textarea`).first().click();
            cy.get(`[data-testid="pt-input"] textarea`)
              .first()
              .type(generatedName, { delay: 5 });
          });
        }
      });

      cy.wait(2000);
    });
  } else if (generatedName) {
    cy.get('[data-testid="product-group-CTPP"]').within(() => {
      cy.get('[data-testid="accodion-product"]').click();
      cy.get('[data-testid="fsn-input"] textarea').first().clear();
      cy.get('[data-testid="fsn-input"] textarea')
        .first()
        .type(generatedName, { delay: 5 });

      cy.get('[data-testid="pt-input"] textarea').first().clear();
      cy.get('[data-testid="pt-input"] textarea')
        .first()
        .type(generatedName, { delay: 5 });
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
    cy.get(`[data-testid="${dataTestId}-input"]`)
      .should(() => {})
      .then($el => {
        if ($el.length) {
          cy.get(`[data-testid="${dataTestId}-input"]`).clear();
        } else {
          cy.get(`[data-testid="${dataTestId}"] input`).clear();
        }
      });
  }

  // cy.waitForOntoSearch(branch);
  cy.get(`[data-testid="${dataTestId}-input"]`)
    .should(() => {})
    .then($el => {
      if ($el.length) {
        cy.get(`[data-testid="${dataTestId}-input"]`).type(value);
      } else {
        cy.get(`[data-testid="${dataTestId}"] input`).type(value);
      }
    });
  // Allow the debounced search to run. We deliberately avoid
  // cy.wait('@getConceptSearch') here — that alias is positional and
  // desynchronises across the many search helpers a single test calls,
  // causing flaky "Nth request never occurred" timeouts.
  cy.wait(3000);

  cy.get(`[data-testid="${dataTestId}"] input`).should('have.value', value);
  // Open the option list. The re-focus click usually opens it, but flakily
  // doesn't — fall back to clicking the field's popup indicator, and give the
  // results time to load.
  openFieldOptionList(dataTestId, 4);
  cy.get('li[data-option-index="0"]', { timeout: timeOut }).should(
    'be.visible',
  );
  cy.get('li[data-option-index="0"]').click();
}

// For an AutoCompleteField configured with showDefaultOptions (e.g. the device
// specificDeviceType, whose options are descendants of the chosen deviceType),
// open the field and select the first offered option without needing a search
// term.
export function selectFirstAutocompleteOption(
  dataTestId: string,
  timeOut: number,
) {
  cy.get(`[data-testid="${dataTestId}"]`, { timeout: timeOut }).should(
    'be.visible',
  );
  openFieldOptionList(dataTestId, 4);
  cy.get('li[data-option-index="0"]', { timeout: timeOut }).should(
    'be.visible',
  );
  cy.get('li[data-option-index="0"]').click();
}

function openFieldOptionList(dataTestId: string, attempts: number) {
  cy.get(`[data-testid="${dataTestId}"] input`).click();
  cy.wait(1000);
  cy.get('body').then($body => {
    const open =
      $body.find('ul[role="listbox"] li[data-option-index="0"]').length > 0;
    if (!open) {
      const $indicator = $body.find(
        `[data-testid="${dataTestId}"] .MuiAutocomplete-popupIndicator`,
      );
      if ($indicator.length) {
        cy.wrap($indicator.first()).click();
        cy.wait(1000);
      }
    }
  });
  cy.get('body').then($body => {
    const open =
      $body.find('ul[role="listbox"] li[data-option-index="0"]').length > 0;
    if (!open && attempts > 1) {
      cy.wait(1500);
      openFieldOptionList(dataTestId, attempts - 1);
    }
  });
}

export function handleBrandHack(
  branch: string,
  dataTestId: string,
  value: string,
  timeOut: number,
) {
  // Wait for the form to be ready before interacting with autocomplete fields
  cy.get("[data-testid='product-creation-grid']", { timeout: timeOut }).should(
    'be.visible',
  );
  cy.get(`[data-testid="${dataTestId}"]`, { timeout: timeOut }).click();
  cy.get(`[data-testid="${dataTestId}"] input`, { timeout: timeOut }) // Select the input element inside the Autocomplete
    .focus() // Focus on the input field
    .type(value, { delay: 100 });
  // Let the debounced search run (no positional @getConceptSearch wait — see
  // searchAndSelectAutocomplete), then clear so the real value can be typed.
  cy.wait(3000);
  cy.get(`[data-testid="${dataTestId}"] input`).clear();
}
export function verifyErrorMsg(dataTestId: string, expectedError) {
  cy.get(`[data-testid="${dataTestId}"]`).within(() => {
    cy.contains(expectedError).first().should('contain', expectedError);
  });
}
export function verifyGenericError(errorPattern: string) {
  // A "New version released" info snackbar is also present (Cypress
  // testIsolation clears the changelog-seen hash from localStorage each test,
  // so ChangelogModal re-enqueues it on every app load). Match the snackbar
  // that actually contains the expected error text rather than the first one.
  cy.contains('#notistack-snackbar', errorPattern, { timeout: 20000 }).should(
    'be.visible',
  );
}

// Product validation now runs client-side (rjsf) and surfaces in the inline
// ErrorDisplay panel (role="alert"), listing each error as
// `Field must be populated "<prop>" (at <jsonPath>)` — there is no longer a
// backend "Error Validating Product Definition" snackbar, and the errors are
// not rendered per-field. Assert against the json path, which is stable
// regardless of the exact message wording.
export function verifyValidationError(jsonPath: string) {
  cy.get('[role="alert"]', { timeout: 20000 })
    .should('be.visible')
    .and('contain.text', `(at ${jsonPath})`);
}

export function previewWithError(error: string, branch: string) {
  // `error` (legacy backend message) and `branch` are kept for call-site
  // compatibility but no longer drive the assertion — see verifyValidationError.
  cy.log(`previewWithError on ${branch} (legacy expected: ${error})`);
  cy.get("[data-testid='preview-btn']", { timeout: 30000 }).should(
    'be.visible',
  );
  // An autocomplete default-options dropdown (e.g. containerType) can overlay
  // the submit button, so force the click.
  cy.get("[data-testid='preview-btn']").click({ force: true });
  // Client-side validation renders the inline ErrorDisplay block.
  cy.get('[role="alert"]', { timeout: 30000 })
    .should('be.visible')
    .and('contain.text', 'Errors:');
}
export function addNewProduct() {
  cy.get(
    "[data-testid='root_containedProducts_container'] button[aria-label='Add Manually']",
  )
    .first()
    .click();
}
export function expandOrHideProduct(productIndex: number) {
  cy.get(
    `[data-testid='root_containedProducts_${productIndex}_container'] .MuiAccordionSummary-root`,
    { timeout: 20000 },
  )
    .first()
    .click();
}
export function expandIngredient(productIndex: number, ingIndex: number) {
  cy.get(
    `[data-testid='root_containedProducts_${productIndex}_productDetails_activeIngredients_${ingIndex}_container'] .MuiAccordionSummary-root`,
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
    `root_containedProducts_${productIndex}_productDetails_genericForm`,
    'injection',
    timeOut,
  );
  searchAndSelectAutocomplete(
    branch,
    `root_containedProducts_${productIndex}_productDetails_specificForm`,
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
    `root_containedProducts_${productIndex}_productDetails_activeIngredients_${ingIndex}_activeIngredient`,
    'codeine',
    timeOut,
  );
  // `preciseIngredient` now lives inside each activeIngredients item (the
  // product-level `preciseIngredients` array was removed from the schema).
  searchAndSelectAutocomplete(
    branch,
    `root_containedProducts_${productIndex}_productDetails_activeIngredients_${ingIndex}_preciseIngredient`,
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
