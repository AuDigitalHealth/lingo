# Key non-functional requirements

## Purpose

The purpose of this document is to provide a list of key non-functional requirements for the Lingo application.
This is not an exhaustive list, but rather a high-level overview of the key requirements which have
guided the design and development of the application.

Throughout this document to keep things generic "NRC", "your NRC", etc will be used to reference the users team, and their teams terminology.

## Performance

Searching for and creating content should be reasonably quick - this is a bottleneck that was
encountered early with use of Snowstorm, and the use of member of (^) ECL queries.

To combat this bottleneck three strategies were employed:

- caching of search results
    - caching has been implemented in the Lingo front end and back end to reduce the number of
      requests made to Snowstorm
    - Snowstorm's ECL query cache was enabled
- enhanced version of Snowstorm
    - a new version of Snowstorm was produced with an update to optimise performance of member of
      ECL queries
- use of Ontoserver
    - to further enhance search performance, Ontoserver has been used alongside Snowstorm.
      Ontoserver is used to query existing content, and Snowstorm is used to query content that has
      not yet been published in a release. This significantly speeds up the ability of users to
      search for existing content.

## Regulatory

There is (or might be) a requirement for clinicial safety in the authoring of the NRC's medical terminology,
and adherence to this is enhanced through the use of validation on created concepts, and the fact
that authoring within Lingo is essentially on rails. These combine to make creating new terminology
that doesn't follow the existing rules very difficult and detectable.

All authored content must also go through a review process, and be cross-checked by another author
increasing the likelihood that content is authored correctly.

## Security

Only NRC team members can author content. The Managed Service IMS is used to implement this, by
Lingo looking for and requiring the same authorisation in the user's token as required by the
Managed Service to author content in the NRC's projects in the Managed Service.

## Scalability

Scalability needs are low - as there is a low quantity of authors.

## Traceability

All actions taken by a user, whether they be on tickets in the 'backlog' or the
authoring of content, are tied to a user so actions taken can be traced to who made the changes and when.

## Compatibility

Only a web browser was considered as the end user interface, and specifically only
one on a desktop, as the NRC that was the application was originally built for uses managed machines. Personal devices such as tablets or
phones have not been specifically catered for.
