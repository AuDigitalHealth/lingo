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
import au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.util.Pair;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public class ReferenceSetUtils {

  private ReferenceSetUtils() {
    // Utility class
  }

  public static Map<String, Set<ReferenceSet>> getReferenceSetsFromRefsetComponentViewMembers(
      Collection<SnowstormReferenceSetMemberViewComponent> refsetMembers,
      Collection<au.gov.digitalhealth.lingo.configuration.model.ReferenceSet> mappingRefsets) {

    if (mappingRefsets.isEmpty()) {
      return Map.of();
    }

    Map<String, au.gov.digitalhealth.lingo.configuration.model.ReferenceSet>
        referenceSetsConfigured =
            mappingRefsets.stream()
                .collect(
                    Collectors.toMap(
                        au.gov.digitalhealth.lingo.configuration.model.ReferenceSet::getIdentifier,
                        Function.identity()));

    return refsetMembers.stream()
        .filter(r -> referenceSetsConfigured.containsKey(r.getRefsetId()))
        .map(
            s ->
                Pair.of(
                    s.getReferencedComponentId(),
                    new ReferenceSet(s, referenceSetsConfigured.get(s.getRefsetId()))))
        .collect(
            Collectors.groupingBy(
                Pair::getFirst, Collectors.mapping(Pair::getSecond, Collectors.toSet())));
  }

  public static Map<String, Set<ReferenceSet>> getReferenceSetsFromRefsetMembers(
      Collection<SnowstormReferenceSetMember> refsetMembers,
      Set<au.gov.digitalhealth.lingo.configuration.model.ReferenceSet> mappingRefsets) {

    if (mappingRefsets.isEmpty()) {
      return Map.of();
    }

    Map<String, au.gov.digitalhealth.lingo.configuration.model.ReferenceSet>
        referenceSetsConfigured =
            mappingRefsets.stream()
                .collect(
                    Collectors.toMap(
                        au.gov.digitalhealth.lingo.configuration.model.ReferenceSet::getIdentifier,
                        Function.identity()));

    return refsetMembers.stream()
        .filter(r -> referenceSetsConfigured.containsKey(r.getRefsetId()))
        .map(
            s ->
                Pair.of(
                    s.getReferencedComponentId(),
                    new ReferenceSet(s, referenceSetsConfigured.get(s.getRefsetId()))))
        .collect(
            Collectors.groupingBy(
                Pair::getFirst, Collectors.mapping(Pair::getSecond, Collectors.toSet())));
  }

  public static Mono<Map<String, List<ReferenceSet>>> getReferenceSetsFromRefsetMembers(
      Flux<SnowstormReferenceSetMember> refsetMembers,
      Set<au.gov.digitalhealth.lingo.configuration.model.ReferenceSet> mappingRefsets) {

    if (mappingRefsets.isEmpty()) {
      return Mono.just(Map.of());
    }

    Map<String, au.gov.digitalhealth.lingo.configuration.model.ReferenceSet>
        referenceSetsConfigured =
            mappingRefsets.stream()
                .collect(
                    Collectors.toMap(
                        au.gov.digitalhealth.lingo.configuration.model.ReferenceSet::getIdentifier,
                        Function.identity()));

    return refsetMembers
        .filter(r -> referenceSetsConfigured.containsKey(r.getRefsetId()))
        .map(
            s ->
                Pair.of(
                    s.getReferencedComponentId(),
                    new au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet(
                        s, referenceSetsConfigured.get(s.getRefsetId()))))
        .collect(
            Collectors.groupingBy(
                Pair::getFirst, Collectors.mapping(Pair::getSecond, Collectors.toList())));
  }
}
