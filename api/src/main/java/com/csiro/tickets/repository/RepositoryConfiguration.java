package com.csiro.tickets.repository;

import com.csiro.snomio.helper.AuthHelper;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class RepositoryConfiguration {
  @Autowired
  private AuthHelper authHelper;

  @Bean
  AuditorAware<String> auditorProvider(){
    return new AuditorAware<String>() {
      @Override
      public Optional<String> getCurrentAuditor() {
        return Optional.ofNullable(authHelper.getImsUser().getLogin());
      }
    };
  }
}
