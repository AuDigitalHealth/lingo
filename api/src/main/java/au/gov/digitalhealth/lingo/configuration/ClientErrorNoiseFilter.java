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
import org.springframework.web.ErrorResponse;

/**
 * Sentry {@link io.sentry.SentryOptions.BeforeSendCallback} that drops events representing an
 * <em>expected HTTP client error</em> (4xx) this service deliberately returned &mdash; a not-found
 * lookup, a validation rejection, a duplicate/conflict, and so on. These describe the
 * <em>caller</em> sending a bad or absent request, not a server-side fault, so they are noise in
 * Sentry in every environment.
 *
 * <p>Only 4xx responses modelled as a Spring {@link ErrorResponse} are dropped &mdash; that
 * includes the application's {@code LingoProblem} hierarchy (which extends {@code
 * ErrorResponseException}) and most Spring MVC exceptions. Notably, upstream {@code
 * WebClientResponseException}s are <em>not</em> {@code ErrorResponse}s, so a Snowstorm/authoring
 * 4xx is left untouched here (see {@link NonProdUpstreamErrorFilter}); and 5xx server faults always
 * report. The check walks the exception's cause chain so a wrapped client error is still detected.
 *
 * <p>The behaviour can be disabled with {@code snomio.sentry.suppress-client-error-noise=false}.
 */
public class ClientErrorNoiseFilter implements SentryOptions.BeforeSendCallback {

  /** Guards against pathological (cyclic) cause chains. */
  private static final int MAX_CAUSE_DEPTH = 20;

  private final boolean enabled;

  public ClientErrorNoiseFilter(boolean enabled) {
    this.enabled = enabled;
  }

  @Override
  @Nullable
  public SentryEvent execute(SentryEvent event, Hint hint) {
    if (!enabled) {
      return event;
    }
    return isExpectedClientError(event.getThrowable()) ? null : event;
  }

  private boolean isExpectedClientError(@Nullable Throwable throwable) {
    Throwable cause = throwable;
    int depth = 0;
    while (cause != null && depth < MAX_CAUSE_DEPTH) {
      if (cause instanceof ErrorResponse errorResponse
          && errorResponse.getStatusCode().is4xxClientError()) {
        return true;
      }
      cause = cause.getCause();
      depth++;
    }
    return false;
  }
}
