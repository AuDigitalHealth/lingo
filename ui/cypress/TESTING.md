# Lingo Frontend Test Suite

## Overview

This directory contains the Cypress E2E test suite for the Lingo frontend application.
Tests run in **mocked mode by default** — no deployed environment required.

## Test Structure

```
cypress/
├── e2e/                          # Test specifications
│   ├── mocked/                   # Tests designed for mock mode (default)
│   │   ├── LoginMocked.cy.ts     # Login and auth flow tests
│   │   ├── TasksMocked.cy.ts     # Task page navigation
│   │   ├── BacklogMocked.cy.ts   # Backlog/ticket list and filtering
│   │   ├── SettingsMocked.cy.ts  # System settings (labels, iterations, etc.)
│   │   └── ProductSearchMocked.cy.ts  # Product search and view
│   ├── LoginSpec.cy.ts           # Login tests (live mode)
│   ├── LogoutSpec.cy.ts          # Logout tests (live mode)
│   ├── TicketSpec.cy.ts          # Full ticket CRUD (live mode)
│   ├── TaskSpec.cy.ts            # Task navigation (live mode)
│   ├── BacklogSpec.cy.ts         # Backlog filtering (live mode)
│   ├── SystemSettingsSpec.cy.ts  # Settings management (live mode)
│   ├── ProductSearchAndView.cy.ts  # Product search (live mode)
│   └── ProductCreation.cy.ts     # Product authoring (DISABLED - see below)
├── fixtures/
│   ├── api/                      # Mock API response fixtures
│   │   ├── auth.json             # GET /api/auth mock
│   │   ├── app-config.json       # GET /config mock
│   │   ├── users.json            # GET /api/users mock
│   │   ├── tasks.json            # GET /authoring-services/.../my-tasks mock
│   │   ├── task-detail.json      # Single task mock
│   │   ├── tickets-search.json   # POST /api/tickets/search mock
│   │   ├── ticket.json           # Single ticket mock
│   │   ├── labels.json           # GET /api/tickets/labelType mock
│   │   ├── iterations.json       # GET /api/tickets/iterations mock
│   │   ├── external-requestors.json  # GET /api/tickets/externalRequestors mock
│   │   ├── ticket-filters.json   # GET /api/tickets/ticketFilters mock
│   │   ├── concept-search.json   # GET /snowstorm/.../concepts mock
│   │   ├── product-model.json    # GET /api/.../product-model mock
│   │   └── ...                   # Other mock fixtures
│   ├── test-filter-ticket.json   # Ticket data for filter tests
│   ├── test-iteration.json       # Iteration test data
│   ├── test-external-requestor.json  # External requestor test data
│   └── test-jiraUsers.json       # Jira user test data
├── support/
│   ├── commands.ts               # Custom Cypress commands
│   ├── e2e.ts                    # Global setup (imports, error handling)
│   └── mock-interceptors.ts      # Central mock intercept setup
└── TESTING.md                    # This file
```

## Running Tests

### Mocked Mode (Default — No Deployed Environment Needed)

```bash
# Run all tests headlessly (CI mode)
npm run cypress:run

# Open Cypress interactive mode
npm run cypress:open

# Run specific spec file
npx cypress run --spec "cypress/e2e/mocked/BacklogMocked.cy.ts"
```

### Live Mode (Against Deployed Environment)

Requires environment variables to be set:

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with real credentials

# Run against deployed environment
npm run cypress:run:live

# Open interactive mode against deployed environment
npm run cypress:open:live
```

#### Required environment variables for live mode:

| Variable             | Description            | Example                              |
| -------------------- | ---------------------- | ------------------------------------ |
| `VITE_SNOMIO_UI_URL` | Deployed frontend URL  | `https://dev-snomio.ihtsdotools.org` |
| `IMS_USERNAME`       | IMS login username     | `(your username)`                    |
| `IMS_PASSWORD`       | IMS login password     | `(your password)`                    |
| `VITE_IMS_URL`       | IMS base URL           | `https://ims.ihtsdotools.org`        |
| `VITE_AP_URL`        | Authoring Platform URL | `https://authoring.ihtsdotools.org`  |
| `VITE_SNOWSTORM_URL` | Snowstorm URL          | `https://snowstorm.ihtsdotools.org`  |
| `IHTSDO_PROJECT_KEY` | Project key            | `AUAMT`                              |

**Security note:** Never commit `.env` files containing real credentials.
Use environment variable injection via CI/CD secrets for pipeline runs.

## Mock Architecture

### How mocks work

When `CYPRESS_MOCK_MODE=true` (the default), the test infrastructure:

