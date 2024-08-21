# Snomio security model

## Purpose

This documentation explains the Snomio security model, including the key technology being used,
security features, and configuration.

### Authentication/Authorization

Authentication & Authorization is implemented in Snomio through [spring security](https://spring.io/projects/spring-security) using cookie based authentication provided by SNOMED's Identity Managed Service ([IMS](https://ims.ihtsdotools.org)).

When attempts to login the are redirected to the ims url provided in application.properties, after logging in they are redirected back to snomio where there cookie by the name of what is provided in application.properties is checked. These are the relevant configurations, which will change per environment.

```
# Ims url
ihtsdo.ims.api.url=https://dev-ims.ihtsdotools.org
# The name of the cookie
ihtsdo.ims.api.cookie.name=dev-ims-ihtsdo
```

Each request to snomio sends a request to the ims, to validate the user and get their credentials. To see how this code works, look [here](../../auth/src/main/java/com/csiro/snomio/auth/security/CookieAuthenticationFilter.java) and it's use in the filterChain [here](../../api/src/main/java/com/csiro/snomio/security/SecurityConfiguration.java)
