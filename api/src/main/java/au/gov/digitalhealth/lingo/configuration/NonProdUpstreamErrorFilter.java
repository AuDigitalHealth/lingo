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
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

/**
 * Sentry {@link io.sentry.SentryOptions.BeforeSendCallback} that drops events caused purely by an
 * upstream service (e.g. Snowstorm / authoring-services) being <em>unavailable</em>, but only in
 * non-production environments.
 *
 * <p>Non-production instances routinely see the shared UAT/dev/train upstreams go down for periods
 * outside our control; the resulting exceptions are pure noise. Production always reports so
 * genuine upstream incidents remain visible.
 *
 * <p>Only the <em>availability</em> class of failures is dropped: HTTP {@code 502}/{@code 503}/
 * {@code 504} responses ({@link WebClientResponseException}) and connection failures such as
 * connection-refused / connect-timeout ({@link WebClientRequestException}). Everything else &mdash;
 * real {@code 4xx}/{@code 5xx} such as {@code 400}/{@code 409}/{@code 500}, and any other exception
 * &mdash; always reports, in every environment. The check walks the exception's cause chain so a
 * wrapped upstream failure is still detected.
 */
public class NonProdUpstreamErrorFilter implements SentryOptions.BeforeSendCallback {

  private static final Set<Integer> UPSTREAM_UNAVAILABLE_STATUS_CODES = Set.of(502, 503, 504);

  /** Guards against pathological (cyclic) cause chains. */
  private static final int MAX_CAUSE_DEPTH = 20;

  private final String environment;
  private final Set<String> productionEnvironments;
  private final boolean enabled;

  public NonProdUpstreamErrorFilter(
      @Nullable String environment, Set<String> productionEnvironments, boolean enabled) {
    this.environment = environment == null ? "" : environment.trim().toLowerCase(Locale.ROOT);
    this.productionEnvironments =
        productionEnvironments.stream()
            .filter(env -> env != null && !env.isBlank())
            .map(env -> env.trim().toLowerCase(Locale.ROOT))
            .collect(Collectors.toUnmodifiableSet());
    this.enabled = enabled;
  }

  @Override
  @Nullable
  public SentryEvent execute(SentryEvent event, Hint hint) {
    if (!enabled || isProductionEnvironment()) {
      return event;
    }
    return isUpstreamUnavailability(event.getThrowable()) ? null : event;
  }

  private boolean isProductionEnvironment() {
    return productionEnvironments.contains(environment);
  }

  private boolean isUpstreamUnavailability(@Nullable Throwable throwable) {
    Throwable cause = throwable;
    int depth = 0;
    while (cause != null && depth < MAX_CAUSE_DEPTH) {
      if (cause instanceof WebClientRequestException) {
        return true;
      }
      if (cause instanceof WebClientResponseException responseException
          && UPSTREAM_UNAVAILABLE_STATUS_CODES.contains(
              responseException.getStatusCode().value())) {
        return true;
      }
      cause = cause.getCause();
      depth++;
    }
    return false;
  }
}
