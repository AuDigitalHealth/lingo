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
package au.gov.digitalhealth.lingo.extension.sergio.configuration;

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
