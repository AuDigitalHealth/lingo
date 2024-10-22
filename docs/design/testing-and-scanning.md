# Testing and scanning

## Purpose

This section provides an overview of the testing and scanning processes used for maintaining the 
Lingo application codebase.

## Scanning

A number of tools are used to scan the codebase for vulnerabilities; these are run on each pull 
request and are part of the quality gate to merge a change.

### DependaBot

DependaBot is used to scan the libraries that are used in the application, it automatically creates
a pull request that updates the library to the latest version which triggers a continuous
integration build and complete regression test.

This is used to keep the libraries up to date and secure.

### Snyk

Snyk is used to scan the codebase for vulnerabilities; it is run on each pull request and is part of
the quality gate to merge a change. If a vulnerability is found it automatically creates a pull
request that suggests fixes for the vulnerability.

### Trivy

Trivy is used to scan the application Docker image build that is used by the application. This scans
both Java dependencies and the operating system level in the base Docker image for security
vulnerabilities. Trivy is run as part of the build process locally and in the CI/CD pipeline.

If a vulnerability is found it will fail the build and the vulnerability will need to
be fixed before the build can be successful. If necessary the vulnerability can be ignored if no fix
is yet available, but this should be done with caution.

### SonarCloud

SonarCloud is used to scan the codebase for code quality issues, it is run on each pull request and
part of the quality gate to merge a change. It is recommended developers also have SonarLint installed 
in their IDE to catch issues before they are pushed to the repository.

## Testing

### Integration testing

Integration testing is run as part of the Lingo main build. This is automatically run on each pull
request to the main branch or specific branches.

Integration tests use Testcontainers to set up the environment, with a Testcontainer for Snowstorm
and a dummy database that contains static ticket information. The Testcontainer version of
Snowstorm and Elasticsearch has a cut-down version of published NRC extension data, to make it 
faster and have a shorter start up time.

Integration tests assure the overall workflow of content authoring in Lingo: the entirety of the 
ticket management system and the authoring and searching of concepts within Snowstorm and their 
transformation into the data structures used within Lingo.

The actions performed within the Authoring Platform and the full functionality of Snowstorm are out
of scope for the Integration Tests, which are focussed on Lingo.

To run the full suite of tests you can run the command `mvn test -DimsUsername=xxx -DimsPassword=xxx`

### Unit Tests

Unit tests cover small parts of the application, mostly helper functions and functions that
transform data from one format to another. These are fast, and automatically run as part of the
Lingo build process.

### End-to-end Tests

End-to-end (e2e) tests are run using Cypress against the Development environment of Lingo. The e2e tests
simulate a user logging into the system, and performing the base actions of Lingo, including

- creating tickets,
- managing tickets,
- creating tasks, and
- authoring products against tasks.

The actions performed within the Authoring Platform and the full functionality of Snowstorm are out
of scope for the e2e tests.

To run the e2e tests,

- set IMS_USERNAME and IMS_PASSWORD values in **ui/.env**,
- from **ui/** run `npx cypress open`, and choose which individual tests you want to run or `npx cypress
  run` to just run all of the tests.
