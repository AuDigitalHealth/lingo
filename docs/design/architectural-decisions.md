# Architecture Decisions

## Purpose

This document provides a list of key architectural decisions and goals which guided and continue to
guide development of the Lingo application.

## Key Goals

- Lightweight addon application to the Managed Service
- Use Managed Service features and services wherever possible
- Seamless integration with Managed Service
- Only replicate Managed Service in the user interface features where necessary
- Low maintenance and hosting cost
- Technology comfortable to the team and SNOMED International for the best chance of sharing and
  collaboration

## Key Decisions

### Technology stack

To remain consistent with other SNOMED International products and the development team's skills,
the following technology stack was chosen:

- Spring Boot based application for the backend
- React based frontend
- Postgres database
- Docker for deployment
- Kubernetes for orchestration

### Use Managed Service features

Rather than reinventing the wheel, the application should use Managed Service features wherever
possible. This includes:

- Authoring Service
- Snowstorm
- IMS
- CIS

Where possible the user is guided to the Managed Service, with linking in the UI to the relevant
Managed Service pages. Where not possible, the application should replicate the Managed Service
features in the UI as simply as possible using the Managed Service APIs.

### Use Managed Service Authentication and Authroisation

To achieve seamless integration with the Managed Service, the simplest method is to use the Managed
Service's authentication and authorisation mechanisms. This allows the application to use the same
user accounts and permissions as the Managed Service, and reduces the complexity of the application
and improves user experience moving between the applications with Single Sign On.

### Use ihtsdotools.org domain

As a constraint of the Managed Service authentication and authorisation and CORS policies, the
application must be hosted on the ihtsdotools.org domain to operate smoothly with the Managed
Service.

### Separate workflow logic from modelling/persistence logic

The application should separate the workflow logic from the modelling and persistence logic. This
allows for easier testing and maintenance of the application.

### Separate externalisable services

Where possible the application should separate externalisable services from the main application.
This includes:

- Name generation
- Import adapters from external sources

For this reason Lingo provides a SPI for name generation, and exposes APIs for importing data from
external sources (e.g. Sergio for TGA feeds).

This allows these components to be replaced or updated without needing to update the main
application. It also allows for easy testing of these components in isolation.

Finally this allows for these components to be swapped out in different deployments, for example
using a different name generation service in different environments.

### Use Managed Service Task system

The application integrates to and users the Managed Service Task system for workflow management
rather than impose its own. This allows for easy integration and seamless interoperation from a user
perspective with the Managed Service and its workflows.

### Ticket based authoring

The application orientates authoring around "tickets". These are used to represent a unit of work,
typically a product from an external registry (i.e. the Australian Register of Therapeutic Goods),
or requests from stakeholders.

Tickets can be associated with, and implemented within the context of a Managed Service Task.

### Persistence in terminology server where possible - tickets a notable exception

Where possible the application should persist data in the Managed Service, in the terminology
server. This reduces the sources of truth and need for synchronisation between systems.

Tickets are a notable exception to this rule, as they are not terminology content and have no
logical place in the terminology server.

### Audited data changes

Outside of Snowstorm which has its own audit system, the application should audit all changes to
data. This allows for easy tracking of changes and debugging of issues.

### REST APIs

The application should expose REST APIs based in JSON. This allows for easy integration with other
systems and tools.

### Facilitate cloud based deployment

Given the application is intended to be a lightweight addon to the Managed Service, it should be
easy to deploy in a cloud environment.

### Backup and recovery

Where possible the application should be designed to be resilient to failure and easy to recover
from failure. This includes:

- Regular backups
- Monitoring
- Disaster recovery planning

Where possible the application should be engineered to lean into infrastructure (e.g. Kubernetes)
and cloud provider's services for these features.

### Reusability across different models

The application should be designed to be reusable across different models, but applying the same
workflow and pattern. This allows for easy reuse of the application for different models.