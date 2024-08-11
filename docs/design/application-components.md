# Snomio Application Components

## Purpose

The purpose of this document is to provide an overview of the key components of the Snomio
application, and how they relate to each other. This is intended to provide a high-level
understanding of the application architecture for developers who are new to the project, or who are
looking to understand the overall structure of the system.

## Key Components

TODO diagram with Snomio, Ticket management, Snowstorm client, OWL toolkit, Sergio, ECL
reference set calculation, persistence layer. Should also show data store and data flow between
components.

TODO: describe each component in more detail

```mermaid
C4Context
    title Applicaton component diagram for Snomio

    Enterprise_Boundary(ext, "Other") {
        System(hpp, "HPP")
        System(artg, "ARTG")
    }

    Enterprise_Boundary(csiro, "CSIRO") {
        Person(ta,"Terminology Analyst")
        Person(amt_ta,"AMT Terminology Analyst")
        System(sergio, "Sergio")

        SystemDb_Ext(snomiodb,"Ticket Database")

        System(snomio, "Snomio")

        BiRel(amt_ta, snomio, "")
        Rel(snomio, snomiodb, "")
        Rel(sergio, snomio, "")
    }

    Enterprise_Boundary(si, "SNOMED International") {
        System(ims, "Identity Management Service")
        System(cis, "Component Identifier Service")
        SystemDb(cisdb,"Identifier database")
        System(as, "Authoring Service")
        System(authoring, "Authoring Platform")
        System(snowstorm, "Snowstorm")
        SystemDb_Ext(elastic,"Elasticsearch")
        Rel(snowstorm, elastic, "")
        Rel(snowstorm, cis, "")
        Rel(authoring, snowstorm, "")
        Rel(authoring, as, "")
        Rel(as, snowstorm, "")
        Rel(cis, cisdb, "")
    }

    BiRel(ta, authoring, "")
    BiRel(amt_ta, authoring, "")
    Rel(snomio, ims, "")
    Rel(snomio, as, "")
    Rel(snomio, cis, "")
    Rel(sergio, ims, "")
    Rel(snomio, snowstorm, "")
    Rel(sergio, hpp, "")
    Rel(sergio, artg, "")

    UpdateLayoutConfig($c4ShapeInRow="6", $c4BoundaryInRow="1")
```


```mermaid
C4Context


title "Ticket Management - Component Diagram"


Enterprise_Boundary(csiro, "CSIRO") {


    Container_Boundary(tms, "Snomio Api") {
        Component(ticketController, "TicketController", "Spring Mvc Rest controller", "Provides api interface for ticket management")
        Component(ticketService, "TicketService", "Java Spring Bean", "Handles ticket creation, updates, and queries")
        Component(ticketRepository, "Ticket Repository", "Java Spring Data JPA", "Manages ticket data access")


    }

    SystemDb(snomioDb, "Snomio db", "Stores snomio application data")
    Container(snomioUi, "Snomio UI", "Snomio User interface")
    Container(sergioService, "Sergio Service", "Scheduled TGA import process")
}

    System_Ext(amtApi, "Amt Api Service", "Amt Service used by amt team")

    Rel(ticketController, ticketService, "Uses")
    Rel(ticketService, ticketRepository, "Persist")
    Rel(ticketRepository, snomioDb, "Reads/Writes")

    Rel(snomioUi, ticketController, "Sends ticket management queries")

    Rel(sergioService, ticketController, "Create/fetch tickets")
    
    Rel(amtApi, ticketController, "Creates Pbs request")
    
    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="3")

```