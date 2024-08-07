# How to release an Snomio version

This page contains the steps needed to produce and publish a Snomio release.

## 1. Prerequisites

1. Ensure you are able to build Snomio - i.e. have all the right repository connections
2. Ensure you are logged into ACR to push the new images in the release-finish stage

## 2. Perform the release

1. Clean check out the `main` branch
2. Run `mvn gitflow:release-start` to start the release process, this will ask for a release version
   and create a new branch for the release
3. Update the CHANGELOG.md, replacing the `[Unreleased]` header with the new version number and date
4. Update the eclrefset project's snomio.auth.version property for the snapshot version
5. Commit the changes
6. Run `mvn clean install` to build, test and deploy/tag the new images in quay.io
7. Run `mvn gitflow:release-finish` to finish the release process, this will
    1. merge the release branch back into `master`
    2. tag the release in git
8. Update the eclrefset project's snomio.auth.version to the new POM version
9. Commit the changes to the eclrefet project

*TODO - update the eclrefset project to be a module of the parent POM to avoid the need for steps 4,
8, and 9*