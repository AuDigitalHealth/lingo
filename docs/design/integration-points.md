# Lingo integration points

## Purpose

This documentation provides an overview of the integration points between the Lingo application and
external systems including:

- the name generation SPI
- the Snowstorm terminology server
- the OWL toolkit
- the Sergio service
- the Authoring Platform
- the Component Identifier Service
- Ontoserver

### Overview

The below graph System Context Diagram displays the basic interactions between a user and the
systems, and there interactions between eachother.

<!-- @formatter:off -->
```mermaid
graph TB
    User((User))
    Lingo[Lingo System]
    DB[(Lingo Database)]
    AttachmentStore[(External Attachment Store)]
    Sergio[Sergio]
    NameGen[NameGenerator]
    AuthoringPlatform[Authoring Platform]
    Snowstorm[Snowstorm Ontology Server]
    TGAFeed[Tga Data Feed]
    User -->|Uses UI to create tickets and author products| Lingo
    Lingo -->|Stores product & ticket data| DB
    Lingo -->|Stores attachments| AttachmentStore
    Lingo -->|Generates Product Names| NameGen
    Sergio -->|Updates tickets| Lingo
    Sergio -->|Reads Feed| TGAFeed
    User -->|Authors products| AuthoringPlatform
    Lingo <-->|Interacts with| AuthoringPlatform
    Lingo <-->|Queries/Updates ontology| Snowstorm
    Lingo -->|UI queries for fast concept search/selection| Ontoserver
    Lingo <-->|Allocate identifiers| CIS
    CIS <-->|Allocate identifiers| Snowstorm
    AuthoringPlatform <-->|Queries/Updates ontology| Snowstorm
    classDef system fill: #f9f, stroke: #333, stroke-width: 2px;
    classDef external fill: #bbf, stroke: #333, stroke-width: 2px;
    classDef database fill: #dfd, stroke: #333, stroke-width: 2px;
    classDef user fill: #fdb, stroke: #333, stroke-width: 2px;
    class Lingo,Sergio,NameGen system;
    class AuthoringPlatform,Snowstorm,TGAFeed,Ontoserver,CIS external;
    class DB,AttachmentStore database;
    class User user;
```
<!-- @formatter:on -->

### Name Generator

The name generator is quite simple. Lingo sends a request containing an OWL axiom with SNOMED
Identifiers replaced with names of the concepts. The name generator responds with a suggested
preferred term and fully specified name for the concept.

```mermaid
graph LR
    Lingo((Lingo))
    NameGenerator[[Name Generator]]
    Lingo -->|1 . owlAxiom| NameGenerator
    NameGenerator -->|2 . Product Name String| Lingo
    style Lingo fill: #f9f, stroke: #333, stroke-width: 2px
    style NameGenerator fill: #bbf, stroke: #333, stroke-width: 2px
```

### Sergio

Sergio is an external service that manages a set of tickets mirroring a selected set of products
from
the Australian Register of Therapeutic Goods (ARTG) database. It is used to create or modify the
relevant tickets for each ARTG ID in the Lingo database.

While out of scope for Lingo's documentation, it is a good example of how an externalised process
can be used to manage a set of tickets as an adaptor based on an external feed using Lingo's API.

```mermaid
graph TD
    TGA[TGA Feed]
    Sergio((Sergio System))
    Lingo[Lingo]
    DB[(Lingo Database)]
    TGA -->|1 . Item data with ARTG ID| Sergio
    Lingo -->|2 . Field definitions| Sergio
    Sergio -->|3 . Query tickets by ARTG ID| Lingo
    Lingo -->|4 . Ticket existence/data| Sergio
    Sergio -->|5 . Create/Update tickets| Lingo
    Lingo -->|6 . Store tickets| DB

    subgraph Sergio Process
        direction TB
        Process[Process TGA items]
        CheckExistence[Check ticket existence]
        CreateUpdate[Create new or Update existing ticket]
        Process --> CheckExistence
        CheckExistence --> CreateUpdate
    end

    style TGA fill: #bbf, stroke: #333, stroke-width: 2px
    style Sergio fill: #f9f, stroke: #333, stroke-width: 2px
    style Lingo fill: #fda, stroke: #333, stroke-width: 2px
    style DB fill: #bfb, stroke: #333, stroke-width: 2px
    style Process fill: #ffe, stroke: #333, stroke-width: 2px
    style CheckExistence fill: #ffe, stroke: #333, stroke-width: 2px
    style CreateUpdate fill: #ffe, stroke: #333, stroke-width: 2px
```

