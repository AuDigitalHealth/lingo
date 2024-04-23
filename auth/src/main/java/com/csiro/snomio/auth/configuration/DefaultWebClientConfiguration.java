package com.csiro.snomio.auth.configuration;

import io.netty.handler.logging.LogLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.transport.logging.AdvancedByteBufFormat;

@Configuration
public class DefaultWebClientConfiguration {

  @Bean
  public WebClient imsApiClient(
      @Value("${ihtsdo.ims.api.url}") String imsApiUrl, WebClient.Builder webClientBuilder) {
    HttpClient httpClient =
        HttpClient.create()
            .baseUrl(imsApiUrl)
            .wiretap(
                "reactor.netty.http.client.HttpClient",
                LogLevel.DEBUG,
                AdvancedByteBufFormat.TEXTUAL);
    return webClientBuilder
        .baseUrl(imsApiUrl)
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .defaultHeader(
            HttpHeaders.CONTENT_TYPE,
            MediaType.APPLICATION_JSON_VALUE) // Cookie has to be provided for login
        .build();
  }
}
