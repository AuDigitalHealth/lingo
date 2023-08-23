package com.csiro.snomio;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {"com.csiro.snomio", "com.csiro.tickets"})
@EnableConfigurationProperties
@ConfigurationPropertiesScan
@EntityScan("com.csiro")
@ComponentScan(basePackages = {"com.csiro.snomio", "com.csiro.tickets"})
@EnableJpaRepositories(basePackages = {"com.csiro.snomio", "com.csiro.tickets"})
public abstract class Configuration {}
