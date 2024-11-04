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
