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

import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import io.sentry.Hint;
import io.sentry.SentryEvent;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class ClientErrorNoiseFilterTest {

  private static SentryEvent eventFor(Throwable throwable) {
    return new SentryEvent(throwable);
  }

  // --- expected client errors (4xx) are dropped, in any environment ----------------------------

  @Test
  void dropsApplicationNotFoundProblem() {
    SentryEvent event = eventFor(new ResourceNotFoundProblem("External Requestor 'x' not found"));
    assertNull(new ClientErrorNoiseFilter(true).execute(event, new Hint()));
  }

  @Test
  void dropsGenericClientError() {
    SentryEvent event = eventFor(new ErrorResponseException(HttpStatus.BAD_REQUEST));
    assertNull(new ClientErrorNoiseFilter(true).execute(event, new Hint()));
  }

  @Test
  void dropsClientErrorWrappedAsCause() {
    SentryEvent event =
        eventFor(new RuntimeException("wrapper", new ErrorResponseException(HttpStatus.CONFLICT)));
    assertNull(new ClientErrorNoiseFilter(true).execute(event, new Hint()));
  }

  // --- server faults and unrelated errors always report ----------------------------------------

  @Test
  void keepsServerError() {
    SentryEvent event = eventFor(new ErrorResponseException(HttpStatus.INTERNAL_SERVER_ERROR));
    assertSame(event, new ClientErrorNoiseFilter(true).execute(event, new Hint()));
  }

  @Test
  void keepsUnrelatedException() {
    SentryEvent event = eventFor(new IllegalStateException("boom"));
    assertSame(event, new ClientErrorNoiseFilter(true).execute(event, new Hint()));
  }

  @Test
  void keepsEventWithoutThrowable() {
    SentryEvent event = new SentryEvent();
    assertSame(event, new ClientErrorNoiseFilter(true).execute(event, new Hint()));
  }

  // --- master switch ---------------------------------------------------------------------------

  @Test
  void disabledFilterKeepsClientError() {
    SentryEvent event = eventFor(new ErrorResponseException(HttpStatus.NOT_FOUND));
    assertSame(event, new ClientErrorNoiseFilter(false).execute(event, new Hint()));
  }
}
