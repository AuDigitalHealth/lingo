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
import java.io.IOException;
import org.apache.catalina.connector.ClientAbortException;
import org.junit.jupiter.api.Test;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

class ClientDisconnectNoiseFilterTest {

  private static SentryEvent eventFor(Throwable throwable) {
    return new SentryEvent(throwable);
  }

  // --- client disconnects are dropped, in any environment --------------------------------------

  @Test
  void dropsClientAbortException() {
    SentryEvent event =
        eventFor(new ClientAbortException(new IOException("Connection reset by peer")));
    assertNull(new ClientDisconnectNoiseFilter(true).execute(event, new Hint()));
  }

  @Test
  void dropsAsyncRequestNotUsableException() {
    SentryEvent event =
        eventFor(
            new AsyncRequestNotUsableException("ServletOutputStream failed to write: broken pipe"));
    assertNull(new ClientDisconnectNoiseFilter(true).execute(event, new Hint()));
  }

  @Test
  void dropsClientDisconnectWrappedAsCause() {
    SentryEvent event =
        eventFor(
            new RuntimeException(
                "wrapper", new ClientAbortException(new IOException("Broken pipe"))));
    assertNull(new ClientDisconnectNoiseFilter(true).execute(event, new Hint()));
  }

  // --- unrelated errors always report ----------------------------------------------------------

  @Test
  void keepsUnrelatedException() {
    SentryEvent event = eventFor(new IllegalStateException("boom"));
    assertSame(event, new ClientDisconnectNoiseFilter(true).execute(event, new Hint()));
  }

  @Test
  void keepsEventWithoutThrowable() {
    SentryEvent event = new SentryEvent();
    assertSame(event, new ClientDisconnectNoiseFilter(true).execute(event, new Hint()));
  }

  // --- master switch ---------------------------------------------------------------------------

  @Test
  void disabledFilterKeepsClientDisconnect() {
    SentryEvent event =
        eventFor(new ClientAbortException(new IOException("Connection reset by peer")));
    assertSame(event, new ClientDisconnectNoiseFilter(false).execute(event, new Hint()));
  }
}
