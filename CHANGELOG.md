# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The following sections are considered for each release: **Added, Changed, Fixed, Security, Deprecated, Removed**

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
