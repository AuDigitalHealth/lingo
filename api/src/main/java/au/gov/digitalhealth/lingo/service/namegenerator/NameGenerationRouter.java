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
package au.gov.digitalhealth.lingo.service.namegenerator;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.configuration.ApiWebConfiguration;
import au.gov.digitalhealth.lingo.product.FsnAndPt;
import au.gov.digitalhealth.lingo.product.NameGeneratorSpec;
import au.gov.digitalhealth.lingo.service.SnowstormClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

/**
 * Routes name generation requests to the appropriate name generator. ECL-based generators are
 * loaded dynamically at startup from properties under {@code snomio.name-generators.ecl.*}. For
 * each configured generator, the preferred terms of all matching ECL concepts are fetched from
 * Snowstorm and checked against {@link NameGeneratorSpec#getPt_owl()}. The first generator whose
 * ECL concepts include a PT that appears as a quoted string in pt_owl is used. Falls back to the
 * default name generator if no ECL matches.
 *
 * <p>Properties format (no brackets required):
 *
 * <pre>
 * snomio.name-generators.ecl.&lt;name&gt;.ecl=&lt;ECL expression&gt;
 * snomio.name-generators.ecl.&lt;name&gt;.url=&lt;generator URL&gt;
 * snomio.name-generators.ecl.&lt;name&gt;.key=&lt;optional API key&gt;
 * </pre>
 */
@Service
@Log
public class NameGenerationRouter {

  static final String ECL_GENERATED_NAME_UNAVAILABLE = "ECL name generator unavailable";
  private static final String GENERATORS_PROPERTY_PREFIX = "snomio.name-generators.ecl";

  private final NameGenerationClient defaultClient;
  private final SnowstormClient snowstormClient;
  private final Environment environment;
  private final ObjectProvider<WebClient.Builder> webClientBuilderProvider;
  private final ObjectMapper objectMapper;
  private final int timeoutSeconds;

  private List<EclClientEntry> eclClients;

  @Autowired
  public NameGenerationRouter(
      NameGenerationClient defaultClient,
      SnowstormClient snowstormClient,
      Environment environment,
      ObjectProvider<WebClient.Builder> webClientBuilderProvider,
      ObjectMapper objectMapper,
      @Value("${name.generator.api.timeout-seconds:90}") int timeoutSeconds) {
    this.defaultClient = defaultClient;
    this.snowstormClient = snowstormClient;
    this.environment = environment;
    this.webClientBuilderProvider = webClientBuilderProvider;
    this.objectMapper = objectMapper;
    this.timeoutSeconds = timeoutSeconds;
  }

  @PostConstruct
  public void init() {
    eclClients = new ArrayList<>();

    // Shared across every ECL generator client: the same client-side timeout backstop as the
    // default name-generator bean, so a hung ECL generator can't make name generation wait forever.
    HttpClient httpClient = ApiWebConfiguration.nameGeneratorHttpClient(timeoutSeconds);

    Map<String, EclGeneratorConfig> generators =
        Binder.get(environment)
            .bind(
                GENERATORS_PROPERTY_PREFIX, Bindable.mapOf(String.class, EclGeneratorConfig.class))
            .orElse(new LinkedHashMap<>());

    for (Map.Entry<String, EclGeneratorConfig> entry : generators.entrySet()) {
      String name = entry.getKey();
      EclGeneratorConfig config = entry.getValue();
      if (config.getUrl() == null || config.getUrl().isBlank()) {
        log.warning("Skipping ECL name generator '" + name + "' — URL is empty");
        continue;
      }
      if (config.getEcl() == null || config.getEcl().isBlank()) {
        log.warning("Skipping ECL name generator '" + name + "' — ECL is empty");
        continue;
      }
      WebClient.Builder builder =
          webClientBuilderProvider
              .getObject()
              .baseUrl(config.getUrl())
              .clientConnector(new ReactorClientHttpConnector(httpClient))
              .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
      if (config.getKey() != null && !config.getKey().isBlank()) {
        builder.defaultHeader("X-API-Key", config.getKey());
      }
      WebClient webClient = builder.build();
      eclClients.add(
          new EclClientEntry(config.getEcl(), spec -> callNameGenerator(webClient, spec)));
      log.info(
          "Registered ECL name generator '"
              + name
              + "' for ECL: "
              + config.getEcl()
              + " at "
              + config.getUrl());
    }
  }

