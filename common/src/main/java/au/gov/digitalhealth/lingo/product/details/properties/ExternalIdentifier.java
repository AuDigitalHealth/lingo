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
package au.gov.digitalhealth.lingo.product.details.properties;

import static au.gov.digitalhealth.lingo.util.SnomedConstants.MAP_TARGET;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MAP_TYPE;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.MappingType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;
import au.gov.digitalhealth.lingo.validation.OnlyOneNotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@OnlyOneNotEmpty(fields = {"identifierValue", "identifierValueObject"})
public class ExternalIdentifier extends NonDefiningBase implements Serializable {
  String identifierValue;
  SnowstormConceptMini identifierValueObject;
  @NotNull MappingType relationshipType;

  public static ExternalIdentifier create(
      SnowstormReferenceSetMember referenceSetMember, MappingRefset mappingRefset) {

    ExternalIdentifier identifier = new ExternalIdentifier();

    identifier.setIdentifierScheme(mappingRefset.getName());

    final String mapTargetId = referenceSetMember.getAdditionalFields().get(MAP_TARGET.getValue());
    if (mappingRefset.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)) {
      // TODO - get concept from snowstorm
      SnowstormConceptMini concept = new SnowstormConceptMini();
      concept.setConceptId(mapTargetId);
      identifier.setIdentifierValueObject(concept);
    } else {
      identifier.setIdentifierValue(mapTargetId);
    }

    if (mappingRefset.getMappingTypes().size() == 1) {
      identifier.setRelationshipType(mappingRefset.getMappingTypes().iterator().next());
    } else {
      identifier.setRelationshipType(
          MappingType.fromSctid(referenceSetMember.getAdditionalFields().get(MAP_TYPE.getValue())));
    }

    return identifier;
  }

  public static ExternalIdentifier create(
      SnowstormReferenceSetMemberViewComponent referenceSetMember, MappingRefset mappingRefset) {
    ExternalIdentifier identifier = new ExternalIdentifier();

    identifier.setIdentifierScheme(mappingRefset.getName());

    final String mapTargetId = referenceSetMember.getAdditionalFields().get(MAP_TARGET.getValue());
    if (mappingRefset.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)) {
      // TODO - get concept from snowstorm
      SnowstormConceptMini concept = new SnowstormConceptMini();
      concept.setConceptId(mapTargetId);
      identifier.setIdentifierValueObject(concept);
    } else {
      identifier.setIdentifierValue(mapTargetId);
    }

    if (mappingRefset.getMappingTypes().size() == 1) {
      identifier.setRelationshipType(mappingRefset.getMappingTypes().iterator().next());
    } else {
      identifier.setRelationshipType(
          MappingType.fromSctid(referenceSetMember.getAdditionalFields().get(MAP_TYPE.getValue())));
    }

    return identifier;
  }
}
