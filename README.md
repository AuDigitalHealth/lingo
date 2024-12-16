# Lingo

[![App Status](https://ncts-cd.australiaeast.cloudapp.azure.com/api/badge?name=snomio-dev&revision=true&showAppName=true)](https://ncts-cd.australiaeast.cloudapp.azure.com/applications/snomio-dev) [![App Status](https://ncts-cd.australiaeast.cloudapp.azure.com/api/badge?name=snomio-uat&revision=true&showAppName=true)](https://ncts-cd.australiaeast.cloudapp.azure.com/applications/snomio-uat)

An integration with Snomed International's Authoring Platform that extends functionality to improve
authoring of medicinal terminology.

# ⚠️ WARNING

Over the next couple of months this repo will be undergoing a rename to Lingo.

Alongside this a lot of the configuration properties, and routes to files will change from **/snomio** and **.snomio.** to **/lingo** and **.lingo.**

If you intend on contributing, this is likely to affect you.


## Getting Started

To run this project you will need to follow some changes that are listed
in [docs/CONFIGURATION.md](/docs/CONFIGURATION.md). If you do not follow the set up in
CONFIGURATION.md, the following steps will not be able to run the application.

After you have followed these steps, to run the application:

```
cd ui
npm install
npm run dev
cd api
mvn spring-boot:run
```

From there you navigate to `WHATEVER_YOU_SET.ihtsdotools.org` (as specified in CONFIGURATION.md above).

To build you will need to pass ims-username and ims-password as VM arguments, for example:

```
mvn clean package -Dims-username=myusername -Dims-password=mypassword
```

## Dependencies & Technologies

For a list of the major dependencies and technologies please
read [here](/docs/design/technologies.md).

For a detailed list of dependencies please
view [here](https://github.com/aehrc/snomio/network/dependencies).

## License

Snomio is copyright © 2024 Australian Digital Health Agency, and is licensed under the Apache
License, Version 2.0 (the "License");
you may not use Snomio or the content of this repository except in compliance with the License.

You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## Contributing

Contributions are always welcome!

See [contributing.md](./contributing.md) for ways to get started.

## Code of conduct

Please adhere to this project's [code_of_conduct.md](./code_of_conduct.md).

## Design

For more information on the design of Lingo see the [design documentation](./docs/DESIGN.md).

## Deployment and Configuration

For more information on how to deploy and configure Lingo see
the [deployment](./docs/DEPLOYMENT.md) and [configuration](./docs/CONFIGURATION.md) documentation.

## User guide

A basic [user guide](./docs/USERGUIDE.md) is available to orientate new users.
