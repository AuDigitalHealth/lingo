package com.csiro.snomio.extension.sergio.configuration;

import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "snomio.extensions.sergio.enabled", havingValue = "true")
public class CustomRabbitHealthIndicatorConfig {

  @Bean
  public HealthIndicator rabbitHealthIndicatorConsumer(
      ConnectionFactory consumerConnectionFactory) {
    return new AbstractHealthIndicator() {
      @Override
      protected void doHealthCheck(Health.Builder builder) throws Exception {
        try {
          consumerConnectionFactory.createConnection().close();
          builder.up().withDetail("status", "RabbitMQ Consumer is up");
        } catch (Exception e) {
          builder.down().withDetail("error", e.getMessage());
        }
      }
    };
  }

  @Bean
  public HealthIndicator rabbitHealthIndicatorProducer(
      ConnectionFactory producerConnectionFactory) {
    return new AbstractHealthIndicator() {
      @Override
      protected void doHealthCheck(Health.Builder builder) throws Exception {
        try {
          producerConnectionFactory.createConnection().close();
          builder.up().withDetail("status", "RabbitMQ Producer is up");
        } catch (Exception e) {
          builder.down().withDetail("error", e.getMessage());
        }
      }
    };
  }
}
