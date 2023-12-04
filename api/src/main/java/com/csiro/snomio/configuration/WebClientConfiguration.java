package com.csiro.snomio.configuration;

import com.csiro.snomio.helper.AuthHelper;
import io.netty.handler.logging.LogLevel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.transport.logging.AdvancedByteBufFormat;

@Configuration
public class WebClientConfiguration {

  private AuthHelper authHelper;

  /** Adding a filter to inject the auth cookies. */
  private final ExchangeFilterFunction addImsAuthCookie =
      (clientRequest, nextFilter) -> {
        ClientRequest filteredRequest =
            ClientRequest.from(clientRequest)
                .cookie(authHelper.getImsCookieName(), authHelper.getCookieValue())
                .build();
        return nextFilter.exchange(filteredRequest);
      };

  @Autowired
  public WebClientConfiguration(AuthHelper authHelper) {
    this.authHelper = authHelper;
  }

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
      @Value("${ihtsdo.snowstorm.api.url}") String authoringServiceUrl,
      WebClient.Builder webClientBuilder) {
    HttpClient httpClient =
        HttpClient.create()
            .baseUrl(authoringServiceUrl)
            .wiretap(
                "reactor.netty.http.client.HttpClient",
                LogLevel.DEBUG,
                AdvancedByteBufFormat.TEXTUAL);
    return webClientBuilder
        .codecs(
            clientCodecConfigurer ->
                clientCodecConfigurer.defaultCodecs().maxInMemorySize(1024 * 1024 * 100))
        .baseUrl(authoringServiceUrl)
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .filter(addImsAuthCookie) // Cookies are injected through filter
        .build();
  }

  @Bean
  public WebClient authoringPlatformApiClient(
      @Value("${ihtsdo.ap.api.url}") String authoringServiceUrl,
      WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(authoringServiceUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .filter(addImsAuthCookie) // Cookies are injected through filter
        .build();
  }

  @Bean
  public WebClient nameGeneratorApiClient(
      @Value("${name.generator.api.url}") String namegenApiUrl,
      WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(namegenApiUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .build();
  }
}
