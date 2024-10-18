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
package au.gov.digitalhealth.lingo;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
public class RabbitTestBase {

  public static final String RABBITMQ_CONTAINER_ALIAS = "rabbitmq";
  private static final String RABBITMQ_PASSWORD = "password";
  private static final String RABBITMQ_USER = "user";
  private static Network network;

  @Container
  @SuppressWarnings("resource")
  static RabbitMQContainer rabbitMQContainer =
      new RabbitMQContainer(DockerImageName.parse("rabbitmq:3-management"))
          .withEnv("RABBITMQ_DEFAULT_USER", RABBITMQ_USER)
          .withAdminPassword(RABBITMQ_PASSWORD)
          .withExposedPorts(5672, 15672)
          .withNetwork(network)
          .withNetworkAliases(RABBITMQ_CONTAINER_ALIAS)
          .waitingFor(
              new org.testcontainers.containers.wait.strategy.LogMessageWaitStrategy()
                  .withRegEx(".*Server startup complete.*\\n"));

  @DynamicPropertySource
  static void registerPgProperties(DynamicPropertyRegistry registry) {
    registry.add(
        "spring.rabbitmq.port", () -> String.valueOf(rabbitMQContainer.getMappedPort(5672)));
    registry.add("spring.rabbitmq.host", () -> "localhost");
    registry.add("spring.rabbitmq.username", () -> RABBITMQ_USER);
    registry.add("spring.rabbitmq.password", () -> RABBITMQ_PASSWORD);
  }
}
