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
        

        BiRel(amt_ta, snomio, "")
        UpdateRelStyle(amt_ta,snomio, "green", "purple", "-10", "-15")
        
        BiRel(sergio, snomio, "")
        UpdateRelStyle(sergio,snomio, "green", "red", "-10", "-15")
        
        Container_Boundary(c1, "Snomio System") {
            Component(snomio, "Snomio", "Core application component")
            Component(as, "Authoring Service")
            Component(ticketMgmt, "Ticket Management", "Handles ticket-related operations")
            Component(eclRefSet, "Snodine", "ECL Reference Set Calculation")

            Component(snowstormClient, "Snowstorm Client", "Interacts with Snowstorm server")
            Component(persistenceLayer, "Persistence Layer", "Manages data persistence")
            SystemDb(snomiodb,"Snomio Db")

            Rel(snomio, ticketMgmt, "manage tickets")
            UpdateRelStyle(snomio,ticketMgmt, "green", "red", "-10", "-15")
            
            Rel(snomio, snowstormClient, "send ecl queries")
            UpdateRelStyle(snomio,snowstormClient, "green", "red", "-30", "100")



            Rel(as, owlToolkit, "create axiom using")
            UpdateRelStyle(as,owlToolkit, "green", "red", "-70", "20")


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
        UpdateRelStyle(as, authoring, "green", "purple", "-20", "-70")


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
    UpdateRelStyle(snomio, as, "green", "red", "-40", "-15")


    Rel(as, nameGenerator, "generate names")
    UpdateRelStyle(as, nameGenerator, "green", "red", "-100", "-70")


    Rel(as, snowstormClient, "")
    UpdateRelStyle(as, snowstormClient, "green", "red", "-10", "-15")
    
    Rel(snomio, cis, "")
    UpdateRelStyle(snomio, cis, "green", "red", "-10", "-15")
    
    
    Rel(sergio, ims, "authenticate via")
    UpdateRelStyle(sergio, ims, "green", "red", "-10", "-15")
    
    Rel(sergio, hpp, "")
    UpdateRelStyle(sergio, hpp, "green", "red", "0", "0")
    
    Rel(sergio, artg, "reads")
    UpdateRelStyle(sergio, artg, "green", "red", "0", "10")

    Rel(snowstormClient, snowstorm, "")
    UpdateRelStyle(snowstormClient, snowstorm, "green", "red", "0", "0")

    Rel(amt_ta, eclRefSet, "tick and flick refsets")
    UpdateRelStyle(amt_ta, eclRefSet, "green", "purple", "-20", "-70")
    
    Rel(eclRefSet, snowstorm, "build and store query reference set")
    UpdateRelStyle(eclRefSet, snowstorm, "green", "red", "-150", "50")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="3")

```


