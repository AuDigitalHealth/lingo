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

    title Component diagram for Snomio System

    Enterprise_Boundary(csiro, "CSIRO",$enterpriseBoundaryColor="#800080") {
        Person(ta,"Terminology Analyst")
        Person(amt_ta,"AMT Terminology Analyst")
        System(nameGenerator, "Name Generator")
        System(sergio, "Sergio")
        System(snomio, "Snomio")
        System(eclRefSet, "Snodine")

        BiRel(amt_ta, snomio, "")
        UpdateRelStyle(amt_ta,snomio, "green", "purple", "-10", "-15")

        BiRel(sergio, snomio, "")
        
        UpdateRelStyle(sergio,snomio, "green", "red", "-10", "-15")

        Container_Boundary(c1, "Snomio System") {
            Component(snomio, "Snomio", "Core application component")
            Component(as, "Authoring Service")
            Component(ticketMgmt, "Ticket Management", "Handles ticket-related operations")
            Component(snowstormClient, "Snowstorm Client", "Interacts with Snowstorm server")
            Component(persistenceLayer, "Persistence Layer", "Manages data persistence")
            SystemDb(snomiodb,"Snomio Db")

            Rel(snomio, ticketMgmt, "manage tickets")
            UpdateRelStyle(snomio,ticketMgmt, "green", "red", "-50", "-15")

            Rel(snomio, snowstorm, "")
            UpdateRelStyle(snomio,snowstorm, "green", "red", "0", "50")

            Rel(as, snowstormClient, "send ecl queries")
            UpdateRelStyle(as,snowstormClient, "green", "red", "0", "0")

            Rel(as, owlToolkit, "create axiom using")
            UpdateRelStyle(as,owlToolkit, "green", "red", "50", "100")

            BiRel(ticketMgmt, persistenceLayer, "fetch/save tickets")
            UpdateRelStyle(ticketMgmt,persistenceLayer, "green", "red", "-10", "-15")

            BiRel(persistenceLayer, snomiodb, "read/write")
            UpdateRelStyle(persistenceLayer,snomiodb, "green", "red", "-10", "-15")
        }
    }
    Enterprise_Boundary(si, "SNOMED International") {
        System(ims, "Identity Management Service")
        System(cis, "Component Identifier Service")
        SystemDb(cisdb,"Identifier database")
        System(authoring, "Authoring Platform")
        System(snowstorm, "Snowstorm")
        SystemDb(elastic,"Elasticsearch")
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

    UpdateElementStyle(c1,  $borderColor="blue", $textColor="red")

    BiRel(ta, authoring, "")
    UpdateRelStyle(ta, authoring, "green", "purple", "-20", "-70")

    BiRel(amt_ta, authoring, "")
    UpdateRelStyle(amt_ta, authoring, "green", "purple", "-20", "-70")

    Rel(snomio, ims, "")
    UpdateRelStyle(snomio, ims, "green", "red", "-10", "-15")

    Rel(snomio, as, "author products")
    UpdateRelStyle(snomio, as, "green", "red", "-40", "15")

    Rel(as, nameGenerator, "generate names")
    UpdateRelStyle(as, nameGenerator, "green", "red", "-100", "-100")

    Rel(as, snowstormClient, "")
    UpdateRelStyle(as, snowstormClient, "green", "red", "-10", "-15")

    Rel(snomio, cis, "")
    UpdateRelStyle(snomio, cis, "green", "red", "-10", "-15")

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
Manages ticket handling within the Snomio system, including creating and updating tickets in the Snomio database. Tickets may also be modified by the Sergio import process.

## Snowstorm client
Functions as a client code layer to interact with SNOMED Snowstorm from the Snomio backend system. ECL queries from Snomio are processed through this client, supporting GET, POST, PUT, and DELETE operations.

## OWL toolkit
The OWL Toolkit is a library that enables conversion between SNOMED CT's tabular relationships format and OWL, and vice versa. Snomio use it to generate axioms that are then fed into the name generator.

## Sergio
The Sergio process handles TGA feeds, creating or modifying the relevant tickets for each ARTG ID in the Snomio database.

## Snodine
This is where the ECL Refset Tool comes in, allowing users to build queries for reference sets and save them against concepts within Snowstorm. While Snowstorm doesn't process these concepts directly, Snodine's overnight process identifies all of these refset concepts and reruns their queries. It then compares the updated list of concepts to the existing tick-and-flick refset, adding any newly created concepts and removing those that have been deactivated. As a result, the query-based refsets are converted into tick-and-flick style refsets, which can be accessed using RT2, and are maintained by Snodine's overnight process.

## Name generator

The Name Generator is an SPI server used during the authoring phase to generate product names based on a trained model and a given input set, which includes axioms and other relevant data.