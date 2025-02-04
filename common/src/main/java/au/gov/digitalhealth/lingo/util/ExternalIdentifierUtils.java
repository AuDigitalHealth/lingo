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

import static au.gov.digitalhealth.lingo.util.AmtConstants.ARTGID_REFSET;
import static au.gov.digitalhealth.lingo.util.AmtConstants.ARTGID_SCHEME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MAP_TARGET;

import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.gov.digitalhealth.lingo.product.details.ExternalIdentifier;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import reactor.core.publisher.Flux;

public class ExternalIdentifierUtils {

  private ExternalIdentifierUtils() {
    // Utility class
  }

  // Helper method to filter and map objects to ExternalIdentifier
  private static <T> Set<ExternalIdentifier> filterAndMapToExternalIdentifier(
      Stream<T> stream,
      String referencedComponentId,
      Predicate<T> isActive,
      Function<T, String> getRefsetId,
      Function<T, String> getReferencedComponentId,
      Function<T, Map<String, String>> getAdditionalFields) {

    return stream
        .filter(
            item ->
                isActive.test(item)
                    && getRefsetId.apply(item).equals(ARTGID_REFSET.getValue())
                    && getReferencedComponentId.apply(item).equals(referencedComponentId))
        .map(
            item ->
                new ExternalIdentifier(
                    ARTGID_SCHEME.getValue(),
                    getAdditionalFields.apply(item).get(MAP_TARGET.getValue())))
        .collect(Collectors.toSet());
  }

  public static Set<ExternalIdentifier> getExternalIdentifierReferenceSet(
      Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers) {
    return referenceSetMembers.stream()
        .filter(item -> ARTGID_REFSET.getValue().equals(item.getRefsetId()))
        .map(
            item ->
                new ExternalIdentifier(
                    ARTGID_SCHEME.getValue(),
                    Objects.requireNonNull(
                            item.getAdditionalFields(),
                            "additional fields must exist for the ARTGID reference set")
                        .get(MAP_TARGET.getValue())))
        .collect(Collectors.toSet());
  }

  // Processes Set<SnowstormReferenceSetMemberViewComponent>
  public static Set<ExternalIdentifier> getExternalIdentifierReferenceSet(
      Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers,
      String referencedComponentId) {

    return filterAndMapToExternalIdentifier(
        referenceSetMembers.stream(),
        referencedComponentId,
        (SnowstormReferenceSetMemberViewComponent r) -> r.getActive() != null && r.getActive(),
        SnowstormReferenceSetMemberViewComponent::getRefsetId,
        SnowstormReferenceSetMemberViewComponent::getReferencedComponentId,
        SnowstormReferenceSetMemberViewComponent::getAdditionalFields);
  }

  // Processes Flux<SnowstormReferenceSetMember>
  public static Set<ExternalIdentifier> getExternalIdentifierReferences(
      Flux<SnowstormReferenceSetMember> referenceSetMembers, String referencedComponentId) {

    return filterAndMapToExternalIdentifier(
        referenceSetMembers.toStream(),
        referencedComponentId,
        (SnowstormReferenceSetMember r) -> r.getActive() != null && r.getActive(),
        SnowstormReferenceSetMember::getRefsetId,
        SnowstormReferenceSetMember::getReferencedComponentId,
        SnowstormReferenceSetMember::getAdditionalFields);
  }
}
