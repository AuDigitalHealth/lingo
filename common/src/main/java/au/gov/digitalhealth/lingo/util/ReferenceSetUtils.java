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
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.ReferenceSetDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.PackageProductDetailsBase;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet;
import jakarta.validation.constraints.NotNull;
import java.util.Collection;
import java.util.HashSet;
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

  public static Set<ReferenceSet> getReferenceSetsFromNewRefsetComponentViewMembers(
      Collection<SnowstormReferenceSetMemberViewComponent> refsetMembers,
      Map<String, ReferenceSetDefinition> referenceSetsConfigured,
      ModelLevel modelLevel) {

    Set<ReferenceSet> referenceSets =
        refsetMembers.stream()
            .filter(r -> referenceSetsConfigured.containsKey(r.getRefsetId()))
            .map(s -> new ReferenceSet(s, referenceSetsConfigured.get(s.getRefsetId())))
            .collect(Collectors.toSet());

    if (refsetMembers.stream()
        .anyMatch(r -> r.getRefsetId().equals(modelLevel.getReferenceSetIdentifier()))) {
      referenceSets.add(modelLevel.createMarkerRefset());
    }
    return referenceSets;
  }

  public static Map<String, Set<ReferenceSet>> getReferenceSetsFromRefsetMembers(
      Collection<SnowstormReferenceSetMember> refsetMembers,
      Set<ReferenceSetDefinition> mappingRefsets) {

    if (mappingRefsets.isEmpty()) {
      return Map.of();
    }

    Map<String, ReferenceSetDefinition> referenceSetsConfigured =
        mappingRefsets.stream()
            .collect(Collectors.toMap(ReferenceSetDefinition::getIdentifier, Function.identity()));

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
      Flux<SnowstormReferenceSetMember> refsetMembers, Set<ReferenceSetDefinition> mappingRefsets) {

    if (mappingRefsets.isEmpty()) {
      return Mono.just(Map.of());
    }

    Map<String, ReferenceSetDefinition> referenceSetsConfigured =
        mappingRefsets.stream()
            .collect(Collectors.toMap(ReferenceSetDefinition::getIdentifier, Function.identity()));

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

  public static Set<SnowstormReferenceSetMemberViewComponent> calculateReferenceSetMembers(
      PackageProductDetailsBase details,
      ModelConfiguration modelConfiguration,
      ModelLevelType modelLevelType) {

    return calculateReferenceSetMembers(
        details.getNonDefiningProperties(), modelConfiguration, modelLevelType);
  }

  public static Set<SnowstormReferenceSetMemberViewComponent> calculateReferenceSetMembers(
      Collection<NonDefiningBase> properties,
      ModelConfiguration modelConfiguration,
      @NotNull ModelLevelType modelLevelType) {

    Map<String, ReferenceSetDefinition> referenceSetMap =
        modelConfiguration.getReferenceSetsByName();

    Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers = new HashSet<>();

    boolean markerAdded = false;
    for (ReferenceSet referenceSet : ReferenceSet.filter(properties)) {
      ReferenceSetDefinition configReferenceSetDefinition =
          referenceSetMap.get(referenceSet.getIdentifierScheme());
      if (referenceSet.getIdentifierScheme().equals("levelMarker")) {
        // levelMarker is a special case, it is not defined in the model configuration
        // but is always present in the product details.
        configReferenceSetDefinition =
            modelConfiguration.getReferenceSetDefinitionForLevelMarker(modelLevelType);
        markerAdded = true;
      }
      if (configReferenceSetDefinition == null) {
        throw new ProductAtomicDataValidationProblem(
            "Reference set "
                + referenceSet.getIdentifierScheme()
                + " is not valid for this product");
      }
      if (configReferenceSetDefinition.getModelLevels().contains(modelLevelType)) {
        referenceSetMembers.add(
            new SnowstormReferenceSetMemberViewComponent()
                .refsetId(configReferenceSetDefinition.getIdentifier())
                .active(true));
      }
    }

    if (!markerAdded) {
      referenceSetMembers.add(
          new SnowstormReferenceSetMemberViewComponent()
              .refsetId(modelConfiguration.getReferenceSetIdForModelLevelType(modelLevelType))
              .active(true)
              .moduleId(modelConfiguration.getModuleId()));
    }

    final Set<SnowstormReferenceSetMemberViewComponent> externalIdentifierReferenceSetEntries =
        SnowstormDtoUtil.getExternalIdentifierReferenceSetEntries(
            ExternalIdentifier.filter(properties), modelConfiguration, modelLevelType);

    referenceSetMembers.addAll(externalIdentifierReferenceSetEntries);

    return referenceSetMembers;
  }
}
