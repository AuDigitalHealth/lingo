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
import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.MappingType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import au.gov.digitalhealth.lingo.validation.OnlyOneNotEmpty;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonTypeName;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Collection;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;
import reactor.core.publisher.Mono;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonTypeName("externalIdentifier")
@OnlyOneNotEmpty(fields = {"value", "valueObject"})
public class ExternalIdentifier extends NonDefiningBase implements Serializable {
  String value;
  SnowstormConceptMini valueObject;
  @NotNull MappingType relationshipType;

  public ExternalIdentifier() {
    this.setType(PropertyType.EXTERNAL_IDENTIFIER);
  }

  public static Mono<ExternalIdentifier> create(
      SnowstormReferenceSetMember referenceSetMember,
      ExternalIdentifierDefinition externalIdentifierDefinition,
      FhirClient fhirClient) {

    ExternalIdentifier identifier = new ExternalIdentifier();

    identifier.setIdentifierScheme(externalIdentifierDefinition.getName());
    identifier.setTitle(externalIdentifierDefinition.getTitle());
    identifier.setDescription(externalIdentifierDefinition.getDescription());
    identifier.setIdentifier(referenceSetMember.getRefsetId());

    final String mapTargetId = referenceSetMember.getAdditionalFields().get(MAP_TARGET.getValue());
    if (externalIdentifierDefinition.getMappingTypes().size() == 1) {
      identifier.setRelationshipType(
          externalIdentifierDefinition.getMappingTypes().iterator().next());
    } else {
      identifier.setRelationshipType(
          MappingType.fromSctid(referenceSetMember.getAdditionalFields().get(MAP_TYPE.getValue())));
    }

    if (externalIdentifierDefinition.getDataType().equals(NonDefiningPropertyDataType.CODED)) {
      return fhirClient
          .getConcept(mapTargetId, externalIdentifierDefinition.getCodeSystem())
          .map(
              c -> {
                identifier.setValueObject(c);
                return identifier;
              });
    } else {
      identifier.setValue(mapTargetId);
      return Mono.just(identifier);
    }
  }

  public static Mono<ExternalIdentifier> create(
      SnowstormReferenceSetMemberViewComponent referenceSetMember,
      ExternalIdentifierDefinition externalIdentifierDefinition,
      FhirClient fhirClient) {
    ExternalIdentifier identifier = new ExternalIdentifier();

    identifier.setIdentifierScheme(externalIdentifierDefinition.getName());
    identifier.setTitle(externalIdentifierDefinition.getTitle());
    identifier.setDescription(externalIdentifierDefinition.getDescription());
    identifier.setIdentifier(referenceSetMember.getRefsetId());

    final String mapTargetId = referenceSetMember.getAdditionalFields().get(MAP_TARGET.getValue());
    if (externalIdentifierDefinition.getMappingTypes().size() == 1) {
      identifier.setRelationshipType(
          externalIdentifierDefinition.getMappingTypes().iterator().next());
    } else {
      identifier.setRelationshipType(
          MappingType.fromSctid(referenceSetMember.getAdditionalFields().get(MAP_TYPE.getValue())));
    }

    if (externalIdentifierDefinition.getDataType().equals(NonDefiningPropertyDataType.CODED)) {
      return fhirClient
          .getConcept(mapTargetId, externalIdentifierDefinition.getCodeSystem())
          .map(
              c -> {
                identifier.setValueObject(c);
                return identifier;
              });
    } else {
      identifier.setValue(mapTargetId);
      return Mono.just(identifier);
    }
  }

  public static Collection<ExternalIdentifier> filter(Collection<NonDefiningBase> properties) {
    return properties.stream()
        .filter(p -> p.getType().equals(PropertyType.EXTERNAL_IDENTIFIER))
        .map(p -> (ExternalIdentifier) p)
        .toList();
  }
}
