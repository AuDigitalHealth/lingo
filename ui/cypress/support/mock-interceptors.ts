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

/**
 * Mock interceptors for all API endpoints.
 *
 * These intercepts are activated when CYPRESS_MOCK_MODE=true (the default).
 * They return fixture data so tests can run without a deployed environment.
 *
 * To add a new mock:
 *  1. Add a fixture file under cypress/fixtures/api/
 *  2. Add a cy.intercept() call in the appropriate section below
 */

export function setupMockInterceptors() {
  // ── Safety-net catch-alls (lowest priority — registered first so LIFO puts them last) ──
  // Prevents any unmatched API requests from reaching the real backend and returning 403.
  // Specific mocks registered below take priority over these catch-alls.
  cy.intercept('GET', '/api/**', { statusCode: 200, body: [] }).as(
    'catchAllApiGet',
  );
  cy.intercept('POST', '/api/**', { statusCode: 200, body: {} }).as(
    'catchAllApiPost',
  );
  cy.intercept('PUT', '/api/**', { statusCode: 200, body: {} }).as(
    'catchAllApiPut',
  );
  cy.intercept('DELETE', '/api/**', { statusCode: 204, body: null }).as(
    'catchAllApiDelete',
  );
  cy.intercept('PATCH', '/api/**', { statusCode: 200, body: {} }).as(
    'catchAllApiPatch',
  );
  cy.intercept('GET', '/authoring-services/**', {
    statusCode: 200,
    body: [],
  }).as('catchAllAuthoringGet');
  cy.intercept('GET', '/snowstorm/**', { statusCode: 200, body: {} }).as(
    'catchAllSnowstormGet',
  );

  // ── Authentication & Config ──────────────────────────────────────────────

  // Mock the auth check endpoint - returns a logged-in user
  // This prevents the IMS redirect from firing
  cy.intercept('GET', '/api/auth', { fixture: 'api/auth.json' }).as('mockAuth');

  // Mock the app config endpoint
  cy.intercept('GET', '/config', { fixture: 'api/app-config.json' }).as(
    'mockConfig',
  );

  // Mock logout
  cy.intercept('POST', '/api/auth/logout', { statusCode: 200, body: {} }).as(
    'mockLogout',
  );
  cy.intercept('GET', '/api/auth/logout', { statusCode: 200, body: {} }).as(
    'mockLogoutGet',
  );

  // Mock the authenticate callback (used during the real login flow)
  cy.intercept('GET', '/api/authenticate', { fixture: 'api/auth.json' }).as(
    'mockAuthenticate',
  );

  // ── Users ────────────────────────────────────────────────────────────────

  cy.intercept('GET', '/api/users', { fixture: 'api/users.json' }).as(
    'mockUsers',
  );
  cy.intercept('GET', '/api/users/internal', { statusCode: 200, body: [] }).as(
    'mockInternalUsers',
  );

  // ── Service Status ───────────────────────────────────────────────────────

  cy.intercept('GET', '/api/status', { fixture: 'api/service-status.json' }).as(
    'mockStatus',
  );

  // ── Tasks (via authoring services proxy) ────────────────────────────────

  cy.intercept('GET', '/authoring-services/projects/my-tasks*', {
    fixture: 'api/tasks.json',
  }).as('mockMyTasks');
  cy.intercept('GET', '/authoring-services/projects', {
    fixture: 'api/projects.json',
  }).as('mockProjects');
  cy.intercept('GET', '/authoring-services/projects/*/tasks/*', {
    fixture: 'api/task-detail.json',
  }).as('mockTaskDetail');
  cy.intercept('POST', '/authoring-services/projects/*/tasks', {
    statusCode: 200,
    fixture: 'api/task-detail.json',
  }).as('mockCreateTask');
  cy.intercept('PUT', '/authoring-services/projects/*/tasks/*', {
    statusCode: 200,
    fixture: 'api/task-detail.json',
  }).as('mockUpdateTask');

  // Snomio task creation endpoint
  cy.intercept('POST', '/api/tasks', {
    statusCode: 200,
    fixture: 'api/task-detail.json',
  }).as('mockCreateSnomioTask');
  cy.intercept('GET', '/api/tasks', {
    statusCode: 200,
    fixture: 'api/tasks.json',
  }).as('mockGetSnomioTasks');

  // ── Tickets ──────────────────────────────────────────────────────────────

  cy.intercept('POST', '/api/tickets/search*', {
    fixture: 'api/tickets-search.json',
  }).as('mockTicketSearch');
  cy.intercept('GET', '/api/tickets', {
    fixture: 'api/tickets-search.json',
  }).as('mockGetTickets');
  cy.intercept('POST', '/api/tickets', {
    statusCode: 200,
    fixture: 'api/ticket.json',
  }).as('mockCreateTicket');
  cy.intercept('DELETE', '/api/tickets/*', { statusCode: 204, body: null }).as(
    'mockDeleteTicket',
  );
  cy.intercept('GET', '/api/tickets/ticketNumber/*', {
    fixture: 'api/ticket.json',
  }).as('mockGetTicketByNumber');
  cy.intercept('GET', '/api/tickets/*', { fixture: 'api/ticket.json' }).as(
    'mockGetTicket',
  );
  cy.intercept('PATCH', '/api/tickets/*', {
    statusCode: 200,
    fixture: 'api/ticket.json',
  }).as('mockPatchTicket');

  // Task-ticket associations (must be after /* wildcard so it takes priority)
  cy.intercept('GET', '/api/tickets/taskAssociations', {
    statusCode: 200,
    body: [],
  }).as('mockTaskAssociations');
  cy.intercept('GET', '/api/tickets/jobResults', {
    statusCode: 200,
    body: [],
  }).as('mockJobResults');

  // Ticket metadata
  cy.intercept('GET', '/api/tickets/labelType', {
    fixture: 'api/labels.json',
  }).as('mockLabels');
  cy.intercept('POST', '/api/tickets/labelType', {
    statusCode: 200,
    fixture: 'api/labels.json',
  }).as('mockCreateLabel');
  cy.intercept('GET', '/api/tickets/iterations', {
    fixture: 'api/iterations.json',
  }).as('mockIterations');
  cy.intercept('POST', '/api/tickets/iterations', {
    statusCode: 200,
    body: {
      id: 99,
      version: 0,
      created: '2026-01-01T00:00:00Z',
      createdBy: 'e2e-test-user',
      modified: '2026-01-01T00:00:00Z',
      modifiedBy: 'e2e-test-user',
      name: 'TestIteration',
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T00:00:00Z',
      active: false,
      completed: false,
    },
  }).as('mockCreateIteration');
  cy.intercept('DELETE', '/api/tickets/iterations/*', {
    statusCode: 204,
    body: null,
  }).as('mockDeleteIteration');
  cy.intercept('GET', '/api/tickets/externalRequestors', {
    fixture: 'api/external-requestors.json',
  }).as('mockExternalRequestors');
  cy.intercept('POST', '/api/tickets/externalRequestors', {
    statusCode: 200,
    body: {
      id: 99,
      version: 0,
      created: '2026-01-01T00:00:00Z',
      createdBy: 'e2e-test-user',
      modified: '2026-01-01T00:00:00Z',
      modifiedBy: 'e2e-test-user',
      name: 'TestExternalRequestor',
      description: 'Test',
      displayColor: { name: 'Aqua', code: '#00A8A8' },
    },
  }).as('mockCreateExternalRequestor');
  cy.intercept('DELETE', '/api/tickets/externalRequestors/*', {
    statusCode: 204,
    body: null,
  }).as('mockDeleteExternalRequestor');
  cy.intercept('GET', '/api/tickets/ticketFilters', {
    fixture: 'api/ticket-filters.json',
  }).as('mockTicketFilters');
  cy.intercept('POST', '/api/tickets/ticketFilters', {
    statusCode: 200,
    body: { id: 99, name: 'E2E Filter', searchConditions: [] },
  }).as('mockCreateTicketFilter');
  cy.intercept('GET', '/api/tickets/state', { fixture: 'api/states.json' }).as(
    'mockStates',
  );
  cy.intercept('GET', '/api/tickets/schedules', {
    fixture: 'api/schedules.json',
  }).as('mockSchedules');
  cy.intercept('GET', '/api/tickets/priorityBuckets', {
    fixture: 'api/priority-buckets.json',
  }).as('mockPriorityBuckets');
  cy.intercept('GET', '/api/tickets/additionalFieldTypes', {
    fixture: 'api/additional-field-types.json',
  }).as('mockAdditionalFieldTypes');
  cy.intercept('GET', '/api/additionalFieldValuesForListType', {
    statusCode: 200,
    body: [],
  }).as('mockAdditionalFieldValuesForListType');
  cy.intercept('GET', '/api/tickets/ticketTypes', {
    statusCode: 200,
    body: [{ id: 1, name: 'Author Product', description: '' }],
  }).as('mockTicketTypes');

  // Ticket actions
  cy.intercept('PUT', '/api/tickets/*/state/*', {
    statusCode: 200,
    fixture: 'api/ticket.json',
  }).as('mockUpdateTicketState');
  cy.intercept('PUT', '/api/tickets/*/iteration/*', {
    statusCode: 200,
    fixture: 'api/ticket.json',
  }).as('mockUpdateTicketIteration');
  cy.intercept('PUT', '/api/tickets/*/schedule/*', {
    statusCode: 200,
    fixture: 'api/ticket.json',
  }).as('mockUpdateTicketSchedule');
  cy.intercept('PUT', '/api/tickets/*/priorityBuckets/*', {
    statusCode: 200,
    fixture: 'api/ticket.json',
  }).as('mockUpdateTicketPriority');
  cy.intercept('POST', '/api/tickets/*/labels/*', {
    statusCode: 200,
    fixture: 'api/ticket.json',
  }).as('mockUpdateTicketLabel');
  cy.intercept('POST', '/api/tickets/*/comments', {
    statusCode: 200,
    body: {
      id: 501,
      version: 0,
      created: '2026-01-01T00:00:00Z',
      createdBy: 'e2e-test-user',
      text: 'This is a tester comment',
      authorUsername: 'e2e-test-user',
      authorDisplayName: 'E2E Tester',
    },
  }).as('mockCreateComment');
  cy.intercept('PUT', '/api/tickets/*/comments/*', {
    statusCode: 200,
    body: {
      id: 501,
      version: 1,
      created: '2026-01-01T00:00:00Z',
      createdBy: 'e2e-test-user',
      text: 'This is a tester comment - edited',
      authorUsername: 'e2e-test-user',
      authorDisplayName: 'E2E Tester',
    },
  }).as('mockUpdateComment');
  cy.intercept('DELETE', '/api/tickets/*/comments/*', {
    statusCode: 204,
    body: null,
  }).as('mockDeleteComment');
  cy.intercept('POST', '/api/attachments/upload/*', {
    statusCode: 200,
    body: {
      attachmentId: 'mock-attachment-001',
      fileName: 'test-file.json',
      size: 26,
    },
  }).as('mockUploadAttachment');
  cy.intercept('DELETE', '/api/attachments/*', {
    statusCode: 204,
    body: null,
  }).as('mockDeleteAttachment');
  cy.intercept('POST', '/api/tickets/*/additionalFieldValue/*/*', {
    statusCode: 200,
    body: { id: 1, fieldName: 'ARTGID', value: '69420' },
  }).as('mockAdditionalFieldValue');
  cy.intercept('POST', '/api/tickets/*/taskAssociations/*', {
    statusCode: 200,
    body: {
      id: 1,
      taskId: 'AUAMT-E2E-1',
      ticketId: 1001,
      created: '2026-01-01T00:00:00Z',
    },
  }).as('mockTaskTicketAssociation');

  // Ticket products
  cy.intercept('GET', '/api/tickets/*/products*', {
    statusCode: 200,
    body: [],
  }).as('mockTicketProducts');
  cy.intercept('GET', '/api/tickets/*/bulk-product-actions*', {
    statusCode: 200,
    body: [],
  }).as('mockBulkTicketProducts');
  cy.intercept('GET', '/api/tickets/*/products/*', {
    statusCode: 200,
    body: {},
  }).as('mockTicketProduct');

  // ── Products / Medications / Devices ────────────────────────────────────

  cy.intercept('GET', '/api/**/product-model/**', {
    fixture: 'api/product-model.json',
  }).as('mockProductModel');
  cy.intercept('GET', '/api/**/medications/**', {
    statusCode: 200,
    fixture: 'api/medication-detail.json',
  }).as('mockMedicationLoad');
  cy.intercept('GET', '/api/**/devices/**', {
    statusCode: 200,
    fixture: 'api/medication-detail.json',
  }).as('mockDeviceLoad');
  cy.intercept('GET', '/api/**/medications/**/pack-sizes', {
    statusCode: 200,
    body: { packSizes: [] },
  }).as('mockBulkPackLoad');
  cy.intercept('GET', '/api/**/medications/**/brands', {
    statusCode: 200,
    body: { brands: [] },
  }).as('mockBulkBrandLoad');
  cy.intercept('POST', '/api/**/medications/product/$calculate', {
    statusCode: 200,
    fixture: 'api/calculate-response.json',
  }).as('mockCalculateMedication');
  cy.intercept('POST', '/api/**/devices/product/$calculate', {
    statusCode: 200,
    fixture: 'api/calculate-response.json',
  }).as('mockCalculateDevice');
  cy.intercept(
    'POST',
    '/api/**/medications/product/$calculateNewBrandPackSizes',
    { statusCode: 200, fixture: 'api/calculate-response.json' },
  ).as('mockCalculateBrandPack');
  cy.intercept('POST', '/api/**/medications/product', {
    statusCode: 201,
    fixture: 'api/calculate-response.json',
  }).as('mockCreateMedication');
  cy.intercept('POST', '/api/**/devices/product', {
    statusCode: 201,
    fixture: 'api/calculate-response.json',
  }).as('mockCreateDevice');
  cy.intercept('POST', '/api/**/medications/product/new-brand-pack-sizes', {
    statusCode: 201,
    fixture: 'api/calculate-response.json',
  }).as('mockCreateBulkBrandPack');
  cy.intercept('POST', '/api/**/qualifier/product-name', {
    statusCode: 200,
    body: {
      conceptId: '900000000000441003',
      pt: { term: 'MockBrand', lang: 'en' },
      fsn: { term: 'MockBrand (product)', lang: 'en' },
    },
  }).as('mockCreateTpBrand');
  cy.intercept('GET', '/api/**/medications/field-bindings', {
    statusCode: 200,
    fixture: 'api/field-bindings.json',
  }).as('mockFieldBindings');

  // ── Snowstorm (SNOMED CT) ────────────────────────────────────────────────

  cy.intercept('GET', '/snowstorm/**/concepts*', {
    fixture: 'api/concept-search.json',
  }).as('mockConceptSearch');
  // Specific override for single-concept-by-id lookup (must be after the catch-all so LIFO gives it priority)
  cy.intercept('GET', /\/snowstorm\/.*\/concepts\/900000000000441003$/, {
    statusCode: 200,
    body: {
      conceptId: '900000000000441003',
      active: true,
      definitionStatus: 'PRIMITIVE',
      fsn: { term: 'MockBrand (product)', lang: 'en' },
      pt: { term: 'MockBrand', lang: 'en' },
    },
  }).as('mockBrandConceptById');
  cy.intercept('GET', '/snowstorm/branches', { statusCode: 200, body: [] }).as(
    'mockBranches',
  );
  // Use regex to match both slash and percent-encoded (%2F) branch paths
  cy.intercept('GET', /\/snowstorm\/branches\/.+/, {
    statusCode: 200,
    body: {
      path: 'MAIN/SNOMEDCT-AU/AUAMT/AUAMT-E2E-1',
      state: 'UP_TO_DATE',
      locked: false,
      containsContent: false,
      metadata: { internal: { classified: '' } },
    },
  }).as('mockBranchDetails');
  cy.intercept('POST', '/snowstorm/branches*', {
    statusCode: 200,
    body: { path: 'MAIN/SNOMEDCT-AU/AUAMT/AUAMT-E2E-1', state: 'UP_TO_DATE' },
  }).as('mockCreateBranch');

  // ── Config endpoints ─────────────────────────────────────────────────────

  cy.intercept('POST', '/api/telemetry', { statusCode: 200, body: {} }).as(
    'mockTelemetry',
  );
  cy.intercept('GET', '/api/config', { statusCode: 200, body: {} }).as(
    'mockSecureConfig',
  );
  cy.intercept('GET', '/config/**/schema', {
    statusCode: 200,
    fixture: 'api/medication-schema.json',
  }).as('mockSchema');
  cy.intercept('GET', '/config/**/ui-schema', {
    statusCode: 200,
    fixture: 'api/medication-ui-schema.json',
  }).as('mockUiSchema');
  // Specific overrides for bulk-pack and bulk-brand (registered after catch-all, so LIFO gives them priority)
  cy.intercept('GET', '/config/bulk-pack/**/schema', {
    statusCode: 200,
    fixture: 'api/bulk-pack-schema.json',
  }).as('mockBulkPackSchema');
  cy.intercept('GET', '/config/bulk-pack/**/ui-schema', {
    statusCode: 200,
    fixture: 'api/bulk-pack-ui-schema.json',
  }).as('mockBulkPackUiSchema');
  cy.intercept('GET', '/config/bulk-brand/**/schema', {
    statusCode: 200,
    fixture: 'api/bulk-brand-schema.json',
  }).as('mockBulkBrandSchema');
  cy.intercept('GET', '/config/bulk-brand/**/ui-schema', {
    statusCode: 200,
    fixture: 'api/bulk-brand-ui-schema.json',
  }).as('mockBulkBrandUiSchema');

  // ── Refsets / Activities (used by ProductPreviewBody) ────────────────────

  cy.intercept('GET', '/snowstorm/**/members*', {
    statusCode: 200,
    body: { items: [], total: 0, limit: 50, offset: 0 },
  }).as('mockRefsetMembers');
  cy.intercept('GET', '/authoring-services/projects/*/tasks/*/activities*', {
    statusCode: 200,
    body: [],
  }).as('mockTaskActivities');
  cy.intercept('GET', '/authoring-services/projects/*/tasks/*/reviews*', {
    statusCode: 200,
    body: { reviewers: [] },
  }).as('mockTaskReviews');
  cy.intercept('GET', '/api/**/product-model/**/externalIdentifiers', {
    statusCode: 200,
    body: [],
  }).as('mockExternalIdentifiers');
}