### Authoring Platform

#### Tasks

Lingo uses the concepts of tasks within the authoring platform to enable the authoring of content.
Basic functions are pulled through to the Lingo user interface so users can create tasks within the
authoring platform, and retrieve a list of existing tasks & their status', without needing to leave
the Lingo UI.

To author content, tickets in Lingo's ticket database reflecting the work to be done are associated
with a task and authored on that task. These tickets contain information required for authoring.

Once content has been authored these tasks can have classification and validation ran against them,
and can be assigned to other users for review.

Tasks have a 'key' which point to a branch in Snowstorm that has content authored against it,
to read about that jump to the [Snowstorm Section](#snowstorm)

```mermaid
graph TB
    AP[Authoring Platform]
    Lingo((Lingo))
    User[User]
    AP <--> Lingo
    User <--> Lingo
    style AP fill: #bbf, stroke: #333, stroke-width: 2px
    style Lingo fill: #f9f, stroke: #333, stroke-width: 2px
    style User fill: #fda, stroke: #333, stroke-width: 2px
```

### Snowstorm

#### Snowstorm Search Concepts

Users search concepts through Lingo to use as a basis for authoring, or to just view the make up of
that medication.

To work around performance constrains in Snowstorm, Lingo uses a combination of Snowstorm and
Ontoserver to provide a fast search experience. This is achieved by using Ontoserver to search for
concepts that have been released, and Snowstorm for concepts that have been authored since the last
release.

These are search concurrently and the results are combined to provide a single search result to the
user.

```mermaid
graph TB
    User[User]
    Lingo((Lingo))
    Ontoserver[Ontoserver]
    Snowstorm[Snowstorm]
    User -->|1 . Search concept| Lingo
    Lingo -->|2a . Search query| Ontoserver
    Lingo -->|2b . Search query| Snowstorm
    Ontoserver -->|3a . Concepts from previous releases| Lingo
    Snowstorm -->|3b . New concepts since last release| Lingo
    Lingo -->|4 . Combined search results| User
    style User fill: #fda, stroke: #333, stroke-width: 2px
    style Lingo fill: #f9f, stroke: #333, stroke-width: 2px
    style Ontoserver fill: #bbf, stroke: #333, stroke-width: 2px
    style Snowstorm fill: #bfb, stroke: #333, stroke-width: 2px
```

#### Author Concepts

Lingo is designed to calculate the set of concepts, their descriptions, reference set members, and
modelling required to represent a product.

Once a user confirms the proposed set of concepts to create, Lingo uses Snowstorm's bulk concept
creation APIs to create the concepts as quickly as possible.

```mermaid
graph TB
    User[User]
    Lingo((Lingo))
    Snowstorm[Snowstorm]
    User -->|1 . Send ProductCreationDetails| Lingo
    Lingo -->|2 . Create concepts| Snowstorm
    Snowstorm -->|3 . Return created concepts| Lingo
    Lingo -->|4 . Return 7 box model| User
    style User fill: #fda, stroke: #333, stroke-width: 2px
    style Lingo fill: #f9f, stroke: #333, stroke-width: 2px
    style Snowstorm fill: #bbf, stroke: #333, stroke-width: 2px
```

### Ontoserver

#### Ontoserver Search Concepts

See [Snowstorm Search Concepts](#snowstorm-search-concepts)

### Component Identifier Service

To use Snowstorm's bulk concept creation APIs, Lingo needs to allocate identifiers for the concepts
it is creating. This is done by the Component Identifier Service (CIS). If the CIS is not available,
Lingo will fall back to sequential concept creation.

```mermaid
graph TB
    Lingo((Lingo))
    CIS[Component Identifier Service]
    Snowstorm[Snowstorm]
    Lingo -->|1 . Allocate identifiers| CIS
    CIS -->|2 . Return identifiers| Lingo
    Lingo -->|3 . Create concepts| Snowstorm
    style Lingo fill: #f9f, stroke: #333, stroke-width: 2px
    style CIS fill: #bbf, stroke: #333, stroke-width: 2px
    style Snowstorm fill: #bfb, stroke: #333, stroke-width: 2px
```
