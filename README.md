# Snomio
An integration with Snomed International's Authoring Platform that extends functionality to improve authoring of medicinal terminology.

To run this project 

cookies for the .ihtsdotools domain are only shared one the same domain so you will need to
add snomio.ihtsdotools.org & snomio-api.ihtsdotools.org to your /etc/hosts file

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
