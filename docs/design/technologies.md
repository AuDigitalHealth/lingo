# Snomio technologies

## Purpose

Provide an overview of the key technologies used in the Snomio application, without going into the implementation details.

### Snowstorm

Snowstorm is an ontology server which is used to read/write SNOMED CT concepts. Snowstorm provides a branching mechanism - similar to git in ways, but different in others that allow author/s to simultaneously author content seperately, and then combine the results after merging any collisions.

Snowstorm provides the bulk of the read/write that is necassary for Snomio to work. Snomio is essentially an augmented extension of snowstorm.

All of the read/write capabilities that Snomio has comes from snowstorm - it just builds upon the base behaviour present in snowstorm, making it easier for end users to author complex concepts.

### Authoring Platform

Similar to Snomio, the authoring platform provides authoring capabilities for snowstorm, it again is powered by snowstorm, with extensions on top of it to make it easier to author single concepts. It provides a way to create 'tasks' which point to branches in snowstorm, then makes it possible to author content, although sometimes tedious especially when content to be authored is quite similar and recurring. 

The authoring platform also offers other necessities for the authoring workflow, such as the ability to run a classification, and validation on the concepts that are to be created within a 'task' or branch.

Snomio leans on the Authoring Platform for a few things. 

- Promotion of 'tasks' or branches into the mainline so they can be included in a release.
- An interface for the resolution of authoring difference between 'tasks' or branches
- The ability to review and approve changes made by another user on a 'task' or branch
- The ability to author content that is out of the teams regular workflow - that is to author content that doesn't follow the pattern of products that they usually author. e.g If a user wanted to create a new unit or measurement.

### IMS

The identity provider for snomio and the before mentioned tools. This is a wrapper around Atlassian Crowd, the authorization mechanism used for Snowstorm and the Authoring Platform is the same as Snomio, and allows for seemless auth between the platforms.

The IMS is a cookie based authentication mechanism, where cookies with the .ihtsdotools domain are passed around to provide the users credentials.


### API

##### Spring Boot
Spring Boot is a popular framework for building Java-based enterprise applications. It's used in Snomio to simplify the development process and provide a robust foundation for the application. Key features include:

- Auto-configuration: Spring Boot automatically configures your application based on the dependencies you've added, reducing boilerplate code.
- Embedded server: It comes with an embedded web server (Tomcat), making it easy to deploy and run the application.
Production-ready features: Includes metrics, health checks, and externalized configuration out of the box, which are used extensively in our deployment of Snomio.

In Snomio, Spring Boot handles the web layer, security, and integration with other components like JPA and Postgres.

#### Spring Data JPA

- Map Java objects to database tables (Object-Relational Mapping or ORM)
- Provide a query language that allows you to retrieve data using Java rather than SQL
Handle database operations and transactions
- Repository interfaces for common CRUD operations
Ability to define custom queries using method names
- Pagination and sorting support

#### Postgres

PostgreSQL (often called Postgres) is an advanced, open-source relational database system. In Snomio, it's used as the primary data store. Key features relevant to Snomio might include:

- ACID compliance: Ensures data integrity and reliability
- Support for complex queries
- Full-text search capabilities
- Scalability
- JSON support: Used within snomio for the authoring of Products and allows users to store arbitrary structured data on tickets

### UI

#### React
React is a popular JavaScript library for building user interfaces, particularly single-page applications. Key features and aspects of React in Snomio are:

- Component-Based Architecture: React allows developers to create reusable UI components, which is particularly useful for building complex interfaces like those needed for medical terminology management, particularly in the authoring forms.
- Rendering the user interface for browsing and searching SNOMED CT concepts
- Managing forms for creating or editing medical terminology
- Displaying complex hierarchical data structures in an intuitive manner
- Providing interactive features for tasks like concept authoring or review processes