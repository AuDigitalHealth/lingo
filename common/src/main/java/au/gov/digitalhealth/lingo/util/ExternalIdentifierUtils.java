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

import static au.gov.digitalhealth.lingo.util.SnomedConstants.MAP_TARGET;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MAP_TYPE;

import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.MappingType;
import au.gov.digitalhealth.lingo.product.details.ExternalIdentifier;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import reactor.core.publisher.Flux;

public class ExternalIdentifierUtils {

  private ExternalIdentifierUtils() {
    // Utility class
  }

  // Processes Set<SnowstormReferenceSetMemberViewComponent>
  public static Set<ExternalIdentifier> getExternalIdentifiersFromRefsetMemberViewComponents(
      Collection<SnowstormReferenceSetMemberViewComponent> referenceSetMembers,
      String referencedComponentId,
      Set<MappingRefset> mappingRefsets) {

    Set<ExternalIdentifier> externalIdentifiers = new HashSet<>();

    Map<String, MappingRefset> mappingRefsetMap = getStringMappingRefsetMap(mappingRefsets);

    referenceSetMembers.forEach(
        r -> {
          if (r.getActive() != null && r.getActive() && r.getReferencedComponentId() == null
              || r.getReferencedComponentId().equals(referencedComponentId)
                  && mappingRefsets.stream()
                      .map(MappingRefset::getIdentifier)
                      .collect(Collectors.toSet())
                      .contains(r.getRefsetId())) {

            MappingRefset mappingRefset = mappingRefsetMap.get(r.getRefsetId());

            externalIdentifiers.add(
                new ExternalIdentifier(
                    mappingRefset.getName(),
                    r.getAdditionalFields().get(MAP_TARGET.getValue()),
                    mappingRefset.getMappingTypes().size() == 1
                        ? mappingRefset.getMappingTypes().iterator().next()
                        : MappingType.fromSctid(r.getAdditionalFields().get(MAP_TYPE.getValue()))));
          }
        });

    return externalIdentifiers;
  }

  public static Set<ExternalIdentifier> getExternalIdentifiersFromRefsetMembers(
      Collection<SnowstormReferenceSetMember> referenceSetMembers,
      String referencedComponentId,
      Set<MappingRefset> mappingRefsets) {

    Set<ExternalIdentifier> externalIdentifiers = new HashSet<>();

    Map<String, MappingRefset> mappingRefsetMap = getStringMappingRefsetMap(mappingRefsets);

    referenceSetMembers.forEach(
        r -> {
          if (r.getActive() != null
              && r.getActive()
              && r.getReferencedComponentId().equals(referencedComponentId)
              && mappingRefsets.stream()
                  .map(MappingRefset::getIdentifier)
                  .collect(Collectors.toSet())
                  .contains(r.getRefsetId())) {

            MappingRefset mappingRefset = mappingRefsetMap.get(r.getRefsetId());

            externalIdentifiers.add(
                new ExternalIdentifier(
                    mappingRefset.getName(),
                    r.getAdditionalFields().get(MAP_TARGET.getValue()),
                    mappingRefset.getMappingTypes().size() == 1
                        ? mappingRefset.getMappingTypes().iterator().next()
                        : MappingType.fromSctid(r.getAdditionalFields().get(MAP_TYPE.getValue()))));
          }
        });

    return externalIdentifiers;
  }

  // Processes Flux<SnowstormReferenceSetMember>
  public static Set<ExternalIdentifier> getExternalIdentifiersFromRefsetMembers(
      Flux<SnowstormReferenceSetMember> referenceSetMembers,
      String referencedComponentId,
      Set<MappingRefset> mappingRefsets) {

    Set<ExternalIdentifier> externalIdentifiers = new HashSet<>();

    Map<String, MappingRefset> mappingRefsetMap = getStringMappingRefsetMap(mappingRefsets);

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

                MappingRefset mappingRefset = mappingRefsetMap.get(r.getRefsetId());

                externalIdentifiers.add(
                    new ExternalIdentifier(
                        mappingRefset.getName(),
                        r.getAdditionalFields().get(MAP_TARGET.getValue()),
                        mappingRefset.getMappingTypes().size() == 1
                            ? mappingRefset.getMappingTypes().iterator().next()
                            : MappingType.fromSctid(
                                r.getAdditionalFields().get(MAP_TYPE.getValue()))));
              }
            });

    return externalIdentifiers;
  }

  private static Map<String, MappingRefset> getStringMappingRefsetMap(
      Set<MappingRefset> mappingRefsets) {
    return mappingRefsets.stream()
        .collect(Collectors.toMap(MappingRefset::getIdentifier, Function.identity()));
  }

  public static Map<String, List<ExternalIdentifier>> getExternalIdentifiersMapFromRefsetMembers(
      Flux<SnowstormReferenceSetMember> refsetMembers,
      String productId,
      Set<MappingRefset> mappingRefsets) {

    Map<String, MappingRefset> mappingRefsetMap = getStringMappingRefsetMap(mappingRefsets);

    return refsetMembers
        .toStream()
        .filter(r -> r.getActive() != null && r.getActive())
        .filter(r -> r.getReferencedComponentId().equals(productId))
        .filter(
            r ->
                mappingRefsets.stream()
                    .map(MappingRefset::getIdentifier)
                    .collect(Collectors.toSet())
                    .contains(r.getRefsetId()))
        .collect(
            Collectors.groupingBy(
                SnowstormReferenceSetMember::getReferencedComponentId,
                Collectors.mapping(
                    r -> {
                      MappingRefset mappingRefset = mappingRefsetMap.get(r.getRefsetId());
                      return new ExternalIdentifier(
                          mappingRefset.getName(),
                          r.getAdditionalFields().get(MAP_TARGET.getValue()),
                          mappingRefset.getMappingTypes().size() == 1
                              ? mappingRefset.getMappingTypes().iterator().next()
                              : MappingType.fromSctid(
                                  r.getAdditionalFields().get(MAP_TYPE.getValue())));
                    },
                    Collectors.toList())));
  }
}
