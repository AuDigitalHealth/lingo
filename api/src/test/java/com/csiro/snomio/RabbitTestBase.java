package com.csiro.snomio;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
public class RabbitTestBase {

  private static final String RABBITMQ_PASSWORD = "password";
  private static final String RABBITMQ_USER = "user";
  public static final String RABBITMQ_CONTAINER_ALIAS = "rabbitmq";
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
