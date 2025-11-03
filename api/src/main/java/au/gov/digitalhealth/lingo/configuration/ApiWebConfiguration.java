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
package au.gov.digitalhealth.lingo.configuration;

import au.gov.digitalhealth.lingo.auth.helper.AuthHelper;
import au.gov.digitalhealth.lingo.log.SnowstormLogger;
import au.gov.digitalhealth.lingo.util.AuthSnowstormLogger;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.handler.logging.LogLevel;
import java.time.Duration;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.http.client.PrematureCloseException;
import reactor.netty.transport.logging.AdvancedByteBufFormat;
import reactor.util.retry.Retry;

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
    ObjectMapper customMapper =
        new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
    Jackson2JsonEncoder encoder = new Jackson2JsonEncoder(customMapper, MediaType.APPLICATION_JSON);
    return webClientBuilder
        .codecs(
            clientCodecConfigurer ->
                clientCodecConfigurer.defaultCodecs().maxInMemorySize(1024 * 1024 * 100))
        .codecs(clientCodecConfigurer -> clientCodecConfigurer.customCodecs().register(encoder))
        .baseUrl(authoringServiceUrl)
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .filter(authHelper.addImsAuthCookie) // Cookies are injected through filter
        .filter(logRequestOnError())
        .filter(retryFilter(2)) // Add retry logic here
        .build();
  }

  @Bean
  public WebClient authoringPlatformApiClient(
      @Value("${ihtsdo.ap.api.url}") String authoringServiceUrl,
      WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(authoringServiceUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .filter(authHelper.addImsAuthCookie)
        .exchangeStrategies(
            ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build())
        .build();
  }

  @Bean
  public WebClient nameGeneratorApiClient(
      @Value("${name.generator.api.url}") String namegenApiUrl,
      @Value("${name.generator.api.key:}") String apiKeyHeader,
      WebClient.Builder webClientBuilder) {
    WebClient.Builder builder =
        webClientBuilder
            .baseUrl(namegenApiUrl)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

    // Only add the API key header if it's not empty
    if (apiKeyHeader != null && !apiKeyHeader.isEmpty()) {
      builder.defaultHeader("X-API-Key", apiKeyHeader);
    }

    return builder.build();
  }

  @Bean
  public WebClient defaultAuthoringPlatformApiClient(
      @Value("${ihtsdo.ap.api.url}") String authoringServiceUrl,
      WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(authoringServiceUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .filter(authHelper.addDefaultAuthCookie) // Cookies are injected through filter
        .exchangeStrategies(
            ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build())
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

  @Bean
  public WebClient fhirApiClient(
      @Value("${fhir.server.url}") String fhirServerUrl, WebClient.Builder webClientBuilder) {
    return webClientBuilder
        .baseUrl(fhirServerUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
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

  private ExchangeFilterFunction logRequestOnError() {
    return (request, next) ->
        next.exchange(request)
            .doOnError(
                ex -> {
                  log.severe(
                      String.format(
                          "[WebClient][Error] %s %s -> Exception: %s",
                          request.method(), request.url(), ex.toString()));
                });
  }

  private ExchangeFilterFunction retryFilter(int maxAttempt) {
    return (request, next) ->
        next.exchange(request)
            .retryWhen(
                Retry.backoff(maxAttempt, Duration.ofSeconds(2))
                    .filter(ex -> ex instanceof PrematureCloseException)
                    .doBeforeRetry(
                        retrySignal -> {
                          log.severe(
                              String.format(
                                  "[WebClient][Retry %d] Retrying: %s due to %s",
                                  retrySignal.totalRetries() + 1,
                                  request.url(),
                                  retrySignal.failure().toString()));
                        }));
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
