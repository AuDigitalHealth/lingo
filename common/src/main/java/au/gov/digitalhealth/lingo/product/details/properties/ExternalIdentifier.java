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

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.MappingType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;
import au.gov.digitalhealth.lingo.exception.AtomicDataExtractionProblem;
import au.gov.digitalhealth.lingo.service.SnowstormClient;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.lingo.validation.OnlyOneNotEmpty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonTypeName;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Data;
import lombok.experimental.SuperBuilder;
import lombok.extern.java.Log;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Data
@SuperBuilder
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonTypeName("externalIdentifier")
@OnlyOneNotEmpty(fields = {"value", "valueObject"})
@Log
public class ExternalIdentifier extends NonDefiningBase implements Serializable {

  public static final String UNKNOWN_CODE = "Unknown code - ";
  String value;
  SnowstormConceptMini valueObject;
  @NotNull MappingType relationshipType;

  String codeSystem;

  private Map<String, FieldValue> additionalFields = new HashMap<>();

  /** Additional properties from the target concept, purely for display purposes. */
  private Set<AdditionalProperty> additionalProperties;

  public ExternalIdentifier() {
    this.setType(PropertyType.EXTERNAL_IDENTIFIER);
  }

  public static Mono<ExternalIdentifier> create(
      String branch,
      SnowstormReferenceSetMember referenceSetMember,
      ExternalIdentifierDefinition externalIdentifierDefinition,
      FhirClient fhirClient,
      SnowstormClient snowstormClient) {

    return create(
        branch,
        referenceSetMember.getAdditionalFields(),
        referenceSetMember.getRefsetId(),
        referenceSetMember.getReferencedComponentId(),
        externalIdentifierDefinition,
        fhirClient,
        snowstormClient);
  }

  public static Mono<ExternalIdentifier> create(
      String branch,
      SnowstormReferenceSetMemberViewComponent referenceSetMember,
      ExternalIdentifierDefinition externalIdentifierDefinition,
      FhirClient fhirClient,
      SnowstormClient snowstormClient) {

    return create(
        branch,
        referenceSetMember.getAdditionalFields(),
        referenceSetMember.getRefsetId(),
        referenceSetMember.getReferencedComponentId(),
        externalIdentifierDefinition,
        fhirClient,
        snowstormClient);
  }

