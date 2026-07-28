<#--

    Freemarker template for THIRD_PARTY_NOTICES.md.
    Rendered by org.codehaus.mojo:license-maven-plugin (aggregate-add-third-party).
    DO NOT edit the generated THIRD_PARTY_NOTICES.md by hand - edit this template.

    Binding provided by the plugin:
      dependencyMap : iterable of Map.Entry<MavenProject, List<License>>

-->
<#function licenseFormat licenses>
    <#assign result = ""/>
    <#list licenses as license>
        <#assign result = result + "(" + license + ") "/>
    </#list>
    <#return result?trim>
</#function>
<#-- Tally how many dependencies use each licence string -->
<#assign tally = {}/>
<#list dependencyMap as e>
    <#assign key = licenseFormat(e.getValue())/>
    <#if tally[key]??>
        <#assign tally = tally + { key : tally[key] + 1 }/>
    <#else>
        <#assign tally = tally + { key : 1 }/>
    </#if>
</#list>
# Third-Party Notices

This file is **generated** by the build - do not edit it by hand. The backend
(Java) sections are produced by `license-maven-plugin` from the resolved Maven
dependency tree (edit `src/license/third-party-notices.ftl` to change them); the
frontend (npm) section is appended from `ui/third-party-notices-npm.md`. A CI
check fails the build if the backend sections drift from the committed file.

Snomio ("the Software") is licensed under the Apache License, Version 2.0 (see
`LICENSE`). The Software is distributed (as a container image) together with the
unmodified third-party components listed below, each of which remains under its
own licence. Components are aggregated as separate JARs (backend) or bundled by
the web build (frontend) - none is modified, shaded or statically linked into
Snomio's own code.

Only components that are actually distributed are listed here; backend test-,
build- and provided-scope dependencies are excluded.

## Licence summary - Backend (Java)

| Licence(s) | Components |
| ---------- | ---------: |
<#list tally?keys?sort as k>
| ${k} | ${tally[k]} |
</#list>

## Copyleft components - source availability

The following components carry file- or library-level copyleft obligations
(LGPL / EPL / MPL). They are distributed **unmodified** as separate JARs, so the
obligation is satisfied by (a) preserving their licences (reproduced in `LICENSE`)
and (b) this written offer: the corresponding source for the exact version shipped
is available from the component's project below. Snomio makes no modifications to
these components; if you require the source we relied on, request it via the
project's issue tracker referenced in `README.md`.

<#list dependencyMap as e>
    <#assign project = e.getKey()/>
    <#assign licenses = licenseFormat(e.getValue())/>
    <#if licenses?contains("LGPL") || licenses?contains("Lesser") || licenses?contains("Eclipse Public License") || licenses?contains("MPL")>
- **${project.name}** (`${project.groupId}:${project.artifactId}:${project.version}`) - ${licenses} - <${(project.url)!"no URL declared"}>
    </#if>
</#list>

## Backend (Java) components

<#list dependencyMap as e>
    <#assign project = e.getKey()/>
- ${licenseFormat(e.getValue())} **${project.name}** (`${project.groupId}:${project.artifactId}:${project.version}`) - <${(project.url)!"no URL declared"}>
</#list>
