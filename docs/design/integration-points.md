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
The below graph System Context Diagram displays the basic interactions between a user and the systems, and there interactions between eachother.

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
    AuthoringPlatform <-->|Queries/Updates ontology| Snowstorm

    classDef system fill:#f9f,stroke:#333,stroke-width:2px;
    classDef external fill:#bbf,stroke:#333,stroke-width:2px;
    classDef database fill:#dfd,stroke:#333,stroke-width:2px;
    classDef user fill:#fdb,stroke:#333,stroke-width:2px;

    class Snomio,Sergio,NameGen system;
    class AuthoringPlatform,Snowstorm,TGAFeed external;
    class DB,AttachmentStore database;
    class User user;
```

### Name Generator

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
TODO: describe each integration point in more detail including a diagram showing the data flow
between the Snomio application and the external system.