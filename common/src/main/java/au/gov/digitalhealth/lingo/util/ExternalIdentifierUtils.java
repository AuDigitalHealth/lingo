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
package au.gov.digitalhealth.lingo.util;

import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public class ExternalIdentifierUtils {

  private ExternalIdentifierUtils() {
    // Utility class
  }

  // Processes Set<SnowstormReferenceSetMemberViewComponent>
  public static Set<ExternalIdentifier> getExternalIdentifiersFromRefsetMemberViewComponents(
      Collection<SnowstormReferenceSetMemberViewComponent> referenceSetMembers,
      String referencedComponentId,
      Set<MappingRefset> mappingRefsets,
      FhirClient fhirClient) {

    Set<ExternalIdentifier> externalIdentifiers = new HashSet<>();

    Map<String, Set<MappingRefset>> mappingRefsetMap = createMappingToIdentifierMap(mappingRefsets);

    referenceSetMembers.forEach(
        r -> {
          if (r.getActive() != null && r.getActive() && r.getReferencedComponentId() == null
              || r.getReferencedComponentId().equals(referencedComponentId)
                  && mappingRefsets.stream()
                      .map(MappingRefset::getIdentifier)
                      .collect(Collectors.toSet())
                      .contains(r.getRefsetId())) {

            externalIdentifiers.addAll(
                mappingRefsetMap.getOrDefault(r.getRefsetId(), new HashSet<>()).stream()
                    .map(m -> ExternalIdentifier.create(r, m, fhirClient).block())
                    .collect(Collectors.toSet()));
          }
        });

    return externalIdentifiers;
  }

  public static Set<ExternalIdentifier> getExternalIdentifiersFromRefsetMembers(
      Collection<SnowstormReferenceSetMember> referenceSetMembers,
      String referencedComponentId,
      Set<MappingRefset> mappingRefsets,
      FhirClient fhirClient) {

    Set<ExternalIdentifier> externalIdentifiers = new HashSet<>();

    Map<String, Set<MappingRefset>> mappingRefsetMap = createMappingToIdentifierMap(mappingRefsets);

    referenceSetMembers.forEach(
        r -> {
          if (r.getActive() != null
              && r.getActive()
              && r.getReferencedComponentId().equals(referencedComponentId)
              && mappingRefsets.stream()
                  .map(MappingRefset::getIdentifier)
                  .collect(Collectors.toSet())
                  .contains(r.getRefsetId())) {

            externalIdentifiers.addAll(
                mappingRefsetMap.getOrDefault(r.getRefsetId(), new HashSet<>()).stream()
                    .map(m -> ExternalIdentifier.create(r, m, fhirClient).block())
                    .collect(Collectors.toSet()));
          }
        });

    return externalIdentifiers;
  }

  public static Set<ExternalIdentifier> getExternalIdentifiersFromRefsetMembers(
      Flux<SnowstormReferenceSetMember> referenceSetMembers,
      String referencedComponentId,
      Set<MappingRefset> mappingRefsets,
      FhirClient fhirClient) {

    Set<ExternalIdentifier> externalIdentifiers = new HashSet<>();

    Map<String, Set<MappingRefset>> mappingRefsetMap = createMappingToIdentifierMap(mappingRefsets);

    referenceSetMembers
        .toStream()
        .forEach(
            r -> {
              if (r.getActive() != null
                  && r.getActive()
                  && r.getReferencedComponentId().equals(referencedComponentId)
                  && mappingRefsets.stream()
                      .map(MappingRefset::getIdentifier)
                      .collect(Collectors.toSet())
                      .contains(r.getRefsetId())) {

                externalIdentifiers.addAll(
                    mappingRefsetMap.getOrDefault(r.getRefsetId(), new HashSet<>()).stream()
                        .map(m -> ExternalIdentifier.create(r, m, fhirClient).block())
                        .collect(Collectors.toSet()));
              }
            });

    return externalIdentifiers;
  }

  private static Map<String, Set<MappingRefset>> createMappingToIdentifierMap(
      Set<MappingRefset> mappingRefsets) {
    return mappingRefsets.stream()
        .collect(Collectors.groupingBy(MappingRefset::getIdentifier, Collectors.toSet()));
  }

  public static Mono<Map<String, List<ExternalIdentifier>>>
      getExternalIdentifiersMapFromRefsetMembers(
          Flux<SnowstormReferenceSetMember> refsetMembers,
          Set<MappingRefset> mappingRefsets,
          FhirClient fhirClient) {

    if (mappingRefsets.isEmpty()) {
      return Mono.just(Map.of());
    }

    Map<String, Set<MappingRefset>> mappingRefsetMap = createMappingToIdentifierMap(mappingRefsets);

    Set<String> refsetIdentifiers =
        mappingRefsets.stream().map(MappingRefset::getIdentifier).collect(Collectors.toSet());

    return refsetMembers
        .filter(r -> r.getActive() != null && r.getActive())
        .filter(r -> refsetIdentifiers.contains(r.getRefsetId()))
        .flatMap(
            r -> {
              Set<MappingRefset> mappingRefsetsList = mappingRefsetMap.get(r.getRefsetId());
              if (mappingRefsetsList == null || mappingRefsetsList.isEmpty()) {
                return Mono.empty();
              }

              // Create a Flux of ExternalIdentifier from all mappings for this refset
              return Flux.fromIterable(mappingRefsetsList)
                  .flatMap(
                      m ->
                          ExternalIdentifier.create(r, m, fhirClient)
                              .map(
                                  externalId ->
                                      new AbstractMap.SimpleEntry<>(
                                          r.getReferencedComponentId(), externalId)));
            })
        .collectMultimap(AbstractMap.SimpleEntry::getKey, AbstractMap.SimpleEntry::getValue)
        .map(
            multimap -> {
              // Convert Multimap to Map<String, List<ExternalIdentifier>>
              Map<String, List<ExternalIdentifier>> result = new HashMap<>();
              multimap.forEach((key, values) -> result.put(key, new ArrayList<>(values)));
              return result;
            });
  }
}