  private static Mono<ExternalIdentifier> create(
      String branch,
      Map<String, String> additionalFields,
      String refsetId,
      String referencedComponentId,
      ExternalIdentifierDefinition externalIdentifierDefinition,
      FhirClient fhirClient,
      SnowstormClient snowstormClient) {

    checkAdditionalFieldDefinitions(
        externalIdentifierDefinition, additionalFields, refsetId, referencedComponentId);

    final String mapTargetId = additionalFields.get(MAP_TARGET.getValue());

    ExternalIdentifier identifier = new ExternalIdentifier();

    identifier.setIdentifierScheme(externalIdentifierDefinition.getName());
    identifier.setTitle(externalIdentifierDefinition.getTitle());
    identifier.setDescription(externalIdentifierDefinition.getDescription());
    identifier.setIdentifier(refsetId);

    if (externalIdentifierDefinition.getMappingTypes().size() == 1) {
      identifier.setRelationshipType(
          externalIdentifierDefinition.getMappingTypes().iterator().next());
    } else {
      identifier.setRelationshipType(MappingType.fromSctid(mapTargetId));
    }

    Mono<ExternalIdentifier> response;
    if (externalIdentifierDefinition.getDataType().equals(NonDefiningPropertyDataType.CODED)) {
      response =
          fhirClient
              .getConcept(mapTargetId, externalIdentifierDefinition.getCodeSystem())
              .map(
                  c -> {
                    identifier.setValueObject(c.getFirst());
                    identifier.setAdditionalProperties(c.getSecond());
                    identifier.setCodeSystem(externalIdentifierDefinition.getCodeSystem());
                    return identifier;
                  })
              .onErrorResume(
                  ex -> {
                    log.severe(
                        "failed getting concept for "
                            + mapTargetId
                            + " for codeSystem "
                            + externalIdentifierDefinition.getCodeSystem()
                            + ": "
                            + ex);
                    SnowstormConceptMini concept = new SnowstormConceptMini();
                    concept.setConceptId(mapTargetId);
                    concept.setFsn(
                        new SnowstormTermLangPojo().term(UNKNOWN_CODE + mapTargetId)
                            .lang("en"));
                    concept.setPt(new SnowstormTermLangPojo().term(UNKNOWN_CODE + mapTargetId)
                        .lang("en"));
                    identifier.setValueObject(concept);
                    identifier.setCodeSystem(externalIdentifierDefinition.getCodeSystem());
                    return Mono.just(identifier);
                  });
    } else {
      identifier.setValue(mapTargetId);
      response = Mono.just(identifier);
    }

    if (externalIdentifierDefinition.getAdditionalFields().isEmpty()) {
      return response;
    }

    Set<Mono<ExternalIdentifier>> additionalFieldsMonos =
        externalIdentifierDefinition.getAdditionalFields().entrySet().stream()
            .map(
                entry -> {
                  if (entry.getValue().getDataType().equals(NonDefiningPropertyDataType.CODED)) {
                    return fhirClient
                        .getConcept(
                            additionalFields.get(entry.getKey()),
                            externalIdentifierDefinition.getCodeSystem())
                        .map(
                            concept -> {
                              identifier
                                  .getAdditionalFields()
                                  .put(
                                      entry.getKey(),
                                      FieldValue.builder()
                                          .valueObject(concept.getFirst())
                                          .codeSystem(externalIdentifierDefinition.getCodeSystem())
                                          .additionalProperties(concept.getSecond())
                                          .build());
                              return identifier;
                            });
                  } else if (entry
                      .getValue()
                      .getDataType()
                      .equals(NonDefiningPropertyDataType.CONCEPT)) {
                    return snowstormClient
                        .getConceptMono(branch, additionalFields.get(entry.getKey()))
                        .map(
                            concept -> {
                              identifier
                                  .getAdditionalFields()
                                  .put(
                                      entry.getKey(),
                                      FieldValue.builder().valueObject(concept).build());
                              return identifier;
                            });
                  } else {
                    identifier
                        .getAdditionalFields()
                        .put(
                            entry.getKey(),
                            FieldValue.builder()
                                .value(additionalFields.get(entry.getKey()))
                                .build());
                    return Mono.just(identifier);
                  }
                })
            .collect(Collectors.toSet());

    return Flux.fromIterable(additionalFieldsMonos).flatMap(mono -> mono).then(response);
  }

  private static void checkAdditionalFieldDefinitions(
      ExternalIdentifierDefinition externalIdentifierDefinition,
      Map<String, String> additionalFields,
      String refsetId,
      String referencedComponentId) {
    final Set<String> fieldNames =
        new HashSet<>(externalIdentifierDefinition.getAdditionalFields().keySet());
    fieldNames.add(MAP_TARGET.getValue());
    if (additionalFields == null || !fieldNames.equals(additionalFields.keySet())) {
      throw new AtomicDataExtractionProblem(
          "ExternalIdentifierDefinition additional fields do not match the reference set member additional fields. "
              + "Expected: "
              + String.join(", ", fieldNames)
              + ", but got: "
              + String.join(", ", additionalFields == null ? Set.of() : additionalFields.keySet())
              + " for reference set: "
              + refsetId,
          referencedComponentId);
    }
  }

  private static Mono<ExternalIdentifier> updateCodedValue(
      ExternalIdentifierDefinition externalIdentifierDefinition,
      FhirClient fhirClient,
      String mapTargetId,
      ExternalIdentifier identifier) {
    return fhirClient
        .getConcept(mapTargetId, externalIdentifierDefinition.getCodeSystem())
        .map(
            c -> {
              identifier.setValueObject(c.getFirst());
              identifier.setAdditionalProperties(c.getSecond());
              identifier.setCodeSystem(externalIdentifierDefinition.getCodeSystem());
              return identifier;
            });
  }

