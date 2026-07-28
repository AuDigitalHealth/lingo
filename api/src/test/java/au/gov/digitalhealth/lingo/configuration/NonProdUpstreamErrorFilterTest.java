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

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

import io.sentry.Hint;
import io.sentry.SentryEvent;
import java.net.ConnectException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

class NonProdUpstreamErrorFilterTest {

  private static final Set<String> PROD_ENVS = Set.of("production", "prod");

  private static NonProdUpstreamErrorFilter filter(String environment) {
    return new NonProdUpstreamErrorFilter(environment, PROD_ENVS, true);
  }

  private static SentryEvent eventFor(Throwable throwable) {
    return new SentryEvent(throwable);
  }

  private static WebClientResponseException responseException(int status) {
    return WebClientResponseException.create(
        status, "status " + status, HttpHeaders.EMPTY, new byte[0], StandardCharsets.UTF_8);
  }

  private static WebClientRequestException connectionFailure() {
    return new WebClientRequestException(
        new ConnectException("Connection refused"),
        HttpMethod.GET,
        URI.create("http://snowstorm.example/authoring-services/users"),
        HttpHeaders.EMPTY);
  }

  // --- non-production: upstream unavailability is dropped -------------------------------------

  @Test
  void dropsBadGatewayInNonProd() {
    SentryEvent event = eventFor(responseException(502));
    assertNull(filter("uat").execute(event, new Hint()));
  }

  @Test
  void dropsServiceUnavailableInNonProd() {
    SentryEvent event = eventFor(responseException(503));
    assertNull(filter("train").execute(event, new Hint()));
  }

  @Test
  void dropsGatewayTimeoutInNonProd() {
    SentryEvent event = eventFor(responseException(504));
    assertNull(filter("dev").execute(event, new Hint()));
  }

  @Test
  void dropsConnectionFailureInNonProd() {
    SentryEvent event = eventFor(connectionFailure());
    assertNull(filter("uat").execute(event, new Hint()));
  }

  @Test
  void dropsUnavailabilityWrappedAsCauseInNonProd() {
    SentryEvent event = eventFor(new RuntimeException("wrapper", responseException(502)));
    assertNull(filter("uat").execute(event, new Hint()));
  }

  @Test
  void treatsUnknownOrBlankEnvironmentAsNonProd() {
    SentryEvent event = eventFor(responseException(502));
    assertNull(filter("").execute(event, new Hint()));
  }

  // --- production: everything is kept ---------------------------------------------------------

  @Test
  void keepsBadGatewayInProduction() {
    SentryEvent event = eventFor(responseException(502));
    assertSame(event, filter("production").execute(event, new Hint()));
  }

  @Test
  void keepsBadGatewayInProdAlias() {
    SentryEvent event = eventFor(responseException(502));
    assertSame(event, filter("prod").execute(event, new Hint()));
  }

  @Test
  void productionMatchIsCaseInsensitive() {
    SentryEvent event = eventFor(responseException(502));
    assertSame(event, filter("Production").execute(event, new Hint()));
  }

  // --- real errors are never dropped, even in non-production ----------------------------------

  @Test
  void keepsRealServerErrorInNonProd() {
    SentryEvent event = eventFor(responseException(500));
    assertSame(event, filter("uat").execute(event, new Hint()));
  }

  @Test
  void keepsClientErrorInNonProd() {
    SentryEvent event = eventFor(responseException(400));
    assertSame(event, filter("uat").execute(event, new Hint()));
  }

  @Test
  void keepsUnrelatedExceptionInNonProd() {
    SentryEvent event = eventFor(new IllegalStateException("boom"));
    assertSame(event, filter("uat").execute(event, new Hint()));
  }

  // --- master switch -------------------------------------------------------------------------

  @Test
  void disabledFilterKeepsUpstreamUnavailabilityInNonProd() {
    NonProdUpstreamErrorFilter disabled = new NonProdUpstreamErrorFilter("uat", PROD_ENVS, false);
    SentryEvent event = eventFor(responseException(502));
    assertSame(event, disabled.execute(event, new Hint()));
  }
}
