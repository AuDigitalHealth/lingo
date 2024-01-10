package com.csiro.tickets;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
public class TicketTestBaseContainer extends TicketTestBase {

  @Container
  static PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>(
              DockerImageName.parse("nctsacr.azurecr.io/snomio_test_db:latest")
                  .asCompatibleSubstituteFor("postgres"))
          .withExposedPorts(5432)
          .withEnv("POSTGRES_HOST_AUTH_METHOD", "trust")
          .waitingFor(Wait.forListeningPort());

  @DynamicPropertySource
  static void registerPgProperties(DynamicPropertyRegistry registry) {
    registry.add(
        "spring.datasource.url",
        () ->
            String.format("jdbc:postgresql://localhost:%d/snomio", postgres.getFirstMappedPort()));
    registry.add("spring.datasource.driverClassName", () -> "org.postgresql.Driver");
    registry.add("spring.datasource.username", () -> "postgres");
    registry.add("spring.datasource.password", () -> "");
  }
}