  public static Collection<ExternalIdentifier> filter(Collection<NonDefiningBase> properties) {
    return properties.stream()
        .filter(p -> p.getType().equals(PropertyType.EXTERNAL_IDENTIFIER))
        .map(p -> (ExternalIdentifier) p)
        .toList();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;

    ExternalIdentifier that = (ExternalIdentifier) o;

    return new EqualsBuilder()
        .append(getIdentifierScheme(), that.getIdentifierScheme())
        .append(value, that.value)
        .append(relationshipType, that.relationshipType)
        .append(
            valueObject != null ? valueObject.getConceptId() : null,
            that.valueObject != null ? that.valueObject.getConceptId() : null)
        .isEquals();
  }

  @Override
  public int hashCode() {
    return new HashCodeBuilder(17, 37)
        .append(getIdentifierScheme())
        .append(value)
        .append(relationshipType)
        .append(valueObject != null ? valueObject.getConceptId() : null)
        .toHashCode();
  }

  @Override
  public String toDisplay() {
    String valueString = null;
    if (value != null) {
      valueString = value;
    } else if (valueObject != null) {
      valueString = SnowstormDtoUtil.getIdAndFsnTerm(getValueObject());
    }
    return getTitle() + ": " + valueString;
  }

  public void updateFromDefinition(
      ExternalIdentifierDefinition externalIdentifierDefinition, FhirClient fhirClient) {
    this.setIdentifierScheme(externalIdentifierDefinition.getName());
    this.setIdentifier(externalIdentifierDefinition.getIdentifier());
    this.setTitle(externalIdentifierDefinition.getTitle());
    this.setDescription(externalIdentifierDefinition.getDescription());
    if (this.getRelationshipType() == null
        && externalIdentifierDefinition.getMappingTypes().size() == 1) {
      // If the relationship type is not set, and there is only one mapping type, set it.
      // This is to ensure that the relationship type is always set when there is only one mapping
      // type.
      this.setRelationshipType(externalIdentifierDefinition.getMappingTypes().iterator().next());
    } else if (this.getRelationshipType() == null) {
      // If the relationship type is not set, and there are multiple mapping types, throw an error.
      throw new IllegalArgumentException(
          "ExternalIdentifierDefinition has multiple mapping types, but relationshipType is not set.");
    }
    this.setCodeSystem(externalIdentifierDefinition.getCodeSystem());

    if (externalIdentifierDefinition.getDataType().equals(NonDefiningPropertyDataType.CODED)) {
      if (this.valueObject == null) {
        throw new IllegalArgumentException(
            "Cannot have ExternalIdentifier with null valueObject for a CODED data type. Value was: "
                + this.value);
      }
      if (this.value != null) {
        log.warning(
            "Cannot have ExternalIdentifier with both value and valueObject for a CODED data type. Value was: "
                + this.value
                + " being set to null.");
        this.value = null;
      }
    } else {
      if (this.valueObject != null) {
        log.warning(
            "Cannot have ExternalIdentifier with both value and valueObject for a non-CODED data type. ValueObject was: "
                + this.valueObject
                + " being set to null.");
        this.valueObject = null;
      }
    }
    if (externalIdentifierDefinition.getDataType().equals(NonDefiningPropertyDataType.CODED)) {
      if (this.valueObject == null) {
        throw new IllegalArgumentException(
            "Cannot have ExternalIdentifier with null valueObject for a CODED data type. Value was: "
                + this.value);
      }
      updateCodedValue(
              externalIdentifierDefinition, fhirClient, this.valueObject.getConceptId(), this)
          .block();
    }
  }

  public boolean isAdditionalFieldMismatch(
      ExternalIdentifierDefinition externalIdentifierDefinition) {
    Set<String> fieldNames =
        new HashSet<>(externalIdentifierDefinition.getAdditionalFields().keySet());
    if (additionalFields == null) {
      return !fieldNames.isEmpty();
    } else {
      return !fieldNames.equals(additionalFields.keySet());
    }
  }

  @JsonIgnore
  public boolean isUnknownCode() {
    return valueObject != null
        && valueObject.getPt() != null
        && valueObject.getPt().getTerm() != null
        && valueObject.getPt().getTerm().startsWith(UNKNOWN_CODE);
  }
}
