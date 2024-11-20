# Lingo technologies

## Purpose

Provide an overview of the key technologies used in the Lingo application.

## SNOMED International

### Snowstorm

Snowstorm is an ontology server which is used to read/write SNOMED CT concepts. Snowstorm provides a
branching mechanism - similar to git in ways, that allow author/s to simultaneously author content
separately, and then combine the results after merging any collisions.

Snowstorm provides the bulk of the read/write that is necessary for Lingo to work. Lingo is
essentially an augmented extension of Snowstorm.

All the read/write capabilities that Lingo has comes from Snowstorm - it just builds upon the
base behaviour present in Snowstorm, making it easier for end users to author complex concepts.

### Authoring Platform

Similar to Lingo, the authoring platform provides authoring capabilities for Snowstorm, it again is
powered by Snowstorm, with extensions on top of it to make it easier to author single concepts. It
provides a way to create 'tasks' which point to branches in Snowstorm, then makes it possible to
author content.

The authoring platform also offers other necessities for the authoring workflow, such as the ability
to run a classification, and validation on the concepts that are to be created within a 'task' or
branch.

Lingo leans on the Authoring Platform for a few things.

- Promotion of 'tasks' or branches into the mainline so they can be included in a release.
- An interface for the resolution of authoring difference between 'tasks' or branches
- The ability to review and approve changes made by another user on a 'task' or branch
- The ability to author content that is out of the teams regular workflow - that is to author
  content that doesn't follow the pattern of products that they usually author.

### Identity Management Service (IMS)

The identity provider for Lingo and the before mentioned tools. This is a wrapper around Atlassian
Crowd.

This authenticiation and authorisation mechanism is used for Snowstorm and the Authoring Platform,
and is adopted by Lingo to provide seamless Single Sign On and interoperability between the
platforms.

The IMS is a cookie-based authentication mechanism, where cookies with the `.ihtsdotools` domain are
passed around to provide the users' credentials.

### CIS

The Concept Identifier Service is used to pre-allocate concept identifiers, which makes it possible
to bulk create concepts in the authoring platform.
This is used to reduce the amount of time it takes to create the required concepts for newly
authored medicines.

The CIS is ran and mainteneded by ihtsdo.

## Lingo

### API

##### Spring Boot

Spring Boot is a popular framework for building Java-based enterprise applications. It's used in
Lingo to simplify the development process and provide a robust foundation for the application. Key
features include:

- Auto-configuration: Spring Boot automatically configures your application based on the
  dependencies you've added, reducing boilerplate code.
- Embedded server: It comes with an embedded web server (Tomcat), making it easy to deploy and run
  the application.
  Production-ready features: Includes metrics, health checks, and externalized configuration out of
  the box, which are used extensively in Lingo.

In Lingo, Spring Boot handles the web layer, security, and integration with other components like
JPA and Postgres.

#### Spring Data JPA

The Lingo application layer uses Spring Data JPA to interact with the database. Spring Data JPA is
a part of the larger Spring Data project, which aims to simplify data access in Spring applications.

- Map Java objects to database tables (Object-Relational Mapping or ORM)
- Provide a query language that allows you to retrieve data using Java rather than SQL
- Handle database operations and transactions
- Repository interfaces for common CRUD operations
- Ability to define custom queries using method names
- Pagination and sorting support

#### RabbitMQ

Lingo provides RabbitMQ as an option (this can be ignored entirely if it is not essential for your
use case) as a way to queue searches within the ticket database. The code for this can be
found [here](../../sergio-extension/).

- Asynchronous processing of ticket search requests
- Prevents system overload during peak search periods
- Message queues act as buffers between search requests and database operations
- Support for multiple search consumers to handle requests in parallel
- Dead letter queues for handling failed search operations
- Message persistence to prevent data loss during system failures
- Ability to prioritize certain types of search requests
- Built-in monitoring and management interface
- Scalable architecture for handling growing search volumes
- Message acknowledgment to ensure reliable delivery
- Queue-specific TTL (Time To Live) for search requests
- Load balancing of search operations across multiple consumers
- Circuit breaker pattern support for graceful degradation

#### Postgres

PostgreSQL (often called Postgres) is an advanced, open-source relational database system. In
Lingo, it's used as the primary data store. Key features relevant to Lingo might include:

- ACID compliance: Ensures data integrity and reliability
- Support for complex queries
- Full-text search capabilities
- Scalability
- JSON support: Used within Lingo for the authoring of Products and allows users to store arbitrary
  structured data on tickets

#### Maven

Lingo uses Maven as a build automation tool for Java projects.

#### Swagger

Swagger is a tool that helps developers design, build, document, and consume RESTful web services.
It's used in Lingo to provide a user-friendly interface for documenting the API.

#### Docker

Docker is a platform for developing, shipping, and running applications in containers. Lingo uses
Docker to package the application and its dependencies into a container that can be run on any
system with Docker installed.

### UI

#### React

React is a popular JavaScript library for building user interfaces, particularly single-page
applications. Key features and aspects of React in Lingo are:

- Component-Based Architecture: React allows developers to create reusable UI components, which is
  particularly useful for building complex interfaces like those needed for medical terminology
  management, particularly in the authoring forms.
- Rendering the user interface for browsing and searching SNOMED CT concepts
- Managing forms for creating or editing medical terminology
- Displaying complex hierarchical data structures in an intuitive manner
- Providing interactive features for tasks like concept authoring or review processes

#### NPM

NPM is the package manager for JavaScript. It's used in Lingo to manage front-end dependencies and
build scripts.

#### TypeScript

TypeScript is a superset of JavaScript that adds static typing to the language. It's used in Lingo
to
provide type safety and improve code quality in the front-end codebase.

#### Cypress

Cypress is an end-to-end testing framework for web applications. It's used in Lingo to automate
testing of the user interface.