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
package au.gov.digitalhealth.lingo.auth.configuration;

import au.gov.digitalhealth.lingo.auth.service.ImsService;
import io.netty.handler.logging.LogLevel;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.transport.logging.AdvancedByteBufFormat;

@Log
@Configuration
public class DefaultWebClientConfiguration {

  ImsService imsService;

  @Autowired
  public DefaultWebClientConfiguration(ImsService imsService) {
    this.imsService = imsService;
  }

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

  @CacheEvict(value = "authCookie", allEntries = true)
  @Scheduled(fixedRateString = "${ims.cookie.refresh.interval:86400000}")
  public void refreshAuthCookie() {
    log.info("Refresh IMS auth cookie");
    imsService.getDefaultCookie();
  }
}
