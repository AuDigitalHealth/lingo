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

import io.sentry.Hint;
import io.sentry.SentryEvent;
import io.sentry.SentryOptions;
import jakarta.annotation.Nullable;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

/**
 * Sentry {@link io.sentry.SentryOptions.BeforeSendCallback} that drops events caused by the HTTP
 * client disconnecting mid-response &mdash; "connection reset by peer" / "broken pipe" when a
 * browser aborts an in-flight request (navigates away, closes the tab, cancels a slow load).
 *
 * <p>Unlike upstream <em>availability</em> failures (see {@link NonProdUpstreamErrorFilter}), these
 * are benign in <em>every</em> environment: the request simply cannot be completed because the
 * caller is gone. They carry no server-side signal and only bury real issues, so they are dropped
 * in all environments. The whole behaviour can be disabled with {@code
 * snomio.sentry.suppress-client-disconnect-noise=false}.
 *
 * <p>The check walks the exception's cause chain so a client disconnect wrapped by another
 * exception is still detected.
 */
public class ClientDisconnectNoiseFilter implements SentryOptions.BeforeSendCallback {

  /** Guards against pathological (cyclic) cause chains. */
  private static final int MAX_CAUSE_DEPTH = 20;

  private final boolean enabled;

  public ClientDisconnectNoiseFilter(boolean enabled) {
    this.enabled = enabled;
  }

  @Override
  @Nullable
  public SentryEvent execute(SentryEvent event, Hint hint) {
    if (!enabled) {
      return event;
    }
    return isClientDisconnect(event.getThrowable()) ? null : event;
  }

  private boolean isClientDisconnect(@Nullable Throwable throwable) {
    Throwable cause = throwable;
    int depth = 0;
    while (cause != null && depth < MAX_CAUSE_DEPTH) {
      if (cause instanceof ClientAbortException
          || cause instanceof AsyncRequestNotUsableException) {
        return true;
      }
      cause = cause.getCause();
      depth++;
    }
    return false;
  }
}
