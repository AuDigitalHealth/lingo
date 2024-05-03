package com.csiro.snomio.configuration;

import com.csiro.snomio.service.IdentifierSource;
import com.csiro.snomio.service.cis.CISClient;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class IdentifierSourceConfiguration {
  @Bean("identifierStorage")
  public IdentifierSource identifierStorage(
      @Value("${cis.api.url:}") String cisApiUrl,
      @Value("${cis.username:}") String username,
      @Value("${cis.password:}") String password,
      @Value("${cis.softwareName:}") String softwareName,
      @Value("${cis.timeout:0}") int timeoutSeconds) {

    if (cisApiUrl.isBlank() || cisApiUrl.equals("local")) {
      return (namespace, partitionId, quantity) -> List.of();
    } else {
      return new CISClient(cisApiUrl, username, password, softwareName, timeoutSeconds);
    }
  }
}
