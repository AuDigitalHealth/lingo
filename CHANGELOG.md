# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The following sections are considered for each release: **Added, Changed, Fixed, Security, Deprecated, Removed**

## [Unreleased]
- Improved Backlog filter workflow: the currently loaded filter is now shown as an "Active: [name]" chip in the toolbar. The Save Filter modal now restricts what can be saved — when a filter is loaded it offers two choices (update the loaded filter, or save as new with a unique name); when no filter is loaded it only allows creating a new filter by name. This prevents accidentally overwriting an unrelated saved filter.


## [1.3.47] - 2026-06-18
### Added
- The name generator can now receive a brand (product name) hint for virtual NMPC Clinical Drug concepts via a new optional `product_name` request field, allowing the brand to be woven into the generated FSN/PT without adding it to the concept's logical definition (axiom). Gated behind a new `nameGeneratorSupportsProductName` model-configuration flag (enabled for NMPC).

### Fixed
- NMPC presentation/concentration-strength medicinal products failed to generate an FSN/PT because the strength numerator and denominator unit concepts were not seeded into the name-generator term cache, leaving bare SCTIDs in the OWL axiom that the generator could not parse. These units are now included so names generate correctly.
- Fixed the AMT device authoring screen not showing the ARTG ID field, so a device product with an ARTGID could not be loaded and edited to create a new product. The AMT device schema now declares the package-level `nonDefiningProperties` field (matching the medication and NMPC device schemas) and the device UI schema grid references it correctly (#1864).
- Fixed dependant concept fields (e.g. the device "Specific Device Type") being blank, greyed out, or showing a spurious "concept does not exist in this branch" error when loading an existing product. A field that already holds a value now stays editable instead of being disabled by its parent-driven dependant flag (whose enable propagates asynchronously on load), the autocomplete only clears its value on a genuine transition to disabled rather than during the load, and the currently selected concept is always retained as an option so a loaded value is no longer falsely reported as non-existent when the typeahead query doesn't return it (#1864).


## [1.3.46] - 2026-06-16
### Added
- Task to ticket association removal is now automated by configurable options, depending on different task status'
- Added "Remove Labels" and "Remove External Requesters" multi-selects to the bulk edit toolbar, allowing labels and external requestors to be removed from all selected tickets in one action.

### Security
- Fixed a server-side request forgery (SSRF) and local file disclosure risk in the "attach from URL" endpoint (`POST /api/attachments/upload/{ticketId}/from-urls`). Attachment URLs are now restricted to `http`/`https` schemes, rejected if the host resolves to a loopback/link-local/private/wildcard/multicast address, and redirects are no longer followed. Bean validation on the request body is now enforced (`@Valid`).
- Fixed a stored XSS risk in the concept review messages panel by sanitising review message HTML with DOMPurify before rendering (matching the existing ticket history pattern).
- Removed a hardcoded IMS credential from `ui/cypress/docker/docker-compose.yaml`; the username/password now come from the `IMS_USERNAME`/`IMS_PASSWORD` environment variables. The leaked credential should be rotated.

### Removed
- Removed the unused `sizeMb` field from the attach-from-URL request DTO (`AttachmentUrlDto`); it was never read by the server.

### Fixed
- Fixed Edit Terms description protection to key off each description's own module rather than the concept's module. Descriptions on SNOMED International core/metadata modules are read-only (shown with a "SNOMED International – read-only" marker) and cannot be inactivated, while an author's own-module descriptions (including historical extension modules) on an International concept remain editable. International descriptions can still be reactivated (which writes a superseding row on the project module). Language reference set acceptability now follows the same principle: the project's default dialect (e.g. IE-EN) stays editable so an International PT can be reassigned, non-default international dialects (e.g. US English) are editable only on the extension's own descriptions, and GB English is never editable.
- Fixed removal of a vaccine's qualitative strength (and target population / plays role) not being applied to the ATM (Actual Therapeutic Moiety): the NMPC `REAL_MEDICINAL_PRODUCT` level was missing from the ECL negative-filter catalogue, so the existing ATM still carrying the attribute was reused unchanged instead of being recalculated (CUST1634236).
- Fixed NMPC Nutritional product saves crashing with a null moduleId error on the MP node. The UI concept pickers now include moduleId in the submitted payload
- Fixed a bug in the auto task/ticket association removal when a task is deleted
- Fixed tickets sometimes not loading in the task info section after being added. A ticket found only in the paged search cache was incorrectly treated as already fetched, preventing it from being added to the main store where the task ticket list looks for it.
- Fixed product description updates creating a duplicate active description when the edited term matches an existing inactive description on the same concept. The existing inactive description (and its language reference set members) is now reactivated instead, and editing a term to collide with another active description is now rejected in the UI and API (CUST1634236).
- Fixed editing an existing product in place creating an entirely new OWL axiom (and retiring the previous one) instead of updating the existing axiom's relationships. The existing class axiom's identity is now preserved so Snowstorm updates it in place (CUST1634236).
- Fixed promotion validation ("Tidy & Promote") failing to detect dangling reference set members and
  non-defining relationships left behind when a concept is retired in the Authoring Platform.
  Detection now decides whether a changed concept is inactive from Snowstorm's authoritative status
  rather than the traceability change type (the traceability service records an inactivation as an
  `UPDATE`, not an `INACTIVATE`, so inherited references — e.g. a retired VTM's VTM reference set
  membership and `Has NMPC product type` property — were silently missed). Also stopped a concept's
  own (already-inactivated) OWL axiom member from being falsely listed as dangling. Fixed "Tidy &
  Promote" then failing with a 400 ("definitionStatusId must not be null") when inactivating a
  retired concept's released non-defining relationship: the browser concept update now backfills the
  `definitionStatusId` that Snowstorm's browser GET omits for inactive concepts (CUST1634236).
- Fixed the task list flooding the console with React "Maximum update depth exceeded" warnings: the
  `useAllTasks` hook returned a freshly sorted `allTasks` array on every render, which retriggered an
  effect-with-setState in the task assignee dropdown in an infinite loop. `allTasks` is now memoised
  so its identity only changes when the underlying query data does.
- Can now view tasks that you are the reviewer for in snodine, previously it would be stuck on the loading screen

## [1.3.45] - 2026-06-05
- Reworked `azure-pipelines-e2e.yml` into an on-demand pipeline that runs the Cypress e2e suite directly against the live dev environment (`https://dev-snomio.ihtsdotools.org`) by default, overridable via `E2E_*` pipeline variables in Azure. Removed the stale image-build/docker-compose stack, switched dependency install to pnpm, and added JUnit test publishing plus screenshot/video artifacts on failure. (#1826)
- Rewrote the Cypress UI test suite to run live against a deployed environment using `cy.login()` and real backend calls. Specs cover login/logout, tasks, backlog filtering, system settings, product search/view, and product authoring. The suite is driven by `npm run cypress:run` (headless) or `npm run cypress:open`, configured via `.env` (`VITE_SNOMIO_UI_TEST_URL`, `IMS_USERNAME`/`IMS_PASSWORD`, etc.). (#1826)
- Product authoring: `CustomSelectWidget` now emits a `data-testid` (the rjsf field id) so select widgets such as the ingredient strength-type ("Product Template") are addressable; recovered the strength-alignment, device and multi-pack ProductCreation Cypress tests and added test retries for the autocomplete-driven flows. (#1826)
- Fixed task association not disappearing from the UI after clicking the bin button on the backlog ticket view.
- Fixed Trivy pipeline failures caused by a context-cancel crash on `ui/pom.xml` and Maven Central
  429 rate-limit errors during parent POM resolution. `ui/pom.xml` is now skipped (build plugins
  only, no runtime deps); all scans run with `--offline-scan` backed by a cached
  `mvn dependency:go-offline` pre-populate step to prevent remote Maven Central requests.
- Fixed crash when `containedProducts` is undefined in `generateSuggestedProductName` and `generateSuggestedProductNameForDevice`.
- Concepts within each group in the "Preview New Product" screen are now sorted alphanumerically by preferred term.
- Added per-product **Strength format** choice (auto-inference / simple / ratio / percentage) on the medication authoring form, passed through to the name generator as `strength_format` for product-level concepts (including new branded products created in the brand/pack-size flow). When loading an existing product, the previous choice is pre-selected via a heuristic over the source preferred term and structured concentration-strength data. Honoured by name generators that accept the parameter — enabled per terminology model in `default-model-config.yaml` via `nameGeneratorSupportsStrengthFormat: true` (currently set on NMPC / `MAIN_SNOMEDCT-IE`). On models where this is unset/false the radio is not rendered, the rehydration heuristic does not run, and `strength_format` is not on the wire.


## [1.3.44] - 2026-05-27
### Fixed

- Fixed accordion collapsing in the info review screen when clicking the concept diagram, description or edit icon buttons inside the product preview accordion.

## [1.3.43] - 2026-05-26


## [1.3.42] - 2026-05-26

### Fixed

- Fixed accordion collapsing in the info review screen when clicking the review (mail/approve) buttons or product status indicators (new-in-task, new-in-project, description/property change badges). Clicks on disabled buttons and plain SVG icons now stop propagating to the accordion summary.
- Fix vaccine target population update not creating a new VTM when the existing model concept (e.g.
  a SNOMED CT International concept reused by NMPC/AMT) is owned by an external module: the preview
  no longer offers "edit in place" or "retire and replace" for those concepts. Instead the original
  concept is removed from the authoring reference sets and a new concept is created in its place,
  with no inactivation and no historical association. (#1793)
- Fix product update not detecting changes when removing `Has target population` or `Has ingredient
  qualitative strength` from a vaccine/nutritional product. The ECL generated for candidate concept
  lookup now adds `[0..0]` negative filters for the NMPC user-controllable MP-level attributes
  (target population, plays role, qualitative strength) at the MP/VTM, VMP and AMP levels, and the
  VMP/AMP search is constrained by the recalculated VTM rather than a generic `Virtual Medicinal
  Product` root so the cascade picks up the new parent. (#1792)
- Fixed a bug in the auto task/ticket association removal when a task is deleted
- For SNOMED International concepts, synonym language refset editing is now restricted to the project-configured refset only
- Bumped Java dependencies: postgresql 42.7.3→42.7.11, rest-assured 5.5.0→6.0.0,
  maven-jar-plugin 3.4.2→3.5.0, awaitility 4.2.2→4.3.0, commons-validator 1.9.0→1.10.1
- Fixed `TaskRejectedException` caused by async executor thread pool exhaustion when cache refresh
  operations overlapped or exceeded timeout
- Added 55-second timeout to cache refresh operations to prevent hung tasks from blocking the
  executor pool
- Added a 60-second timeout (configurable via `ihtsdo.jira.user.timeout.seconds`) to the Jira
  user fetch in `JiraUserManagerService` so a hung upstream call can't exhaust the async pool
- Implemented skip-if-running logic for cache refresh to prevent duplicate concurrent refresh
  operations
- Fix Check Changelog workflow to skip dependabot PRs reliably; the previous
  `github.actor` check was unmasked whenever a human triggered a re-run (e.g.
  label change), now keyed on the PR author. Also bumped `actions/checkout` v2→v4. (#1820)

### Added

- Micrometer counter `snomio.cache.refresh.skipped` (tagged by `cache`) for visibility into
  skipped cache refreshes

### Changed

- Increased async executor max pool size from 20 to 100 and queue capacity from 25 to 50 to
  handle temporary spikes in async operations. Defaults are now overridable per environment via
  `snomio.async.core-pool-size`, `snomio.async.max-pool-size` and `snomio.async.queue-capacity`
  so lower-capacity environments can downsize.

## [1.3.41] - 2026-05-15
- Fix Attachment content type to fallback to jdk detected content type when the file is uploaded without a content type
- Migrate to pnpm


## [1.3.40] - 2026-05-15


## [1.3.39] - 2026-05-08

### Added
- On task promotion, detect dangling reference set members and non-defining relationships left by Authoring Platform retire/delete actions and offer to tidy them (delete unreleased, inactivate released) before promoting (#1753)
- When a task changes to status 'promoted' or 'completed' the associated ticket will now be automatically be changed to state 'Closed'
- When a task is either deleted or has been released the ticket assocation to this task will now be automatically deleted.
- The display of the tickets backlog page now includes the total number of tickets that is returned for a query.
- Enforce configurable maximum character length for preferred terms, resolved per language refset, on concept authoring and edit term screens

### Fixed
- The Rows per page: 'All' option on the tasks page now correctly shows 1 - n of n instead of n + 1 - n  of n for the items displayed
- Fix NMPC concept ids (e.g. Virtual medicinal product) leaking into the name generator input as raw SCTIDs by seeding the FSN/PT cache with `NmpcConstants` alongside `AmtConstants` and `SnomedConstants`.
- Some concepts were defaulting to Primitive when they should not have been
- After creating a task previously the application would sometimes hang for a long time, this no longer happens.
- Fix null pointer exception in quantity unit validation for unit "each"
- Fix new brand and pack size feature so that cloned source modelling (e.g. NMPC nutritional `IS_A NMPC Oral Nutritional product`) is preserved on new branded concepts, and the SNOMED CT `Medicinal product` root is used at the top branded level for both AMT and NMPC instead of `Virtual medicinal product`.


## [1.3.38] - 2026-04-24


## [1.3.37] - 2026-04-15
- Upgrade `ecl-builder` to `0.3.0`
- Add `@aehrc/ecl-editor-react` dependency (required by `ecl-builder@0.3.0`)
- Fix issue where the ticket that a concept was authored on was not correctly picking up bulk-brand/packsize updates
- Update My task display logic to fall back to matching by username when email is not found
- Configuration added for the automatic creation of synonyms on the product authoring screen if the term contains a substring. These can be created a new page which is reachable through the drop down on the top right.
- Fix regression in snodine where the tick and flick refset member actions had been removed.


## [1.3.36] - 2026-02-23
- Fix the order of comments on tickets so they are sorted sequentially.
- Rebase Icon was showing 'STALE' text when task status was 'DIVERGED'
- feature/show-ticket-authoring-number-on-ctpp-concept
- When a product is viewed in it's n box model form, the subject concept accordion will now contain links to the tickets that this product was created/updated on.
- Changed the warning on the description update screen, to explain issues with semantic tags more clearly.

### Fixed
- Fix issue where term edits fail when the only change is case (uppercase to lowercase or vice versa).
- Fix issue where the S3 bucket URL is not being updated for the attachment.


## [1.3.35] - 2026-02-13

### Added
- Product update process upgraded to determine primitive concepts in calculated updates where
  possible, saving the user from having to manually select from existing concept options.

### Fixed
- Fix accordion collapsing when clicking icon buttons in 7 box model screens
- Fix Issue with attachments, not converting to url after product create or product update.


## [1.3.34] - 2026-02-04

### Fixed

- There were 500 errors occurring on the concept diagram model api call on the product description
  update screen when the user was editing a task on a project which was not the default project,
  these are now fixed as requested by Snomed.
- Issues with device type ECL and brand "show default options" configuration for NMPC blocking
  device updates
- Resolved product preview and primitive concept selection workflow for device updates


## [1.3.33] - 2026-02-02
- modified generated names were not being saved when a product update was performed


## [1.3.32] - 2026-01-30

### Added
- Support for new Snowstorm task statuses: "Auto Queued" and "Auto Rebasing"
- AI transparency indicators for Fully Specified Names (FSN) and Preferred Terms (PT) in concept creation/editing. Displays informational messages to inform users when content is AI-generated and tracks modifications as a best practice exceeding EU AI Act requirements.

### Fixed

- Unnecessary Vvlidation messages with non-def properties on new brands left hand side panel
- TypeError when selecting "All Tasks" option caused by attempting to sort read-only query data
  array
- When copying fsn's the semantic tag is now correctly enclosed in '()'
- The advanced search bar when opening a products N box model now correctly links to the selected
  project
- Undid fix that caused a bug in the list of products authored against a ticket, the bug caused the
  authored products to not be shown.

### Changed
- Changed CE number configuration datatype from UNSIGNED_INTEGER to STRING to preserve left-padded zeros
- Reduced task cache refresh interval from 60 seconds to 30 seconds to improve responsiveness
- Previously when a brand/product name had been authored against a task on a ticket, and not promoted, then this task was abandoned and the ticket was attached to another task then loaded into the product authoring form, it would include the concept authored for brand/product on the last task, which doesn't exist on the new task. It now raises a warning 'Concept does not exist in this branch, please search or create the concept'. 

## [1.3.31] - 2026-01-27

### Changed
- Product Authorisation number validation to allow 3 character PA numbers for NMPC


## [1.3.30] - 2026-01-23

### Fixed

- UI error loading a saved product description edit for review
- Project level product model view not showing language reference sets on concept description view
- Updated discontinuation letter to enable attachments from tickets.

## [1.3.29] - 2026-01-22

### Fixed
- Add support for decimal values in multi pack screen.
- Defect #1675 where ECL generated for AMT MPUU concepts was not specific enough
- Change snomio.namespace to support the AUAMCR project
- Fixed defect where inactive non-defining relationships were not being reactivated when updating products. Previously, if an existing relationship existed but was inactive, Snowstorm insisted that relationship needed to be reactivated instead of a new active relationship being added.
- If an iteration is completed, and it is not active, it will now be red instead of yellow.
- Task Id is now sorted on the ticket screen, when you attempt to associate a ticket to a task through the ticket screen.
- There is no longer a horizontal scroll on the tick and flick refset list.

## [1.3.28] - 2026-01-12

### Added
- Multiple projects can now be configured in snomio. To add another project, change the environment variable ihtsdo.ap.projectKey to be a comma-separated list.

### Fixed

- Fixed an issue where cascading non-defining properties failed to remove ancestor properties,
  leading to unintended property value additions instead of replacements.

## [1.3.27] - 2025-12-24

### Changed

- Updated ECL for VTM device binding for NMPC

## [1.3.26] - 2025-12-23

### Fixed
- Incorrect detection of concepts referenced by existing products in update scenarios
- New brand feature defaulting and mandatory/optional configuration of non-defining properties
  managed at upper brand and generic levels (HSE tracker 229)

### Changed
- Simplified ECL binding for generic and specific dose form for NMPC

## [1.3.25] - 2025-12-17

### Fixed

- Defect updating a product with a retired concept when the CIS is enabled

## [1.3.25] - 2025-12-17
- Enabled multiplatform api image push (with -am flag)

## [1.3.24] - 2025-12-17
- Disable multiplatform image push


## [1.3.23] - 2025-12-16

### Fixed
- Defect which did not retire stated relationships when retiring a concept - Snowstorm does not do
  this itself when a concept is inactivated

### Added
- Configuration to enable editing of the Schedule 8 reference set for AMT
- fix allowed FSL-1.1-MIT license for Sentry integration

### Removed
- Remove default non-defining properties for HSE and display only read-only fields

## [1.3.22] - 2025-12-15
- Fix jira user bug in production, jiraUser.getUsers().getItems() was returning null, added null check


## [1.3.21] - 2025-12-02
### Fix
- Fix rebase process to prevent incorrect UI prompt to login

### Removed
- Case sensitivity fields for edit terms screen requested by HSE and AMT
- Removed unnecessary NMPC fields

### Added
- Ability to hide fields, and hid the NMPC type field which users do not need or want to see

## [1.3.20] - 2025-12-01

### Fixed
- Fix error screen that could occur on task rebase

### Changed
- Change width of columns on the backlog screen, so there is no overflow on smaller screens
- Now shows invalid external identifiers in the atomic data entry form, these are highlighted in red.

### Removed
- Remove nondefining properties from product edit terms screen

### Added
- Handling of non-defining properties with coded values no longer in the FHIR CodeSystem -
  highlights these non-defining properties in red to attract user attention

## [1.3.19] - 2025-11-13

### Added

- Colour/icon legend to all box model views
- New in task/project icons to the legend for box model view
- Extended search for pack size unit of measure for NMPC
- Notification when the user is already on the page, and the released version of Lingo has changed. The notification prompts user to refresh the page.
- Button to expand and collapse all the concepts in the box model screens

### Changed

- Artg Id search to only appear for AMT branches
- Add product level nondefining properties to brand and pack
- Dose form type field for NMPC from optional to mandatory as requested.
- Disable delete option for robot created product saved data

### Removed

- RJSF refactor warning from the project README.md

## [1.3.18] - 2025-11-12

### Added

- Changelog to user interface about box, user gets notified of changes to the changelog with a snackbar.
- License and attribution information to user interface about box
- Users can now refresh their backlog search, without having to refresh the page. This is useful in situations where the user has edited some tickets, which should drop out of the search.
- Can now reset fields that will be updated in the bulk ticket edit feature.

## [1.3.17] - 2025-11-06

Release generated by release automation update

## [1.3.16] - 2025-11-06

Release generated by release automation update

## [1.3.15] - 2025-11-06

Release generated by release automation update

## [1.3.14] - 2025-11-06

### Fixed

- My Backlog quick search fixed

## [1.3.13] - 2025-11-05

### Added

- Retry and logging for WebClientRequestException because Snowstorm recently started prematurely
  disconnecting requests

## [1.3.12] - 2025-11-04

### Added

- Headers and descriptions to backlog views for better navigation clarity
    - My Backlog now shows "Tickets assigned to me (excluding closed tickets)"
    - Backlog now shows "All tickets in the system with filtering and bulk edit capabilities"
- Updated color legend to clarify that primitive and fully defined concepts are existing concepts
- Ability to open review messages in a new tab

## [1.3.11] - 2025-11-04

### Fixed

- Fixed product update crash caused by validation issues in ProductUpdateDetails

## [1.3.10] - 2025-11-03

### Fixed

- Added retry logic and enhanced logging for PrematureCloseException errors from Snowstorm
- Fixed cache invalidation for concept searches and product loading when branches are rebased
- Improved merge handling for diverged tasks with conflict detection and resolution workflow

## [1.3.9] - 2025-10-30

### Fixed

- Resolved missing TP refset issue that was overlooked during merges
- Enhanced bulk pack operations and functionality
- Disabled update button for inactive/deleted products to prevent errors

### Added

- Separate display of unpublished and published concepts in Lingo for better visibility
- Improved error messaging for task rebase operations to provide more informative feedback

## [1.3.8] - 2025-10-27

### Changed

- NMPC field binding fix for contains device identifier

## [1.3.7] - 2025-10-23

### Changed

- NMPC VMP cascade for licenced route removed

## [1.3.6] - 2025-10-22

### Changed

- Removed OII for NMPC

### Added

- Convert create operation to update for found product

## [1.3.5] - 2025-10-15

### Fixed

- Fixed a defect affecting multipack products when concept options are provided (primitive concepts
  for example inert components) which was causing a loop not allowing product creation.

## [1.3.4] - 2025-10-14

### Added

- Added colours for feedback badges
- Product audit view functionality

### Changed

- Updated NMPC defaults for OII
- Refactored other identifying information handling in calculation services
- Changed device class for to AMPP from AMP for IEDC

## [1.3.3] - 2025-10-02

### Fixed

- Fixed search bar layout issues
- Fixed unable to delete partial product bug
- Fixed double space tabs etc from FSN and PT
- Fixed error snackbar for 400's
- Fixed issues with description update, around ATC code and serialization
- Fixed TP refset not being added for primitive concept swaps in update scenarios

## [1.3.2] - 2025-09-30

### Added

- Bulk product action migration for brands, packsizes, and product updates
- Reload button to prevent stale updates

### Changed

- Sort bulk products by PT ascending order
- Sort task tickets by number
- Preserve partial update mode enabled and allow update

### Fixed

- Fixed properties not showing on edit terms screen across product/package
- Fixed I232 issue
- Fixed nutritional product target population and variant type
- Fixed existing clinical drug and existing MP for nutritional products

## [1.3.1] - 2025-09-24

### Added

- Secret scanning job with TruffleHog and Gitleaks to Azure Pipelines
- Pre-commit hooks for secret scanning

### Changed

- Updated ECL for IEDC
- Removed multi component indicator per I215
- Removed unit level PAN as discussed with HSE

### Fixed

- Fixed task no longer exists error message
- Fixed Sentry crash reports
- Fixed for I193 where multicomponent products with cascading non-defining properties were not
  correctly selecting and editing concepts
- Trimmed leading/trailing spaces from terms

## [1.3.0] - 2025-09-22

### Added

- Generic backend refactor - major architectural changes
- Enhanced error handling and validation
- Improved product creation and update workflows

### Changed

- Major refactoring of backend services for better maintainability
- Updated configuration management for different model types
- Improved serialization handling

### Fixed

- Various formatting and linting issues
- Test suite improvements
- Enhanced stability for product operations

## [1.2.11] - 2025-09-03

### Fixed

- Multiple bug fixes and stability improvements

## [1.2.10.6] - 2025-07-02

### Fixed

- Fixed handling of primitive concept selection as component of a multicomponent, multipack product in one of the packs

## [1.2.10.5] - 2025-06-24

### Fixed

- Detection of datatypes or object properties based on the SnowstormRelationship.getConcrete() Boolean result was unreliable due to null values. This led to missing clauses in the ECL and overly broad detection of existing concepts.

## [1.2.10.4] - 2025-05-29

### Added 

- Ability to drag/drop attachments onto tickets
- Can now filter for refsets with inactive concepts
- Can now create tasks on the snodine page, on any project
- Create additional synonyms in the 7 box create screen

### Changed

- Sort refset members by title
- Reference sets are now handled on the front end, all data is queried when a reference set is loaded

### Fixed

- Pagination of reference set members now extends beyond 10,000
- Issues with the artgid reference set
- Issues with the semantic tags when the duplicate fsn/pt warning would appear on the 7 box create screen

## [1.2.10.3] - 2025-04-24

### Added

- Ability to manually lock Snomio processes during a release week (#1350)
- Display a concept model diagram for a concept using the inferred view (#870)
- Create additional synonyms for new product concepts within the 7-box Preview screen (#159)
- Ticket management: Attach multiple files to a ticket in a single manual operation (#1263)
- Separation of semantic tags from concept descriptions in the 7-box Preview screen (#1354)
- Validation of concept semantic tags within the Preview screen (#1353)
- Sergio: Add/update additional URLs targeting product information (#1262)

### Changed

- In the dashboard screen, add the saved filter's name as a title for each cell (#867)
- 7-box Preview screen does not remove newline characters from manually-edited descriptions (#1328)
- Task Management: Sort tasks by reviewers (#1303)
- Sergio: Remove BlackTriangle label from ticket when the product is no longer BTS (#1370)
- Sergio: Additional stabilisation improvements (#1300)
- Snodine: Overnight processing should skip broken reference sets without aborting the entire run (#1398)

### Fixed

- Unable to edit the description of a multi-component product (#1323)
- Sergio: Tickets are being updated with incomplete comments (#1277)
- Sergio: Incorrect title for product URL in tickets (#1409)

## [1.2.10.2] - 2025-02-27


## [1.2.10.1] - 2025-02-27

## [1.2.9] - 2024-12-06
### Added
- "Help & Support" button for reporting bugs or requesting features
  * You need to specify your name and email address, then an internal ticket (which is neither Jira nor Snomio) will be generated.
  * The system will capture some of the browser logs, the URL you're on, etc. and you can also add a screenshot.
  * The development team is notified when a ticket is created, and bug fixes and features will be added to the Snomio backlog as required for tracking.
  * This system will also automatically report backend errors encountered by Snomio, for example if the server gets a random error while communicating with Snowstorm.
  * If you are unsure of whether an on-screen behaviour is an issue, or you have an initial suggestion for a complex feature, please continue to use the Teams channels for discussing interactively first.
- Add and remove ARTG IDs from existing concepts
  * From within a task, when the atomic data entry form is displayed one of the authoring options is “Edit Product”.
  * After searching for and selecting a product, all of the CTPPs will have a pencil icon for editing the concept.
  * In addition to adding and removing ARTG IDs, the FSN and PT of the CTPP can be modified as well.
  * A history of these editing changes is not currently being recorded against the ticket.  This will be added after a design discussion around recording other product/concept changes has occurred (e.g. when modifying a product by using the atomic data entry form).
  * Until the history of changes is being recorded against a ticket, users should record these updates as a comment on the ticket – so reviewers can check the changes using the Authoring Platform.
- Addition of environment-specific Lingo logo
  * To match the Authoring Platform: Production = blue, UAT = green, Dev = red
  * The logo colour helps ensure users (and testers) are working within the correct environment.
- Modify and Delete saved ticket backlog filters
  * Available within the System Settings after clicking the user’s name.
  * The new modification feature currently only modifies the name of the filter.  You can still modify the way the filter works by applying it to the backlog, and then saving over the top of the existing filter – you just could never change its name before.
- Preview for attachments in the Edit Ticket screen
  * The following document types will offer a preview: png/jpg/jpeg, pdf
  * These are among the most commonly-used attachment file types.  Extending the preview to other file types will require significant development effort.
  * Attachments can still be downloaded from the tickets.
### Changed
- Users can highlight/copy text from list rows
  * All lists (except the list of tickets on a task) can have their row text highlighted and copied to the clipboard (e.g. ticket numbers in the Sergio notifications).
  * Previously, dragging the cursor across the row would cause a drag-and-drop event to start.
- Within the 7-box model screens, when viewing the list of reference sets for a concept they are now sorted alphabetically
- Internal changes to support open-sourcing of Snomio
  * These changes do not affect the functionality of the applications, just makes them more generic for external developers to view and use.
  * These changes affected a wide range of code across the platform, which has then undergone regression testing to ensure it will be suitable for deployment.
### Fixed
- In the product Advanced Search feature, entering a 5-digit number would cause an error message to be displayed
  * This was related to the Advanced Search’s inherent ability to search for an ARTG ID.
- Clicking the title of a ticket in the Edit Task screen sends the user to the Backlog list and then draws the Edit Ticket panel (instead of leaving the Edit Task screen open in the background)
- When associating a task with a ticket in the Edit Task panel, task titles are artificially truncated
- Ticket management: when a ticket is assigned to a user, the comments saved against the ticket are shown to have been created by the new user
  * This was just a display issue; the data underneath was not being overwritten.
- Unable to associate specific tickets with tasks
  * The original list of tickets was manually fixed in the Production environment.
  * Further changes have now occurred to reduce the chance of this occurring in the future, and to ensure that clearing the associated task from a ticket would occur without performing misleading validation.
- Manage Products from Deleted Task When Reassigning Ticket to New Task
  * After creating a product against a task, and then deleting that task and associating the ticket with another task, the saved product is still present in the Products list for the ticket.
  * Users used to be able to click the product to view its 7-box model diagram, even though the concepts no longer exist.  Now the only option is to upload the product’s details into the atomic data entry form.
  * Products which have been saved against the ticket but are not available within the current task will be coloured green (because they are completed) however they will also have a warning logo displayed in the row.
- 7-box Preview screen: Concept heading box should be red when multiple concepts exist for a box (was displaying as green, which was misleading)
- 7-box Preview screen: Unknown validation error occurs after selecting a concept option (when multiple potential concepts have been found) and reloading screen
  * Atomic data saved against a ticket can immediately be loaded into the atomic data entry form and then previewed; the 7-box Preview screen will show the MPUU (or whichever notable concept that was affected) in red and either an existing concept selected, or a new concept created, from within the screen.
- 7-Box Preview screen: Product details saved against ticket are skewing new product creation calculation
  * This was observed when multiple potential MPUUs were found during product creation.  After selecting one and saving the product, then loading the product into the atomic data entry form and clicking Preview, the system would automatically select an MPUU instead of offering the original set of options to the user.

## [1.2.8]

## [1.2.7]

## [1.2.5]

## [1.2.4]

## [1.2.3]

## [1.2.2]

## [1.2.1]

## [1.2.0]

## [1.1.3]

### Fixed

- a bug causing decimal concrete domain values that were whole numbers to not have a zero decimal
  place rendered in the concrete domain value making the classifier think they were integers

## [1.1.2]

## [1.1.0]

Initial testing version
