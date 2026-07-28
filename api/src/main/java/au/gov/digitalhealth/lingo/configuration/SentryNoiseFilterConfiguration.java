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

import io.sentry.Sentry;
import io.sentry.SentryEvent;
import io.sentry.SentryOptions;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers Snomio's Sentry {@code beforeSend} noise filters via the Sentry Spring Boot starter's
 * {@link Sentry.OptionsConfiguration} bean mechanism. The filters are composed into the single
 * {@code beforeSend} hook and applied in order; if any one drops the event, it is not reported:
 *
 * <ul>
 *   <li>{@link ClientDisconnectNoiseFilter} &mdash; drops client-disconnect ("connection reset by
 *       peer" / "broken pipe") events in <em>every</em> environment, since the caller is gone and
 *       the event carries no server-side signal. Disable with {@code
 *       snomio.sentry.suppress-client-disconnect-noise=false}.
 *   <li>{@link ClientErrorNoiseFilter} &mdash; drops expected HTTP client-error (4xx) responses the
 *       service deliberately returns (not-found, validation, conflict) in <em>every</em>
 *       environment, since they describe a bad or absent request from the caller rather than a
 *       server fault. Disable with {@code snomio.sentry.suppress-client-error-noise=false}.
 *   <li>{@link NonProdUpstreamErrorFilter} &mdash; drops upstream <em>unavailability</em> events
 *       (HTTP 502/503/504 and connection failures) in <em>non-production</em> environments only.
 *       Disable with {@code snomio.sentry.suppress-non-prod-upstream-errors=false}.
 * </ul>
 *
 * <p>Which environments count as "production" is configurable so each deployment (which may use a
 * different environment label, e.g. {@code production} vs {@code prod}) can classify itself
 * correctly. Defaults cover the known Snomio deployments; add your own production environment name
 * if you deploy under a different label.
 */
@Configuration
public class SentryNoiseFilterConfiguration {

  @Bean
  Sentry.OptionsConfiguration<SentryOptions> suppressSentryNoise(
      @Value("${sentry.environment:}") String environment,
      @Value("${snomio.sentry.production-environments:production,prod}")
          Set<String> productionEnvironments,
      @Value("${snomio.sentry.suppress-non-prod-upstream-errors:true}")
          boolean suppressNonProdUpstreamErrors,
      @Value("${snomio.sentry.suppress-client-disconnect-noise:true}")
          boolean suppressClientDisconnectNoise,
      @Value("${snomio.sentry.suppress-client-error-noise:true}")
          boolean suppressClientErrorNoise) {
    final List<SentryOptions.BeforeSendCallback> filters =
        List.of(
            new ClientDisconnectNoiseFilter(suppressClientDisconnectNoise),
            new ClientErrorNoiseFilter(suppressClientErrorNoise),
            new NonProdUpstreamErrorFilter(
                environment, productionEnvironments, suppressNonProdUpstreamErrors));
    return options ->
        options.setBeforeSend(
            (event, hint) -> {
              SentryEvent current = event;
              for (SentryOptions.BeforeSendCallback filter : filters) {
                current = filter.execute(current, hint);
                if (current == null) {
                  return null;
                }
              }
              return current;
            });
  }
}
