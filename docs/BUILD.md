# Build Guide

This document provides instructions on how to build, package, and deploy the Snomio application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building the Application](#building-the-application)
  - [Build the UI](#build-the-ui)
  - [Build the API](#build-the-api)
- [Packaging the Application](#packaging-the-application)
  - [Option 1: Running as a Standalone Application](#option-1-running-as-a-standalone-application)
  - [Option 2: Running with Docker Compose](#option-2-running-with-docker-compose)
- [Configuration](#configuration)
  - [Application Properties](#application-properties)
  - [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
  - [PostgreSQL Setup](#postgresql-setup)
- [External Services](#external-services)

---

## Prerequisites

- **Java Development Kit (JDK) 11 or higher**
- **Node.js and NPM**
- **Maven**
- **Docker and Docker Compose**
- **PostgreSQL database**
- **Access to necessary external services:**
  - **IMS (Identity Management Service)**
  - **Other SNOMED International services as required**

## Building the Application

### Build the UI

Navigate to the `ui` directory:

```bash
cd ui
```

Install dependencies:

```bash
npm install
```

Build the UI assets:

```bash
npm run build
```

This will generate production-ready assets in the `dist` directory.

### Build the API

Navigate to the `api` directory:

```bash
cd ../api
```

Build the API using Maven:

```bash
mvn clean package -DskipTests
```

This will create an executable JAR file in the `target` directory.

## Packaging the Application

### Option 1: Running as a Standalone Application

You can run the application directly using the Spring Boot executable JAR:

```bash
java -jar target/snomio-api.jar
```

Ensure that all necessary configurations are provided either via `application.properties` or environment variables.

### Option 2: Running with Docker Compose

You can deploy Snomio locally using Docker Compose, which sets up all required services including the database, Elasticsearch, and the Snomio application itself.

#### Prerequisites for Docker Compose

- **Docker and Docker Compose installed on your machine**
- **Access to the Docker registry containing the required images**

#### Steps to Run Snomio with Docker Compose locally

1. **Update `/etc/hosts`**

   Add the following entries to your `/etc/hosts` file to map the required domains to `localhost`:

   ```
   127.0.0.1 snomio.ihtsdotools.org
   127.0.0.1 snomio-api.ihtsdotools.org
   ```

   **Note**: Editing the `/etc/hosts` file may require administrative privileges.

2. **Docker Registry Login**

   If the Docker images are hosted in a private registry, log in using the Docker CLI:

   ```bash
   docker login your-docker-registry.com
   ```

   Replace `your-docker-registry.com` with the actual registry URL.

3. **Prepare Attachments Directory (Optional)**

   If you have attachment files that the application needs to access:

   - Create a directory named `files/attachments` in the project root.
   - Place your attachment files inside this directory.

   The directory structure should look like:

   ```
   ./files/attachments/1
   ./files/attachments/2
   ...
   ```

   **Note**: The application will run without these files, but certain features may not function correctly.

4. **Update the Docker Compose File**

   The `docker-compose.yaml` file contains configuration for all services. You need to update the image reference for the `snomio` service.

   - Open `docker-compose.yaml` in a text editor.
   - Locate the `image` line under the `snomio` service.
   - Replace the placeholder with the actual image name you want to run.

   Example:

   ```yaml
   snomio:
     image: your-docker-registry.com/snomio:latest
     # ... rest of the configuration
   ```

5. **Update PostgreSQL Image (Optional)**

   If you need to update the PostgreSQL image:

   - Obtain the latest `snomio-jira-export` file.
   - Place it in the current directory.
   - Update it to create the user `snomioapi` and grant full rights to the `snomio` database.
   - Build it using the provided `Dockerfile`.
   - Push it to the Docker registry as `snomio_postgres_db:latest`.

#### Docker Compose File Overview

Below is the `docker-compose.yaml` file with sensitive information replaced by placeholders:

```yaml
version: '3.2'
services:
  db:
    image: your-docker-registry.com/snomio_postgres_db:latest
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    environment:
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5431:5432"
    networks:
      elastic:
        aliases:
          - db

  elasticsearch:
    image: your-docker-registry.com/elasticsearch:latest
    container_name: elasticsearch
    environment:
      - xpack.security.enabled=false
      - node.name=snowstorm
      - cluster.name=snowstorm-cluster
      - "ES_JAVA_OPTS=-Xms4g -Xmx4g"
    volumes:
      - elastic:/usr/share/elasticsearch/data
    networks:
      elastic:
        aliases:
          - es
    healthcheck:
      test: [ "CMD", "curl", "-f", "http://es:9200" ]
      interval: 1s
      timeout: 1s
      retries: 60
    ports:
      - "127.0.0.1:9200:9200"
    mem_reservation: 4g

  snowstorm:
    image: snomedinternational/snowstorm:latest
    container_name: snowstorm
    restart: always
    depends_on:
      elasticsearch:
        condition: service_healthy
    entrypoint: java -Xms2g -Xmx4g --add-opens java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED -cp @/app/jib-classpath-file org.snomed.snowstorm.SnowstormApplication --elasticsearch.urls=http://es:9200
    networks:
      elastic:
        aliases:
          - snowstorm
    ports:
      - "8080:8080"

  snomio:
    depends_on:
      db:
        condition: service_healthy
    container_name: snomio
    image: your-docker-registry.com/snomio:latest  # Replace with your actual image
    environment:
      - server.port=8090
      - JDK_JAVA_OPTIONS=-Xmx16g
      - spring.datasource.url=jdbc:postgresql://db/snomio
      - spring.datasource.username=postgres
      - spring.profiles.active=default
      - security.enable-csrf=false
      - spring.flyway.locations=classpath:db/migration/postgresql
      - spring.flyway.user=postgres
      - ims-username=YOUR_IMS_USERNAME
      - ims-password=YOUR_IMS_PASSWORD
      - ihtsdo.ap.projectKey=AUAMT
      - ihtsdo.ap.defaultBranch=MAIN/SNOMEDCT-AU/AUAMT
      - ihtsdo.ims.api.url=https://dev-ims.ihtsdotools.org
      - ihtsdo.ims.api.cookie.name=dev-ims-ihtsdo
      - ihtsdo.ims.api.cookie.value=
      - ihtsdo.base.api.url=https://dev-au-authoring.ihtsdotools.org
      - ihtsdo.snowstorm.api.url=http://snowstorm:8080
      - ihtsdo.ap.api.url=https://dev-au-authoring.ihtsdotools.org/authoring-services
      - snomio.attachments.directory=/opt/data/attachments
      - caching.spring.usersTTL=3600000
    ports:
      - "8081:8090"
    networks:
      elastic:
        aliases:
          - snomio
    volumes:
      - ./files/attachments:/opt/data

  nginx:
    image: nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
      - ./nginx/key.pem:/root/ssl/key.pem
      - ./nginx/cert.pem:/root/ssl/cert.pem
    ports:
      - "443:443"
    depends_on:
      - snomio
    networks:
      elastic:
        aliases:
          - nginx

networks:
  elastic:

volumes:
  elastic:
```

**Important**: Replace placeholders like `your-docker-registry.com`, `YOUR_IMS_USERNAME`, and `YOUR_IMS_PASSWORD` with your actual values.

#### Notes on Docker Compose Configuration

- **Elasticsearch and Snowstorm**: These services are required for the Snomio application to function correctly.
- **Database (PostgreSQL)**: The `db` service uses a custom image. Ensure this image is available in your Docker registry.
- **Nginx**: Acts as a reverse proxy. SSL certificates (`key.pem` and `cert.pem`) should be placed in the `./nginx/` directory.
- **Volumes**: The `attachments` directory is mounted into the `snomio` container to provide access to attachment files.

#### Running the Application

Execute docker compose up command to start the services:

```bash
docker-compose up -d
```

or run only the snomio api from the built jar:

```bash
java -jar target/snomio-api.jar
```

#### Accessing the Application

By default when running with Docker Compose, the application is accessible at:

- **Snomio Application**: `https://snomio.ihtsdotools.org` (configured via Nginx)
- **API Endpoint**: `https://snomio-api.ihtsdotools.org`

If your `/etc/hosts` file has the correct entries to map these domains to `localhost`, otherwise use the IP address of the Docker host.

### Application Properties

Since the application runs inside Docker containers, configuration is primarily handled via environment variables specified in the `docker-compose.yaml` file.

### Environment Variables

Key environment variables for the `snomio` service include:

- `IMS_USERNAME`: Your IMS username.
- `IMS_PASSWORD`: Your IMS password.
- `spring.datasource.url`: Database connection URL.
- `spring.datasource.username`: Database username.
- Other application-specific configurations.

## Database Setup

Snomio uses PostgreSQL as its database.

### PostgreSQL Setup

The snomio application requires a db to be setup for it to run. The db can be setup using the provided docker image or by setting up a db manually and creating a user and db for the application. The db should be accessible at `jdbc:postgresql://db/snomio` with username `postgres` and password `postgres`.

## External Services

Ensure that the application can access the required external services:

- **IMS (Identity Management Service)**
- **SNOMED International Services**

You may need to configure network settings or obtain API keys and credentials.

---

**Note**: Replace placeholders like `your-docker-registry.com`, `YOUR_IMS_USERNAME`, `YOUR_IMS_PASSWORD`, and `support@example.com` with actual values relevant to your deployment.
