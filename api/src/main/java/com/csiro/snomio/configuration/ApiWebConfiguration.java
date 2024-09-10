package com.csiro.snomio.configuration;

import com.csiro.snomio.auth.helper.AuthHelper;
import com.csiro.snomio.log.SnowstormLogger;
import com.csiro.snomio.util.AuthSnowstormLogger;
import io.netty.handler.logging.LogLevel;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.transport.logging.AdvancedByteBufFormat;

@Configuration
@Log
public class ApiWebConfiguration {

  private final AuthHelper authHelper;

  public ApiWebConfiguration(AuthHelper authHelper) {
    this.authHelper = authHelper;
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
        .filter(authHelper.addImsAuthCookie) // Cookies are injected through filter
        .build();
  }

  @Bean
  public WebClient authoringPlatformApiClient(
      @Value("${ihtsdo.ap.api.url}") String authoringServiceUrl,
      WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(authoringServiceUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .filter(authHelper.addImsAuthCookie) // Cookies are injected through filter
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

  @Bean
  public WebClient defaultAuthoringPlatformApiClient(
      @Value("${ihtsdo.ap.api.url}") String authoringServiceUrl,
      WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(authoringServiceUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .filter(authHelper.addDefaultAuthCookie) // Cookies are injected through filter
        .build();
  }

  @Bean
  public WebClient sergioApiClient(
      @Value("${sergio.base.url}") String sergioUrl, WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(sergioUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .filter(authHelper.addDefaultAuthCookie)
        .filter(logRequest())
        .build();
  }

  private ExchangeFilterFunction logRequest() {
    return ExchangeFilterFunction.ofRequestProcessor(
        clientRequest -> {
          log.info("Request: " + clientRequest.method() + " " + clientRequest.url());
          clientRequest
              .headers()
              .forEach((name, values) -> values.forEach(value -> log.info(name + "=" + value)));
          // Log cookies
          clientRequest
              .cookies()
              .forEach(
                  (name, values) ->
                      values.forEach(value -> log.info("Cookie: " + name + "=" + value)));

          return Mono.just(clientRequest);
        });
  }

  @Bean
  public WebClient otCollectorZipkinClient(
      @Value("${snomio.telemetry.zipkinendpoint}") String zipkinEndpointUrl,
      WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(zipkinEndpointUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .build();
  }

  @Bean
  public WebClient otCollectorOTLPClient(
      @Value("${snomio.telemetry.otelendpoint}") String otelEndpointUrl,
      WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(otelEndpointUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .build();
  }

  @Bean
  public SnowstormLogger snowstormLogger(AuthSnowstormLogger authLogger) {
    return authLogger;
  }
}
