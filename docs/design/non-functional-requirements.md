# Key non-functional requirements

## Purpose

The purpose of this document is to provide a list of key non-functional requirements for the Snomio.
This is not an exhaustive list, but rather a high-level overview of the key requirements which have
guided the design and development of the application.


Performance — Searching for and creating content should be reasonably quick - this is a bottleneck that we encountered early with our use of snowstorm, and the use of member of (^) ecl queries, to combat this we started to simultaneously use ontoserver alongside snowstorm, using ontoserver to query existing content - that is content that has already been released, and using snowstorm to query content that has not yet been published in a release. This significantly speeds up the ability of users to search for existing content.

Regulatory — There is a requirement for clinicial safety in the authoring of Australian Medicical Terminology, and adherance to this is enhanced through the use of validations on created concepts, and the fact that authoring within snomio is essentially on rails, and it is difficult to make new terminology that doesn't follow the existing rules.

All authored content must also go through a review process, and be cross checked by another author increasing the likely hood that content is authored correctly.

Security - Only AMT team members can author content. This is enabled through the use of the IMS as our auth model, so users within snowstorm are the same users within snomio.

Scalability - Scalability needs are low - as there is a low quantity of authors.

Traceability - All actions taken by a user, whethere they be on tickets in the 'backlog' or the authoring of content are tied to a user, so actions taken can be traced to by whom and when.

Compatibility - Only a web browser was considered as the end user interface, and specifically only one on a desktop, as the AMT team uses managed machines, and they should not be working within snomio off of their managed machine, so that includes their personal devices such as a tablet or phone.