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

To deploy Snomio you will need

- A Postgres database
    - used by the ticket system to store ticket data and metadata
- A volume mount for the Snomio container
    - used by the ticket system to store ticket attachement files
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

## Deployment overview

## Operations and maintenance procedures

## Monitoring

## Backup

## Disaster recovery