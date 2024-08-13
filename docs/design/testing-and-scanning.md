# Testing and scanning

## Purpose

### Scanning
Trivy is used to scan library vulnerabilities that are reported, this automatically created a pr that runs a build & test with the updated library making it easy to update libraries to secure versions. If a library is found to be more difficult to update - that is that there needs to be associated code changes it is temporarily added to .trivyignore while the code changes are implemented, or the library is updated to fix the security vulnerability.

### Testing

#### Integration testing

Integration testing is ran on build, which is ran on each pr to the main branch or specific branches.

Integration tests use testcontainers to set up the environment, a testcontainer is ran for each of snowstorm and a dummy database that contains base ticket information. The testcontainer version of snowstorm has a cut down version of data, to make it faster and have a shorter start up time.

Integration tests test the overall work flow - the entirety of the ticket management system and the authoring and searching of concepts within snowstorm and their transformation into the data structures used within snomio.

The actions performed within the Authoring Platform and the full functionality of Snowstorm are out of scope for the Integration Tests.

To run the full suite of tests you can run the command mvn test -DimsUsername=xxx -DimsPassword=xxx

#### Unit Tests

Unit testing tests a small part of the functionality of the application, mostly helper functions and functions that transform data from one format to another. There currently does not exist a way to run these seperately to the integration tests.

#### E2E Tests

e2e tests are ran using cypress, these are ran against the dev version of snomio. The e2e tests simulate a user logging into the system, and performing the base actions of Snomio. Which include creating tickets, doing ticket management activities, creating tasks and authoring products against tasks.

The actions performed within the Authoring Platform and the full functionality of Snowstorm are out of scope for the e2e tests.

To Run the e2e tests, navigate in ui/.env you will need to set a value for IMS_USERNAME and IMS_PASSWORD which will be your login for the ims, depending on what environment the application you are testing is pointing to, whether its dev or uat. From the run npx cypress open, and choose which individual tests you want to run or npx cypress run to just run all of the tests.
