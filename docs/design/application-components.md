# Lingo Application Components

## Purpose

The purpose of this document is to provide an overview of the key components of the Lingo
application, and how they relate to each other. This is intended to provide a high-level
understanding of the application architecture for developers who are new to the project, or who are
looking to understand the overall structure of the system.

## Key Components

```mermaid
C4Context
    title Component diagram for Lingo System

    Enterprise_Boundary(csiro, "CSIRO", $enterpriseBoundaryColor="#800080") {
        Person(ta, "Terminology Analyst")
        Person(amt_ta, "AMT Terminology Analyst")
        System(nameGenerator, "Name Generator")
        System(sergio, "Sergio")
        System(Lingo, "Lingo")
        System(eclRefSet, "Snodine")
        BiRel(amt_ta, Lingo, "")
        UpdateRelStyle(amt_ta, Lingo, "green", "purple", "-10", "-15")
        BiRel(sergio, Lingo, "")
        UpdateRelStyle(sergio, Lingo, "green", "red", "-10", "-15")

        Container_Boundary(c1, "Lingo System") {
            Component(Lingo, "Lingo", "Core application component")
            Component(as, "Authoring Service")
            Component(ticketMgmt, "Ticket Management", "Handles ticket-related operations")
            Component(snowstormClient, "Snowstorm Client", "Interacts with Snowstorm server")
            Component(persistenceLayer, "Persistence Layer", "Manages data persistence")
            SystemDb(Lingodb, "Lingo Db")
            Rel(Lingo, ticketMgmt, "manage tickets")
            UpdateRelStyle(Lingo, ticketMgmt, "green", "red", "-50", "-15")
            Rel(Lingo, snowstorm, "")
            UpdateRelStyle(Lingo, snowstorm, "green", "red", "0", "50")
            Rel(as, snowstormClient, "send ecl queries")
            UpdateRelStyle(as, snowstormClient, "green", "red", "0", "0")
            Rel(as, owlToolkit, "create axiom using")
            UpdateRelStyle(as, owlToolkit, "green", "red", "50", "100")
            BiRel(ticketMgmt, persistenceLayer, "fetch/save tickets")
            UpdateRelStyle(ticketMgmt, persistenceLayer, "green", "red", "-10", "-15")
            BiRel(persistenceLayer, Lingodb, "read/write")
            UpdateRelStyle(persistenceLayer, Lingodb, "green", "red", "-10", "-15")
            BiRel(as, persistenceLayer, "")
            UpdateRelStyle(as, persistenceLayer, "green", "red", "-10", "-15")
        }
    }
    Enterprise_Boundary(si, "SNOMED International") {
        System(ims, "Identity Management Service")
        System(cis, "Component Identifier Service")
        SystemDb(cisdb, "Identifier database")
        System(authoring, "Authoring Platform")
        System(snowstorm, "Snowstorm")
        SystemDb(elastic, "Elasticsearch")
        System(owlToolkit, "OWL Toolkit")
        Rel(snowstorm, elastic, "")
        Rel(snowstorm, cis, "")
        Rel(authoring, snowstorm, "")
        Rel(as, authoring, "")
        UpdateRelStyle(as, authoring, "green", "red", "-20", "-70")
        Rel(cis, cisdb, "")
        Rel(cis, ims, "")
    }
    Enterprise_Boundary(ext, "Other") {
        System_Ext(hpp, "HPP")
        System_Ext(artg, "ARTG")
    }

    UpdateElementStyle(c1, $borderColor="blue", $textColor="red")
    BiRel(ta, authoring, "")
    UpdateRelStyle(ta, authoring, "green", "purple", "-20", "-70")
    BiRel(amt_ta, authoring, "")
    UpdateRelStyle(amt_ta, authoring, "green", "purple", "-20", "-70")
    Rel(Lingo, ims, "")
    UpdateRelStyle(Lingo, ims, "green", "red", "-10", "-15")
    Rel(Lingo, as, "author products")
    UpdateRelStyle(Lingo, as, "green", "red", "-40", "15")
    Rel(as, nameGenerator, "generate names")
    UpdateRelStyle(as, nameGenerator, "green", "red", "-100", "-100")
    Rel(as, snowstormClient, "")
    UpdateRelStyle(as, snowstormClient, "green", "red", "-10", "-15")
    Rel(Lingo, cis, "")
    UpdateRelStyle(Lingo, cis, "green", "red", "-10", "-15")
    Rel(sergio, ims, "authenticate via")
    UpdateRelStyle(sergio, ims, "green", "red", "-10", "-15")
    Rel(sergio, hpp, "")
    UpdateRelStyle(sergio, hpp, "green", "red", "0", "0")
    Rel(sergio, artg, "fetch")
    UpdateRelStyle(sergio, artg, "green", "red", "200", "-5")
    Rel(snowstormClient, snowstorm, "")
    UpdateRelStyle(snowstormClient, snowstorm, "green", "red", "0", "0")
    Rel(amt_ta, eclRefSet, "tick and flick refsets")
    UpdateRelStyle(amt_ta, eclRefSet, "green", "purple", "5", "-70")
    Rel(eclRefSet, snowstorm, "build and store query ref set")
    UpdateRelStyle(eclRefSet, snowstorm, "green", "red", "-50", "15")
    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="3")

```

## Ticket management

Lingo has an inbuilt ticket system - a database of tickets with functions to create, update,
comment on, link, and delete tickets.

These features are used from two main locations

1. The Lingo user interface, where users can create, update, and comment on tickets.
2. The Sergio import process, which creates or modifies tickets based on TGA feeds.

Sergio is a separate process bespoke to Australian needs to manage a set of tickets mirroring a
selected set of products from the Australian Register of Therapeutic Goods (ARTG) database. However
generally it can be thought of as an automated import system the interacts with the same API as a
user would via the Lingo UI.

## Snowstorm client

Generated from Snowstorms OpenAPI documentation, this client is a generated Java client library used
by Lingo to communicate with Snowstorm for read and write operations.

## OWL toolkit

The OWL Toolkit is a library that enables conversion between SNOMED CT's tabular relationships
format and OWL, and vice versa. Lingo use it to generate axioms that are then fed into the name
generator.

## Sergio

The Sergio process handles TGA feeds, creating or modifying the relevant tickets for each ARTG ID in
the Lingo database. This synchronisation process keeps a set of tickets reflecting the priority
order products from the ARTG database to add to AMT. External requests for specific products are
managed as "up votes" for the product, which are then used to prioritise the creation of new
products.

## Snodine

Snodine is a subpart of Lingo initially aimed at supporting authors to create ECL definitions for
reference sets. These ECL definitions are stored in the Simple Query Specification Reference Set
and can be edited by users on a task and promoted.

Snodine also has a batch process which runs overnight or on request, that synchronises the state of
the reference sets' members with the ECL and state of the terminology on a branch, usually the main
project branch. This allows authors to create and maintain reference sets based on ECL queries,
without needing to manually maintain the members of the reference set as they develop content.

The UI in Lingo has been further enhanced to support maintenance of "tick and flick" or "pick and
mix" reference sets, where the author simply adds and removes members from the reference set
manually.

## Name generator

Lingo supports an SPI used during the authoring phase to generate product names. This API is called
with the OWL axiom for a new product and returns suggested preferred terms and fully specified
names. If the name generator is not available, Lingo will use a default message indicating the
generated name is unavailable. This will prevent the product from being created until a name is
specified manually.

This SPI is intended to allow for the integration of external name generation services.