package com.csiro.tickets.config;

import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

@Configuration
@Profile("testcontainer")
public class TestContainersDatabaseConfig {

  @Value("${custom.jdbc.url}")
  private String jdbcUrl;

  @Bean
  public DataSource dataSource() {
    DriverManagerDataSource dataSource = new DriverManagerDataSource();
    dataSource.setUrl(jdbcUrl);
    dataSource.setUsername("postgres");
    dataSource.setPassword("");
    return dataSource;
  }
}
