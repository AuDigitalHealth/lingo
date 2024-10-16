# Lingo security model

## Purpose

This documentation explains the Lingo security model, including the key technology being used,
security features, and configuration.

## Authentication/Authorisation

### Authentication and Authorisation for Lingo

Authentication & Authorization is implemented in Lingo
through [spring security](https://spring.io/projects/spring-security) using cookie
based authentication provided by SNOMED's Identity Managed
Service ([IMS](https://ims.ihtsdotools.org)).

When attempts to login the are redirected to the IMS URL provided in application.properties. After
logging in they are redirected back to Lingo where the cookie specified in application
configuration is checked. These are the relevant configurations, which will change per environment.

```
# Ims url
ihtsdo.ims.api.url=https://dev-ims.ihtsdotools.org
# The name of the cookie
ihtsdo.ims.api.cookie.name=dev-ims-ihtsdo
```

Lingo checks the cookie against the IMS API to determine if the user is authenticated and
authorized to access the application.

To see how this code works,
refer to
the [CookieAuthenticationFilter](../../auth/src/main/java/com/csiro/snomio/auth/security/CookieAuthenticationFilter.java)
and it's use in the
filterChain [SecurityConfiguration](../../api/src/main/java/com/csiro/snomio/security/SecurityConfiguration.java)

### Authentication and Authorisation for onward requests

Once authenticated, the user is able to access the application. For each request to Lingo by a
user, Lingo then forwards the same cookie Authoring Platform and Snowstorm to authenticate and
authorise to the Managed Service.

In this way, searches and updates made by a user via Lingo are made as that user in the Managed
Service and not made ambiguous by a Lingo service account.

## Service Acocunts

Lingo does make use of service accounts. These are used to access the Managed Service APIs, and
are configured in the application.properties file.

One is used to reserve identifiers in the CIS, and the other is used to cache users from the IMS to
reduce load on the IMS.

```
# Service account used to reserve identifiers in the CIS
cis.username=
cis.password=
# Service account used to cache users from the IMS for use in Lingo
ims-username=
ims-password=
```