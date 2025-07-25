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
package au.gov.digitalhealth.lingo.service.fhir;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.product.details.properties.AdditionalProperty;
import au.gov.digitalhealth.lingo.product.details.properties.SubAdditionalProperty;
import au.gov.digitalhealth.lingo.service.fhir.FhirParameters.Parameter;
import au.gov.digitalhealth.lingo.service.fhir.FhirParameters.Parameter.Part;
import au.gov.digitalhealth.lingo.util.CacheConstants;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Log
@Service
public class FhirClient {
  private final WebClient client;
  private final FhirClient self;

  public FhirClient(@Qualifier("fhirApiClient") WebClient client, @Lazy FhirClient fhirClient) {
    this.client = client;
    this.self = fhirClient;
  }

  private static boolean isInActive(FhirParameters parameters) {
    return parameters.getParameter().stream()
        .filter(param -> "property".equals(param.getName()))
        .filter(
            param ->
                param.getPart().stream()
                    .anyMatch(
                        part ->
                            "inactive".equals(part.getValueCode())
                                && "code".equals(part.getName())))
        .flatMap(param -> param.getPart().stream())
        .filter(part -> "value".equals(part.getName()))
        .map(Part::getValueBoolean)
        .findFirst()
        .orElseThrow(() -> new IllegalStateException("No active status found in FHIR parameters"));
  }

  private static String getDisplayName(FhirParameters parameters) {
    return parameters.getParameter().stream()
        .filter(param -> "display".equals(param.getName()))
        .map(Parameter::getValueString)
        .findFirst()
        .orElseThrow(() -> new IllegalStateException("No display name found in FHIR parameters"));
  }

  private static SnowstormConceptMini createSnowstormConcept(
      String code, FhirParameters parameters) {
    SnowstormConceptMini snowstormConceptMini = new SnowstormConceptMini();
    snowstormConceptMini.setConceptId(code);
    snowstormConceptMini.setId(code);
    snowstormConceptMini.setActive(!isInActive(parameters));
    SnowstormTermLangPojo pt =
        new SnowstormTermLangPojo().lang("en").term(getDisplayName(parameters));
    snowstormConceptMini.setPt(pt);
    SnowstormTermLangPojo fsn =
        new SnowstormTermLangPojo().lang("en").term(getDisplayName(parameters));
    snowstormConceptMini.setFsn(fsn);
    return snowstormConceptMini;
  }

  private static Mono<AdditionalProperty> processSubProperties(
      Parameter propertyParam, Optional<Part> codePart) {
    // Handle case where property has subproperties instead of a direct value
    String propertyCode = codePart.get().getValueAsString();

    List<SubAdditionalProperty> subAdditionalProperties = new ArrayList<>();

    propertyParam.getPart().stream()
        .filter(p -> p.getName().equals("subproperty"))
        .map(Part::getPart)
        .forEach(
            propertyList -> {
              String code = null;
              String value = null;
              for (Part property : propertyList) {
                if (property.getName().equals("code")) {
                  code = property.getValueAsString();
                } else if (property.getName().equals("value")) {
                  value = property.getValueAsString();
                }
              }
              subAdditionalProperties.add(new SubAdditionalProperty(code, value));
            });

    return Mono.just(new AdditionalProperty(propertyCode, null, null, subAdditionalProperties));
  }

  @Cacheable(
      value = CacheConstants.FHIR_CONCEPTS,
      key = "#code + '_' + #system+ '_display'",
      unless = "#result == null")
  public Mono<String> getDisplay(String code, String system) {
    return client
        .get()
        .uri(
            uriBuilder ->
                uriBuilder
                    .path("/CodeSystem/$lookup")
                    .queryParam("code", code)
                    .queryParam("system", system)
                    .queryParam("property", "display")
                    .build())
        .retrieve()
        .bodyToMono(FhirParameters.class)
        .map(fhirParameters -> getDisplayName(fhirParameters));
  }

