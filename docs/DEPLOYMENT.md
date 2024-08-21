# Deployment Guide

## Purpose

This document covers deployment considerations and details including

- infrastructure requirements
- deployment overview (diagram with explanatory text)
- required operations and maintenance procedures
- monitoring
- backup
- disaster recovery

This is intended to document deployment of the software in general to help plan a new deployment or
update a deployment if a new version of the software is released that changes deployment
requirements. It does not document not the specifics of any particular deployment.

## Infrastructure requirements

Snomio is a reasonable lightweight application, and consists of two parts

- the ticketing system
- the product authoring features

### Deployment form

Snomio is built as a Docker image which is available as `amd64` and `arm64` for deployment on either
architecture.

### Disk requirements

Snomio has very little disk requirement as a container, and aside from storing attachments for
tickets requires minimal disk and no backups.

For ticket attachments Snomio requires a persistent volume mount with sufficient disk space to store
the projected size of attachments your tickets will require. Snomio does store single copies of
unique files, so that if the same file is attached to multiple tickets only one copy will be stored
to minimise disk use.

### Database

Snomio requires a database to store ticket data and metadata. The database required is Postgres,
which may be a container, cloud platform service, or externally hosted server.

Database size is relative to the number of tickets you intend to store. For reference a database
with 50,000 tickets is ~700MB.

## External Dependencies

To deploy Snomio you will need

- A SNOMED International Managed Service instance, specifically
    - Snowstorm
        - used to search and update terminology content
    - Authoring Service
        - used to search and create Authoring Platform Tasks
    - IMS
        - used to authenticate and authorise users, and authenticate to Managed Service interfaces
    - CIS
        - used to allocated identifiers for bulk concept creation requests - Snomio will fall back
          to sequential concept creation if this is not present
- An Ontoserver instance
    - used to accelerate search response time by getting fast responses from Ontoserver for released
      content and combining that with requests to Snowstorm for unreleased content

Optionally you can deploy a name generator. Snomio supports an SPI it calls when new names are
required for a new concept. If you have a name generator that implements this SPI it can be plugged
into Snomio, however Snomio will work without the additional name generator it just won't generate
suggested names for new concepts.

Any serious deployment of Snomio will use a reverse proxy in front of Snomio for security and
SSL/TLS (Snomio does not do SSL/TLS itself). Often deployed in terms of a Kubernetes cluster this is
achieved using an ingress controller.

## Deployment overview

The diagram below shows the main components in the deployment and how they are connected.
<!-- @formatter:off -->


```mermaid
graph TB
    NGINX[NGINX Reverse Proxy]
    Snomio[Snomio System]
    DB[(Postgres Database)]
    AttachmentStore[(External Attachment Store)]
    Sergio[Sergio]
    NameGen[NameGenerator]
    AuthoringPlatform[Authoring Platform]
    Snowstorm[Snowstorm Ontology Server]
    TGAFeed[Tga Data Feed]
    
    NGINX --> Snomio
    NGINX --> Ontoserver
    NGINX --> Snowstorm
    NGINX --> AuthoringPlatform
    Snomio --> DB
    Snomio --> AttachmentStore
    Snomio --> NameGen
    Sergio --> Snomio
    Sergio --> TGAFeed
    Snomio <--> AuthoringPlatform
    Snomio <--> Snowstorm
    Snomio <--> CIS
    CIS <--> Snowstorm
    AuthoringPlatform <--> Snowstorm
    
    classDef system fill: #f9f, stroke: #333, stroke-width: 2px;
    classDef external fill: #bbf, stroke: #333, stroke-width: 2px;
    classDef database fill: #dfd, stroke: #333, stroke-width: 2px;
    classDef user fill: #fdb, stroke: #333, stroke-width: 2px;
    classDef proxy fill: #ff9, stroke: #333, stroke-width: 2px;
    class Snomio,Sergio,NameGen system;
    class AuthoringPlatform,Snowstorm,TGAFeed,Ontoserver,CIS external;
    class DB,AttachmentStore database;
    class NGINX proxy;
```

Snomio uses a reverse proxy to make it easier to talk to snowstorm & the authoring platform without having cors errors.

If you wanted to see how a basic setup looks like with docker-compose, one is available at [docker/docker-compose.yaml](../docker/docker-compose.yaml)
<!-- @formatter:on -->

## Operations and maintenance procedures

## Deploying upgrades

Deploying upgrades of Snomio is achieved by simply deploying a new Docker image and restarting the
container. Snomio uses [Flyway](https://flywaydb.org) to forward migrate the database schema with
any required changes on boot.

To ensure that rollback is simple, a database backup should be taken before deploying a new
version - Snomio does not have a feature to roll back any migrations it has done in deployment.

## Monitoring

Monitoring can be inplemented in multiple ways, and Snomio has a few ways in which this can be achieved.

The most basic of all Snomio exposes the base endpoints from [Springs Boots actuator](https://www.baeldung.com/spring-boot-actuators). To run a health check on Snomios integrations you can send a GET request to the endpoint snomio_location/api/status, which will return json in the format

```
{
    "authoringPlatform": {
        "running": boolean,
        "version": string
    },
    "snowstorm": {
        "running": boolean,
        "version": string,
        "effectiveDate": string
    },
    "cis": {
        "running": boolean,
        "version": string
    }
}
```

These endpoints can be used whoever you please to enable monitoring.

Snomio also makes it easy to use [OpenTelemetry](https://opentelemetry.io/) , this can be configured in application.properties

```
snomio.telemetry.enabled=boolean
snomio.telemetry.zipkinendpoint=your_endpoint
snomio.telemetry.otelendpoint=your_endpoint
```

In a real deployment, something like kubernetes will likely be used which can be uses to greatly enhance monitoring. Our deployment uses a combination of grafana and OpenTelemetry to provide easy to use and detailed logs. How this is set up will not be explained here.


## Backup

Snomio has no in built backup system, all backups are the responsibility of the deployer. The only recommendation is to create a backup before deploying a new version, as even though all new versions should not be data destroying it's safer to err on the side of caution.

There is no recommendation for periodic backups, that is the end user decision.

## Disaster recovery

Rollback the database to the latest working configuration. Restart (although this should not be necassary) the application container.