1. Intercepts all API requests using `cy.intercept()` before they leave the browser
2. Returns fixture data from `cypress/fixtures/api/`
3. Bypasses the IMS authentication redirect
4. Simulates a logged-in user via the mocked `/api/auth` endpoint

### Mock setup

Mocks are set up in `cypress/support/mock-interceptors.ts` via the `setupMockInterceptors()` function.
Call this in `beforeEach` blocks for tests that need mocked APIs:

```typescript
import { setupMockInterceptors } from '../../support/mock-interceptors';

describe('My Feature', () => {
  beforeEach(() => {
    setupMockInterceptors(); // sets up all intercepts
  });

  it('does something', () => {
    cy.visit('/dashboard/my-feature');
    // test behaviour
  });
});
```

### Overriding specific mocks

You can override individual mocks in a test:

```typescript
it('handles an empty state', () => {
  // Override just the search endpoint for this test
  cy.intercept('POST', '/api/tickets/search*', {
    fixture: 'api/tickets-search-empty.json',
  }).as('emptySearch');

  cy.visit('/dashboard/tickets/backlog');
  cy.wait('@emptySearch');
  cy.get('tbody > tr').contains('No Tickets Found');
});
```

### Dynamic mock data

Mocks that need dynamic values (IDs, timestamps) can be set up inline:

```typescript
cy.intercept('POST', '/api/tickets', req => {
  req.reply({
    statusCode: 200,
    body: {
      id: Date.now(),
      title: req.body.title,
      ticketNumber: `AMT-${Date.now()}`,
      // ...
    },
  });
}).as('createTicket');
```

## The `remock` Task

The `remock` task runs the test suite against a live deployed environment and
captures the real API responses to refresh the mock fixtures.

### Usage

```bash
# Set up environment variables first
export VITE_SNOMIO_UI_URL="https://dev-snomio.ihtsdotools.org"
export IMS_USERNAME="your-username"
export IMS_PASSWORD="your-password"

# Run remock
npm run remock
```

### What remock does

1. Validates required environment variables are present
2. Runs Cypress in live mode (`MOCK_MODE=false`) against the deployed environment
3. Captures API responses during test execution
4. Saves captured responses as fixture files
5. Logs the run to `cypress/remock-logs/`

### When to run remock

Run remock when:

- The backend API has changed and mocks are out of date
- New API endpoints have been added and need mocking
- Mock data has drifted from reality
- After a major backend release

After running remock, review the updated fixtures in `cypress/fixtures/api/`
before committing them to ensure no sensitive data (tokens, PII, etc.) was captured.

## Disabled Tests

### ProductCreation.cy.ts

This file is currently disabled with `cy.onlyOn(false)` in the `beforeEach` block.

**Original intent:** These tests cover the complex product authoring workflow:

- Creating medication products from scratch
- Validation rules (pack size, brand name, form/device exclusions)
- Concentration/strength alignment validation
- Bulk pack and bulk brand creation
- Device product creation
- Loading and previewing existing products

**Why disabled:** The tests require:

1. A real Snowstorm/AMT SNOMED CT service for concept searches
2. A live authoring platform with writable SNOMED CT branches
3. Specific test data to exist in the system

**Path to re-enabling:**

1. Create comprehensive Snowstorm mock responses for AMT product concept searches
2. Create mock responses for the medication calculation endpoints
3. Update the tests to support mock mode
4. Remove the `cy.onlyOn(false)` call

## Adding New Tests

1. Create a new spec file in `cypress/e2e/mocked/` for mocked tests
2. Import and call `setupMockInterceptors()` in `beforeEach`
3. Add any additional mock overrides specific to your tests
4. If the test requires new API endpoints, add intercepts to `mock-interceptors.ts`
5. Create corresponding fixture files in `cypress/fixtures/api/`

## CI/CD Integration

The Azure Pipelines `e2e_tests` job runs Cypress tests. By default it should
use `CYPRESS_MOCK_MODE=false` to test against the deployed environment.

For PR validation, use `CYPRESS_MOCK_MODE=true` (mocked mode) to run tests
without requiring a deployed environment.

## Known Limitations

1. **ProductCreation tests are disabled** — requires significant effort to mock properly
2. **Accessibility (a11y) tests may flag issues** — `skipFailures: true` is set to avoid blocking
3. **Mocked mode cannot verify real backend behaviour** — always run live mode before releases
4. **Session-based auth mocking** — the mock login bypasses the IMS session; if tests rely on session cookies, they may behave differently in mocked mode
5. **Dynamic data in mocks** — mock fixtures contain static IDs; tests should not assert on specific IDs unless the mock is set up to return them
