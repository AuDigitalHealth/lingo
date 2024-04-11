package com.csiro.snomio.configuration;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import io.prometheus.client.CollectorRegistry;
import io.prometheus.client.spring.boot.EnablePrometheusEndpoint;

@SpringBootApplication(scanBasePackages = {"com.csiro.snomio", "com.csiro.tickets"})
@EnablePrometheusEndpoint
@EnableConfigurationProperties
@ConfigurationPropertiesScan(basePackages = {"com.csiro.snomio", "com.csiro.tickets"})
@EntityScan("com.csiro")
@ComponentScan(basePackages = {"com.csiro.snomio", "com.csiro.tickets"})
@EnableJpaRepositories(basePackages = {"com.csiro.snomio", "com.csiro.tickets"})
public abstract class Configuration {}