  @Cacheable(
      value = CacheConstants.FHIR_CONCEPTS,
      key = "#code + '_' + #system",
      unless = "#result == null")
  public Mono<Pair<SnowstormConceptMini, Set<AdditionalProperty>>> getConcept(
      String code, String system) {
    if (code == null || code.isEmpty()) {
      return Mono.error(new IllegalArgumentException("Code must not be null or empty"));
    }

    if (system == null || system.isEmpty()) {
      return Mono.error(new IllegalArgumentException("System must not be null or empty"));
    }

    return client
        .get()
        .uri(
            uriBuilder ->
                uriBuilder
                    .path("/CodeSystem/$lookup")
                    .queryParam("code", code)
                    .queryParam("system", system)
                    .queryParam("property", "*")
                    .build())
        .retrieve()
        .bodyToMono(FhirParameters.class)
        .flatMap(parameters -> processFhirParameters(code, parameters));
  }

  private Mono<Pair<SnowstormConceptMini, Set<AdditionalProperty>>> processFhirParameters(
      String code, FhirParameters parameters) {
    final SnowstormConceptMini snowstormConceptMini = createSnowstormConcept(code, parameters);

    // Create the set of properties
    Set<AdditionalProperty> propertySet = new HashSet<>();

    // Process each property, creating a Mono for each one that needs a display lookup
    List<Mono<AdditionalProperty>> propertyMonos = new ArrayList<>();

    // Process property parts
    parameters.getParameter().stream()
        .filter(param -> "property".equals(param.getName()) && param.getPart() != null)
        .forEach(propertyParam -> processProperty(propertyParam, propertyMonos));

    // If we have properties that need reactive processing
    if (!propertyMonos.isEmpty()) {
      // Use Flux.concat to process all property Monos sequentially
      return Flux.concat(propertyMonos)
          .collectList()
          .map(
              additionalProperties -> {
                // Add all the asynchronously-processed properties to our set
                propertySet.addAll(additionalProperties);
                return Pair.of(snowstormConceptMini, propertySet);
              });
    } else {
      // If no reactive properties, just return immediately
      return Mono.just(Pair.of(snowstormConceptMini, propertySet));
    }
  }

  private void processProperty(
      Parameter propertyParam, List<Mono<AdditionalProperty>> propertyMonos) {
    // Find code part
    Optional<Part> codePart =
        propertyParam.getPart().stream().filter(part -> "code".equals(part.getName())).findFirst();

    // Find value part
    Optional<Part> valuePart =
        propertyParam.getPart().stream().filter(part -> "value".equals(part.getName())).findFirst();

    if (codePart.isPresent() && valuePart.isPresent()) {
      String propertyCode = codePart.get().getValueAsString();
      String propertyValue = valuePart.get().getValueAsString();

      if (valuePart.get().hasValueCoding()) {
        final Mono<AdditionalProperty> propertyMono =
            getAdditionalPropertyForCoding(valuePart, propertyValue, propertyCode);
        propertyMonos.add(propertyMono);
      } else if (propertyCode != null && propertyValue != null) {
        // Add directly for properties that don't need additional processing
        propertyMonos.add(
            Mono.just(new AdditionalProperty(propertyCode, null, propertyValue, null)));
      }
    } else if (codePart.isPresent()
        && propertyParam.getPart().stream()
            .anyMatch(part -> "subproperty".equals(part.getName()))) {
      propertyMonos.add(processSubProperties(propertyParam, codePart));
    }
  }

  private Mono<AdditionalProperty> getAdditionalPropertyForCoding(
      Optional<Part> valuePart, String propertyValue, String propertyCode) {
    String propertySystem = valuePart.get().getValueCoding().getSystem();
    // Create a Mono that will resolve to the AdditionalProperty
    // Log the error
    // Return a default value
    return self.getDisplay(propertyValue, propertySystem)
        .onErrorResume(
            e -> {
              // Log the error
              log.warning("Error getting display for " + propertyCode + ": " + e.getMessage());
              // Return a default value
              return Mono.just("Display not available");
            })
        .map(
            displayValue ->
                new AdditionalProperty(propertyCode, propertySystem, displayValue, null));
  }
}