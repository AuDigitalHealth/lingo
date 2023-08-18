package com.csiro.snomio.configuration;

import com.csiro.snomio.helper.AuthHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfiguration {
  @Autowired private AuthHelper authHelper;

  @Bean
  public WebClient imsApiClient(
      @Value("${ihtsdo.ims.api.url}") String imsApiUrl, WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(imsApiUrl)
        .defaultHeader(
            HttpHeaders.CONTENT_TYPE,
            MediaType.APPLICATION_JSON_VALUE) // Cookie has to be provided for login
        .build();
  }

  @Bean
  public WebClient snowStormApiClient(
      @Value("${ihtsdo.ap.api.url}") String authoringServiceUrl, WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(authoringServiceUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .filter(addImsAuthCookie) // Cookies are injected through filter
        .build();
  }

  /** Adding a filter to inject the auth cookies. */
  private final ExchangeFilterFunction addImsAuthCookie =
      (clientRequest, nextFilter) -> {
        ClientRequest filteredRequest =
            ClientRequest.from(clientRequest)
                .cookie(authHelper.getImsCookieName(), authHelper.getCookieValue())
                .build();
        return nextFilter.exchange(filteredRequest);
      };
}
