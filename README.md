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
## Deployment environment for reference
```mermaid
C4Context
    title High level Snomio Deployment Environment

    Person(developer, "Developer", "NCTS Developer or DevOps person")

    System_Boundary(github, "GitHub repositories") {
        Container(snomioRepo, "Snomio Repository", "Source Code", "https://github.com/aehrc/snomio", $link="https://github.com/aehrc/snomio")
        Container(sergioRepo, "Sergio Repository", "Source Code", "https://github.com/aehrc/sergio")
        Container(nctsArgoRepo, "NCTS ArgoCD repository", "GitOps code", "https://github.com/aehrc/ncts-argo")
        Container_Boundary(nctsHelmRepo, "NCTS Helm source repository") {
            Container(nctsHelmRepoContainer, "Git repository", "Helm Charts", "https://github.com/aehrc/ncts-helm")
            Container(nctsHelmGitHubActions, "GitHub Actions", "Build/Deploy")
        }
    }

    System_Boundary(aci, "Azure Cloud Infrastructure") {
        Container(azuredevops, "Azure DevOps CI/CD Pipelines")
        Container(acr, "NCTS Azure Container Registry", "Docker images and Helm charts", "nctsacr.azurecr.io")
        
        Container_Boundary(nctsaks, "Azure Kubernetes Cluster") {
            Container_Boundary(snomiodevns, "Snomio DEV Namespace") {
                Container(snomiodev, "Snomio DEV", "https://dev-snomio.ihtsdotools.org/")
                Container(sergiodev, "Sergio DEV", "sergio-dev-service in k8s")
            }
            Container_Boundary(snomiouatns, "Snomio UAT Namespace") {
                Container(snomiouat, "Snomio UAT", "https://uat-snomio.ihtsdotools.org/")
                Container(sergiouat, "Sergio UAT", "sergio-uat-service in k8s")
            }
            Container_Boundary(argocdns, "ArgoCD Namespace") {
                Container(argoCD, "ArgoCD GitOps Tool")
            }
        }
        Container_Boundary(nctsprodaks, "Production Azure Kubernetes Cluster") {
            Container_Boundary(snomioprodns, "Snomio Prod Namespace") {
                Container(snomioprod, "Snomio Prod", "https://snomio.ihtsdotools.org/")
                Container(sergioprod, "Sergio Prod", "sergio-service in k8s")
            }
        }
    }

    Rel(developer, snomioRepo, "Pushes changes")
    Rel(developer, sergioRepo, "Pushes changes")
    Rel(developer, nctsArgoRepo, "Pushes changes")
    Rel(developer, nctsHelmRepoContainer, "Pushes changes")

    Rel(snomioRepo, azuredevops, "CI Build")
    Rel(sergioRepo, azuredevops, "CI Build")
    Rel(nctsHelmGitHubActions, acr, "Builds and Pushes Helm Charts")
    
    Rel(azuredevops, acr, "Builds and Pushes Images")
    Rel(azuredevops, nctsArgoRepo, "Updates Image References")
    
    Rel(acr, argoCD, "Pulls Released Helm Charts and Docker Images")
    Rel(nctsArgoRepo, argoCD, "Pulls Changes")
    Rel(nctsHelmRepoContainer, argoCD, "Pulls Helm Charts")

    Rel(argoCD, snomiodev, "Deploys Application")
    Rel(argoCD, sergiodev, "Deploys Application")
    Rel(argoCD, snomiouat, "Deploys Application")
    Rel(argoCD, sergiouat, "Deploys Application")
    Rel(argoCD, snomioprod, "Deploys Application")
    Rel(argoCD, sergioprod, "Deploys Application")

    UpdateElementStyle(snomioRepo, $bgColor="green", $borderColor="green")
    UpdateElementStyle(sergiodev, $bgColor="grey", $borderColor="gray")
    UpdateElementStyle(sergiouat, $bgColor="grey", $borderColor="gray")
    UpdateElementStyle(sergioprod, $bgColor="grey", $borderColor="gray")
    UpdateElementStyle(sergioRepo, $bgColor="grey", $borderColor="gray")

    UpdateRelStyle(developer, snomioRepo, "green", "red", "10", "-20")
    UpdateRelStyle(developer, nctsHelmRepoContainer, "green", "red", "25", "120")
    UpdateRelStyle(developer, nctsArgoRepo, "green", "red", "-80", "-40")
    UpdateRelStyle(nctsHelmRepoContainer, argoCD, "green", "red", "-140", "-40")
    UpdateRelStyle(acr, argoCD, "green", "red", "-140", "-340")
    UpdateRelStyle(nctsArgoRepo, argoCD, "green", "red", "-60", "40")
    UpdateRelStyle(snomioRepo, azuredevops, "green", "red", "-370", "20")
    UpdateRelStyle(sergioRepo, azuredevops, "", "", "-200", "20")
    UpdateRelStyle(nctsHelmGitHubActions, acr, "green", "red", "-170", "40")
    UpdateRelStyle(azuredevops, nctsArgoRepo, "green", "red", "-60", "20")
    UpdateRelStyle(argoCD, snomiodev, "green", "red", "-60", "20")
    UpdateRelStyle(argoCD, snomiouat, "green", "red", "-80", "20")
    UpdateRelStyle(argoCD, snomioprod, "green", "red", "-110", "20")
```
