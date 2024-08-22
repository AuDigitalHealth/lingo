# Snomio

[![App Status](https://ncts-cd.australiaeast.cloudapp.azure.com/api/badge?name=snomio-dev&revision=true&showAppName=true)](https://ncts-cd.australiaeast.cloudapp.azure.com/applications/snomio-dev) [![App Status](https://ncts-cd.australiaeast.cloudapp.azure.com/api/badge?name=snomio-uat&revision=true&showAppName=true)](https://ncts-cd.australiaeast.cloudapp.azure.com/applications/snomio-uat)

An integration with Snomed International's Authoring Platform that extends functionality to improve
authoring of medicinal terminology.

## Getting Started

To run this project you will need to follow some changes that are listed in [docs/CONFIGURATION.md](/docs/CONFIGURATION.md). If you do not follow the set up in CONFIGURATION.md, the following steps will not be able to run the application.

//TODO: This needs to be changed when this is opensourced

The ECL Refset Tool UI requires an npm package published to a registry in the aehrc Azure DevOps
organization.
To install you will need to setup credentials in your user `.npmrc` file to
[connect to the aehrc-npm feed](https://dev.azure.com/aehrc/ontoserver/_artifacts/feed/aehrc-npm/connect).

After you have followed these steps, to run the application:

```
cd ui
npm install
npm run dev
cd api
mvn spring-boot:run
```

From there you navigate to `WHATEVER_YOU_SET.ihtsdotools.org`

To build you will need to pass ims-username and ims-password as VM arguments eg

```
mvn clean package -Dims-username=myusername -Dims-password=mypassword
```

## Dependencies & Technologies

For a list of the major dependencies and technologies please read [here](/docs/design/technologies.md).

For a detailed list of dependencies please view [here](https://github.com/aehrc/snomio/network/dependencies).

## Roadmap

Snomio 1.1.1 was cut in August 2024, from there the intential is to improve functionality as the opportunity/need arises.

There is intention to build out the solution for other jurisdictions. 

For a detailed look at what is planned please go [here](https://github.com/orgs/aehrc/projects/17/views/4)
## License

This project uses the Apache License 2.0.

To read more on it see [LICENSE](./LICENSE)

## Contributing

Contributions are always welcome!

See [contributing.md](./contributing.md) for ways to get started.

## Code of conduct

Please adhere to this project's [code_of_conduct.md](./code_of_conduct.md).

## Design

For more information on the design of Snomio see the [design documentation](./docs/DESIGN.md).

## Deployment and Configuration

For more information on how to deploy and configure Snomio see
the [deployment](./docs/DEPLOYMENT.md) and [configuration](./docs/CONFIGURATION.md) documentation.

## User guide

A basic [user guide](./docs/USERGUIDE.md) is available to orientate new users.

## Contact

The primary source of contact for issues/bug reporting is this repo.

For security issues please contact <ontoserversupport@csiro.au>.

To report any harassment or innapropriate behaviour within the project please contact <ontoserversupport@csiro.au>.

## Credits

Snomio was designed and developed for the Australian Digital Health Agency, and in collaboration with CSIRO and SNOMED International.