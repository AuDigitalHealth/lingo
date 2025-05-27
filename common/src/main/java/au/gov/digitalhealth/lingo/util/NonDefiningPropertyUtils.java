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

import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import reactor.core.publisher.Mono;

public class NonDefiningPropertyUtils {

  private NonDefiningPropertyUtils() {
    // Utility class
  }

  public static Map<String, Set<NonDefiningProperty>> getNonDefiningPropertyFromConcepts(
      Collection<SnowstormConcept> concepts,
      Set<au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty>
          nonDefiningProperties) {

    if (nonDefiningProperties.isEmpty()) {
      return Map.of();
    }

    Map<String, au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty>
        nonDefiningPropertyMap =
            nonDefiningProperties.stream()
                .collect(
                    Collectors.toMap(
                        au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty
                            ::getIdentifier,
                        Function.identity()));
    return concepts.stream()
        .flatMap(concept -> concept.getRelationships().stream())
        .filter(relationship -> nonDefiningPropertyMap.containsKey(relationship.getTypeId()))
        .collect(
            Collectors.groupingBy(
                SnowstormRelationship::getSourceId,
                Collectors.mapping(
                    relationship ->
                        new NonDefiningProperty(
                            relationship, nonDefiningPropertyMap.get(relationship.getTypeId())),
                    Collectors.toSet())));
  }

  public static Mono<Map<String, List<NonDefiningProperty>>> getNonDefiningPropertyFromConcepts(
      Mono<Map<String, SnowstormConcept>> concepts,
      Set<au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty>
          nonDefiningProperties) {

    if (nonDefiningProperties.isEmpty()) {
      return Mono.just(Map.of());
    }

    Map<String, au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty>
        nonDefiningPropertyMap =
            nonDefiningProperties.stream()
                .collect(
                    Collectors.toMap(
                        au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty
                            ::getIdentifier,
                        Function.identity()));

    return concepts
        .flatMapIterable(Map::values)
        .flatMapIterable(SnowstormConcept::getRelationships)
        .filter(relationship -> nonDefiningPropertyMap.containsKey(relationship.getTypeId()))
        .collectMultimap(
            SnowstormRelationship::getSourceId,
            relationship ->
                new NonDefiningProperty(
                    relationship, nonDefiningPropertyMap.get(relationship.getTypeId())))
        .map(
            multimap -> {
              Map<String, List<NonDefiningProperty>> result = new HashMap<>();
              multimap.forEach((key, collection) -> result.put(key, new ArrayList<>(collection)));
              return result;
            });
  }

  public static Set<NonDefiningProperty> getNonDefiningProperties(
      Set<SnowstormRelationship> nonDefiningProperties,
      Map<String, au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty>
          nonDefiningPropertiesForModelLevel) {
    if (nonDefiningProperties.isEmpty()) {
      return Set.of();
    }

    return nonDefiningProperties.stream()
        .filter(
            relationship ->
                nonDefiningPropertiesForModelLevel.containsKey(relationship.getTypeId()))
        .map(
            relationship ->
                new NonDefiningProperty(
                    relationship, nonDefiningPropertiesForModelLevel.get(relationship.getTypeId())))
        .collect(Collectors.toSet());
  }
}
