/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets;

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
  @SuppressWarnings("resource")
  static PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>(
              DockerImageName.parse("quay.io/aehrc/snomio_test_db:v1")
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
