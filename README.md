# Snomio
[![App Status](https://ncts-cd.australiaeast.cloudapp.azure.com/api/badge?name=snomio-dev&revision=true&showAppName=true)](https://ncts-cd.australiaeast.cloudapp.azure.com/applications/snomio-dev) [![App Status](https://ncts-cd.australiaeast.cloudapp.azure.com/api/badge?name=snomio-uat&revision=true&showAppName=true)](https://ncts-cd.australiaeast.cloudapp.azure.com/applications/snomio-uat)

An integration with Snomed International's Authoring Platform that extends functionality to improve authoring of medicinal terminology.

To run this project 

cookies for the .ihtsdotools domain are only shared one the same domain so you will need to
add snomio.ihtsdotools.org & snomio-api.ihtsdotools.org to your /etc/hosts file

The ECL Refset Tool UI requires an npm package published to a registry in the aehrc Azure DevOps organization. 
To install you will need to setup credentials in your user `.npmrc` file to 
[connect to the aehrc-npm feed](https://dev.azure.com/aehrc/ontoserver/_artifacts/feed/aehrc-npm/connect).

```
cd ui
npm install
npm run dev
cd api
mvn spring-boot:run
```

To build you will need to pass ims-username and ims-password as VM arguments eg

```
mvn clean package -Dims-username=myusername -Dims-password=mypassword
```

## License

This project uses the Apache License 2.0.

To read more on it see [LICENSE](./LICENSE)

## Contributing

Contributions are always welcome!

See [contributing.md](./contributing.md) for ways to get started.

## Code of conduct

Please adhere to this project's [code_of_conduct.md](./code_of_con:q!duct.md).


```mermaid
C4Context
      title System Context diagram for Snomio
      
      Enterprise_Boundary(ext, "Other") {
        System(hpp, "HPP")
        System(artg, "ARTG")
      }

      Enterprise_Boundary(csiro, "CSIRO") {
        Person(ta,"Terminology Analyst")
        Person(amt_ta,"AMT Terminology Analyst")
        System(sergio, "Sergio")

        SystemDb_Ext(snomiodb,"Ticket Database")

        System(snomio, "Snomio")
        
        BiRel(amt_ta, snomio, "")
        Rel(snomio, snomiodb, "")
        Rel(sergio, snomio, "")
      }

      Enterprise_Boundary(si, "SNOMED International") {
        System(ims, "Identity Management Service")
        System(cis, "Component Identifier Service")
        SystemDb(cisdb,"Identifier database")
        System(as, "Authoring Service")
        System(authoring, "Authoring Platform")
        System(snowstorm, "Snowstorm")
        SystemDb_Ext(elastic,"Elasticsearch")
        Rel(snowstorm, elastic, "")
        Rel(snowstorm, cis, "")
        Rel(authoring, snowstorm, "")
        Rel(authoring, as, "")
        Rel(as, snowstorm, "")
        Rel(cis, cisdb, "")
      }

BiRel(ta, authoring, "")
BiRel(amt_ta, authoring, "")
Rel(snomio, ims, "")
Rel(snomio, as, "")
Rel(snomio, cis, "")
Rel(sergio, ims, "")
Rel(snomio, snowstorm, "")
Rel(sergio, hpp, "")
Rel(sergio, artg, "")

UpdateLayoutConfig($c4ShapeInRow="6", $c4BoundaryInRow="1")
```
## Deployment environment
```mermaid
C4Context
    title Snomio and Sergio Deployment Environment

    Person(developer, "Developer", "NCTS Developer or DevOps person")


    System_Boundary(aci, "Azure Cloud Infrastructure") {
        Container(azuredevops, "Azure DevOps CI/CD Pipelines")
        Container(acr, "Azure Container Registry", "Docker images and Helm charts")
        Container_Boundary(nctsaks, "Azure Kubernetes Cluster") {
            Container_Boundary(snomiodevns, "Snomio DEV Namespace") {
                Container(snomiodev, "Snomio DEV")
                Container(sergiodev, "Sergio DEV")
            }
            Container_Boundary(snomiouatns, "Snomio UAT Namespace") {
                Container(snomiouat, "Snomio UAT")
                Container(sergiouat, "Sergio UAT")
            }
            Container_Boundary(argocdns, "ArgoCD Namespace") {
                Container(argoCD, "ArgoCD GitOps Tool")
            }
        }
        Container_Boundary(nctsprodaks, "Production Azure Kubernetes Cluster") {
            Container_Boundary(snomioprodns, "Snomio Prod Namespace") {
                Container(snomioprod, "Snomio Prod")
                Container(sergioprod, "Sergio Prod")
            }
        }

        Rel(azuredevops, acr, "Builds and Pushes Images")
        Rel(acr, argoCD, "Pulls Released Helm Charts and Docker Images")

        Rel(argoCD, snomiodev, "Deploys Application")
        Rel(argoCD, sergiodev, "Deploys Application")
        Rel(argoCD, snomiouat, "Deploys Application")
        Rel(argoCD, sergiouat, "Deploys Application")
        Rel(argoCD, snomioprod, "Deploys Application")
        Rel(argoCD, sergioprod, "Deploys Application")

    }

    System_Boundary(github, "GitHub repositories") {
        Container(snomioRepo, "Snomio Repository", "Source Code")
        Container(sergioRepo, "Sergio Repository", "Source Code")
        Container(nctsArgoRepo, "NCTS ArgoCD repository", "GitOps code")
        Container_Boundary(nctsHelmRepo, "NCTS Helm source repository") {
            Container(nctsHelmRepo, "Git repository", "Helm Charts")
            Container(nctsHelmGitHubActions, "GitHub Actions", "Build/Deploy")
        }
        Rel(nctsHelmGitHubActions, acr, "Builds and Pushes Helm Charts")
    }

Rel(developer, snomioRepo, "Pushes changes")
Rel(developer, sergioRepo, "Pushes changes")
Rel(developer, nctsArgoRepo, "Pushes changes")
Rel(developer, nctsHelmRepo, "Pushes changes")

Rel(snomioRepo, azuredevops, "CI Build")
Rel(sergioRepo, azuredevops, "CI Build")

Rel(nctsArgoRepo, argoCD, "Monitors Changes")
Rel(nctsArgoRepo, argoCD, "Monitors Changes")
Rel(nctsHelmRepo, argoCD, "Pulls Helm Charts")

Rel(azuredevops, nctsArgoRepo, "Updates Image References")
```
