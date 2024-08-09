# Snomio integration points

## Purpose

This documentation provides an overview of the integration points between the Snomio application and
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

```mermaid
graph TB
    User((User))
    Snomio[Snomio System]
    DB[(Snomio Database)]
    AttachmentStore[(External Attachment Store)]
    Sergio[Sergio]
    NameGen[NameGenerator]
    AuthoringPlatform[Authoring Platform]
    Snowstorm[Snowstorm Ontology Server]
    TGAFeed[Tga Data Feed]

    User -->|Uses UI to create tickets and author products| Snomio
    Snomio -->|Stores product & ticket data| DB
    Snomio -->|Stores attachments| AttachmentStore
    Snomio -->|Generates Product Names| NameGen
    Sergio -->|Updates tickets| Snomio
    Sergio -->|Reads Feed| TGAFeed
    User -->|Authors products| AuthoringPlatform
    Snomio <-->|Interacts with| AuthoringPlatform
    Snomio <-->|Queries/Updates ontology| Snowstorm
    Snomio -->|UI queries for fast concept search/selection| Ontoserver
    AuthoringPlatform <-->|Queries/Updates ontology| Snowstorm

    classDef system fill:#f9f,stroke:#333,stroke-width:2px;
    classDef external fill:#bbf,stroke:#333,stroke-width:2px;
    classDef database fill:#dfd,stroke:#333,stroke-width:2px;
    classDef user fill:#fdb,stroke:#333,stroke-width:2px;

    class Snomio,Sergio,NameGen,Ontoserver system;
    class AuthoringPlatform,Snowstorm,TGAFeed external;
    class DB,AttachmentStore database;
    class User user;
```

### Name Generator

The name generator is quite simple, we send a request with what is in NameGeneratorSpec.java, and
get returned a string with a generated name.

```mermaid
graph LR
    Snomio((Snomio))
    NameGenerator[[Name Generator]]
    
    Snomio -->|1. owlAxiom| NameGenerator
    NameGenerator -->|2. Product Name String| Snomio
    
    style Snomio fill:#f9f,stroke:#333,stroke-width:2px
    style NameGenerator fill:#bbf,stroke:#333,stroke-width:2px
```

### Sergio

```mermaid
graph TD
    TGA[TGA Feed]
    Sergio((Sergio System))
    Snomio[Snomio]
    DB[(Snomio Database)]

    TGA -->|1. Item data with ARTG ID| Sergio
    Snomio -->|2. Field definitions| Sergio
    Sergio -->|3. Query tickets by ARTG ID| Snomio
    Snomio -->|4. Ticket existence/data| Sergio
    Sergio -->|5. Create/Update tickets| Snomio
    Snomio -->|6. Store tickets| DB

    subgraph Sergio Process
        direction TB
        Process[Process TGA items]
        CheckExistence[Check ticket existence]
        CreateUpdate[Create new or Update existing ticket]
        Process --> CheckExistence
        CheckExistence --> CreateUpdate
    end

    style TGA fill:#bbf,stroke:#333,stroke-width:2px
    style Sergio fill:#f9f,stroke:#333,stroke-width:2px
    style Snomio fill:#fda,stroke:#333,stroke-width:2px
    style DB fill:#bfb,stroke:#333,stroke-width:2px
    style Process fill:#ffe,stroke:#333,stroke-width:2px
    style CheckExistence fill:#ffe,stroke:#333,stroke-width:2px
    style CreateUpdate fill:#ffe,stroke:#333,stroke-width:2px
```

### Authoring Platform

#### Tasks

Snomio uses the concepts of tasks within the authoring platform to enable the authoring of content.
Snomio can create tasks within the authoring platform, and retrieve a list of existing tasks & there
status'.

These tasks are then associated to a ticket - which contains information for authoring.

The tasks can then have content authored on them, and be assigned to users for review, and have
classification and validation ran against them.

