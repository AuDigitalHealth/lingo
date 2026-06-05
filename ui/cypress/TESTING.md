# Lingo Frontend Test Suite

## Overview

This directory contains the Cypress E2E test suite for the Lingo frontend
application. **Tests run against a live deployed environment** (e.g. the dev
environment). There is no mock mode — every spec drives the real backend.

## Test Structure

```
cypress/
├── e2e/                             # Test specifications
│   ├── LoginSpec.cy.ts              # Login flow
│   ├── LogoutSpec.cy.ts             # Logout flow
│   ├── TicketSpec.cy.ts             # Full ticket CRUD
│   ├── TaskSpec.cy.ts               # Task navigation
│   ├── BacklogSpec.cy.ts            # Backlog filtering and ticket creation
│   ├── SystemSettingsSpec.cy.ts     # Labels, iterations, external requestors
│   ├── ProductSearchAndView.cy.ts   # Product search and view
│   ├── ProductCreation.cy.ts        # Product authoring (medication, device,
│   │                                # bulk pack, bulk brand)
│   └── helpers/                     # Shared step helpers used by the specs
├── fixtures/                        # Static test data (NOT mock API responses)
│   ├── test-iteration.json
│   ├── test-external-requestor.json
│   └── test-jiraUsers.json
├── support/
│   ├── commands.ts                  # Custom Cypress commands
│   └── e2e.ts                       # Global setup (imports, error handling)
└── TESTING.md                       # This file
```

## Running Tests

Tests need a target environment and IMS credentials. Configure via `.env` (in
the `ui/` directory) or by exporting the variables before running:

```bash
# Run all specs headlessly
npm run cypress:run

# Open the interactive runner
npm run cypress:open

# Run a specific spec
npx cypress run --spec "cypress/e2e/BacklogSpec.cy.ts" \
  --browser electron --headless
```

### Required environment variables

| Variable                  | Description                             | Example                                                     |
| ------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| `VITE_SNOMIO_UI_TEST_URL` | URL the tests drive (Cypress `baseUrl`) | `https://dev-snomio.ihtsdotools.org`                        |
| `IMS_USERNAME`            | IMS login username                      | `(your username)`                                           |
| `IMS_PASSWORD`            | IMS login password                      | `(your password)`                                           |
| `VITE_IMS_URL`            | IMS base URL                            | `https://dev-ims.ihtsdotools.org`                           |
| `VITE_AP_URL`             | Authoring Platform URL                  | `https://dev-snowstorm.ihtsdotools.org`                     |
| `VITE_SNOWSTORM_URL`      | Snowstorm URL                           | `https://dev-snowstorm.ihtsdotools.org/snowstorm/snomed-ct` |
| `IHTSDO_PROJECT_KEY`      | Project key                             | `AUAMT`                                                     |

**Security note:** Never commit `.env` files containing real credentials.
Inject them via CI/CD secrets for pipeline runs.

## Adding New Tests

1. Create a new spec file in `cypress/e2e/`.
2. Log in with `cy.login(Cypress.env('ims_username'), Cypress.env('ims_password'))`
   in `beforeEach` (the helper uses `cy.session` so the login is cached across
   tests in the spec).
3. Use the helpers in `cypress/e2e/helpers/` for common flows (creating a
   ticket, loading a task page, navigating the backlog, etc.).
4. If you need a new shared interception alias, add it to `support/commands.ts`
   and declare it in `cypress/index.d.ts`.

## CI/CD Integration

The Azure Pipelines `e2e_tests` job runs the Cypress suite against the deployed
environment configured via pipeline-level environment variables. There is no
mocked variant — all jobs hit a real backend.

## Known Limitations

1. **Accessibility (a11y) tests** — `skipFailures: true` is set so a11y
   violations don't block runs; they are still logged.
2. **Shared dev environment data** — specs create real tickets, tasks, labels,
   and iterations on the target environment. Cleanup steps are best-effort;
   expect some test data to accumulate.
3. **Backend search index lag** — some specs (notably the backlog filter chain)
   hit search-index propagation timing on dev. Helpers verify via the API
   response status code where possible to avoid racing DOM updates.