  /**
   * Resolves the name generator for a product. The supplier is only evaluated when ECL-based
   * generators are configured; it should return the preferred terms of all concepts that
   * participate in the product's OWL axiom. Falls back to the default generator when no ECL
   * generators are configured, branch is null, or the supplied PTs are empty.
   */
  public Function<NameGeneratorSpec, FsnAndPt> resolve(
      String branch, Supplier<Collection<String>> axiomConceptPtsSupplier) {
    if (branch != null && !eclClients.isEmpty()) {
      Collection<String> axiomConceptPts = axiomConceptPtsSupplier.get();
      if (axiomConceptPts != null && !axiomConceptPts.isEmpty()) {
        for (EclClientEntry entry : eclClients) {
          Set<String> eclPts = getEclConceptPts(branch, entry.ecl);
          if (eclPts.stream().anyMatch(axiomConceptPts::contains)) {
            log.info(
                "Resolved ECL-based name generator for ECL ["
                    + entry.ecl
                    + "] — matched an axiom concept PT");
            String ecl = entry.ecl;
            Function<NameGeneratorSpec, FsnAndPt> gen = entry.generator;
            return spec -> {
              log.info("Calling ECL-based name generator for ECL [" + ecl + "]");
              return gen.apply(spec);
            };
          }
        }
      }
    }
    return spec -> {
      log.info("Calling default name generator");
      return defaultClient.generateNames(spec);
    };
  }

  private Set<String> getEclConceptPts(String branch, String ecl) {
    try {
      Collection<SnowstormConceptMini> concepts =
          snowstormClient.getConceptsFromEcl(branch, ecl, 0, 1000, false);
      return concepts.stream()
          .filter(c -> c.getPt() != null && c.getPt().getTerm() != null)
          .map(c -> c.getPt().getTerm())
          .collect(Collectors.toSet());
    } catch (Exception e) {
      log.warning(
          "Failed to fetch concept PTs for ECL ["
              + ecl
              + "] on branch "
              + branch
              + ": "
              + e.getMessage()
              + ". Defaulting to no match.");
      return Set.of();
    }
  }

  private FsnAndPt callNameGenerator(WebClient client, NameGeneratorSpec spec) {
    final long startNanos = System.nanoTime();
    if (log.isLoggable(java.util.logging.Level.FINE)) {
      log.fine("ECL name generator request body: " + writeJsonOrToString(spec));
    }
    FsnAndPt result =
        client
            .post()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(spec)
            .retrieve()
            .bodyToMono(FsnAndPt.class)
            .doOnNext(
                r -> {
                  if (log.isLoggable(java.util.logging.Level.FINE)) {
                    log.fine(
                        "ECL name generator response in "
                            + ((System.nanoTime() - startNanos) / 1_000_000)
                            + " ms: "
                            + writeJsonOrToString(r));
                  }
                })
            .doOnError(
                e -> {
                  long elapsedMs = (System.nanoTime() - startNanos) / 1_000_000;
                  try {
                    log.severe(
                        "ECL name generator failed in "
                            + elapsedMs
                            + " ms with "
                            + e.getMessage()
                            + " for spec: "
                            + objectMapper.writeValueAsString(spec)
                            + ". Falling back to default name generator.");
                  } catch (JsonProcessingException ex) {
                    log.severe(
                        "Failed writing log for ECL name generator error: " + ex.getMessage());
                  }
                })
            .onErrorReturn(
                FsnAndPt.builder()
                    .FSN(ECL_GENERATED_NAME_UNAVAILABLE)
                    .PT(ECL_GENERATED_NAME_UNAVAILABLE)
                    .build())
            .block();

    if (result != null && ECL_GENERATED_NAME_UNAVAILABLE.equals(result.getFSN())) {
      log.warning("ECL name generator unavailable, falling back to default name generator");
      return defaultClient.generateNames(spec);
    }
    return result;
  }

  private String writeJsonOrToString(Object value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException ex) {
      if (log.isLoggable(java.util.logging.Level.FINE)) {
        log.log(
            java.util.logging.Level.FINE,
            "Failed to serialise "
                + (value == null ? "null" : value.getClass().getName())
                + " for log; falling back to toString()",
            ex);
      }
      return String.valueOf(value);
    }
  }

  /** Holds the ECL expression and the name generator function for one configured ECL generator. */
  private static class EclClientEntry {
    final String ecl;
    final Function<NameGeneratorSpec, FsnAndPt> generator;

    EclClientEntry(String ecl, Function<NameGeneratorSpec, FsnAndPt> generator) {
      this.ecl = ecl;
      this.generator = generator;
    }
  }

  /** Bindable config for one ECL-based name generator entry. */
  public static class EclGeneratorConfig {
    private String ecl;
    private String url;
    private String key;

    public String getEcl() {
      return ecl;
    }

    public void setEcl(String ecl) {
      this.ecl = ecl;
    }

    public String getUrl() {
      return url;
    }

    public void setUrl(String url) {
      this.url = url;
    }

    public String getKey() {
      return key;
    }

    public void setKey(String key) {
      this.key = key;
    }
  }
}