These tasks have a 'key' which point to a branch in snowstorm that has content authored against it,
to read about that jump to the [Snowstorm Section](#snowstorm)

// TODO: I cannot figure out how to change the flow of this and the next diagram?

```mermaid
graph TB
    subgraph Snomio Process
        direction TB
        GetTasks[Get tasks from AP]
        CreateTasks[Create tasks in AP]
        AssociateTasks[Associate tasks with tickets]
        Classify[Run classification]
        Validate[Run validation]
        AssignReviewer[Assign reviewer]
    end
    
    AP[Authoring Platform]
    Snomio((Snomio))
    User[User]
    
    AP -->|1. Tasks| Snomio
    Snomio -->|2. Create tasks| AP
    Snomio -->|3. Associate task to ticket| AP
    Snomio -->|4. Run classification| AP
    Snomio -->|5. Run validation| AP
    User -->|3. Associate task to ticket| Snomio
    User -->|4. Run classification| Snomio
    User -->|5. Run validation| Snomio
    User -->|6. Assign reviewer| Snomio
    
    style AP fill:#bbf,stroke:#333,stroke-width:2px
    style Snomio fill:#f9f,stroke:#333,stroke-width:2px
    style User fill:#fda,stroke:#333,stroke-width:2px
    
```

### Snowstorm

#### Snowstorm Search Concepts

Users search concepts through snomio to use as a basis for authoring, or to just view the make up of
that medication. We use two servers to achieve this - snowstorm for concepts authored since the last
published release, and ontoserver for all content including and before the last published release.

```mermaid
graph TB
    subgraph Snomio Process
        direction TB
        ReceiveSearch[Receive search query]
        QueryOntoserver[Query Ontoserver]
        QuerySnowstorm[Query Snowstorm]
        CombineResults[Combine search results]
    end
    
    User[User]
    Snomio((Snomio))
    Ontoserver[Ontoserver]
    Snowstorm[Snowstorm]
    
    User -->|1. Search concept| Snomio
    Snomio -->|2a. Search query| Ontoserver
    Snomio -->|2b. Search query| Snowstorm
    Ontoserver -->|3a. Concepts from previous releases| Snomio
    Snowstorm -->|3b. New concepts since last release| Snomio
    Snomio -->|4. Combined search results| User
    
    style User fill:#fda,stroke:#333,stroke-width:2px
    style Snomio fill:#f9f,stroke:#333,stroke-width:2px
    style Ontoserver fill:#bbf,stroke:#333,stroke-width:2px
    style Snowstorm fill:#bfb,stroke:#333,stroke-width:2px
    style ReceiveSearch,QueryOntoserver,QuerySnowstorm,CombineResults fill:#ffe,stroke:#333,stroke-width:2px
```

#### Author Concepts

Users author concepts through snomio - which talks to snowstorm and authors them within there, users
can then search these concepts in snomio once the task has been promoted.

```mermaid
graph TB
    subgraph Snomio Process
        direction TB
        ReceivePayload[Receive ProductCreationDetails]
        CalculateConcepts[Calculate concepts to create]
        CreateConcepts[Create concepts in Snowstorm]
        SaveDetails[Save ProductCreationDetails to ticket]
        Create7BoxModel[Create 7 box model]
    end
    
    User[User]
    Snomio((Snomio))
    Snowstorm[Snowstorm]
    
    User -->|1. Send ProductCreationDetails| Snomio
    Snomio -->|2. Create concepts| Snowstorm
    Snowstorm -->|3. Return created concepts| Snomio
    Snomio -->|4. Return 7 box model| User
    
    
    style User fill:#fda,stroke:#333,stroke-width:2px
    style Snomio fill:#f9f,stroke:#333,stroke-width:2px
    style Snowstorm fill:#bbf,stroke:#333,stroke-width:2px
```

### Ontoserver

#### Ontoserver Search Concepts

See [Snowstorm Search Concepts](#snowstorm-search-concepts)

### Component Identifier Service

Periodically reserves concept id's to speed up the process when a user goes to author a product - as
id's have already been reserved they can be passed to snowstorm in the create request, enabling the
bulk creation of new concepts that reference eachother.
