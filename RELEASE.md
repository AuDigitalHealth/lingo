# How to release an Snomio version

This page contains the steps needed to produce and publish a Snomio release.

## 1. Perform the release

1. Clean check out the `main` branch
2. Run `mvn gitflow:release-start` to start the release process, this will ask for a release version
   and create a new branch for the release
3. Update the CHANGELOG.md, replacing the `[Unreleased]` header with the new version number and date
4. Update the eclrefset project's snomio.auth.version property for the snapshot version
5. Commit the changes
7. Run `mvn gitflow:release-finish -DskipTestProject=true` to finish the release process, this will
    1. merge the release branch back into `main`
    2. tag the release in git
8. Update the eclrefset project's snomio.auth.version to the new POM version
9. Commit the changes to the eclrefet project

*TODO - update the eclrefset project to be a module of the parent POM to avoid the need for steps 4,
8, and 9*

The above will trigger a build on the CI server for the tag which `gitflow:release-finish` will
push. This will build, test and deploy a new image to the container registry.