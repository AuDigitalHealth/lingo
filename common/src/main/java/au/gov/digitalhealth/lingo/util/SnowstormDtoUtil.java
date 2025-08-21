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

import static au.gov.digitalhealth.lingo.util.AmtConstants.SCT_AU_MODULE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.ADDITIONAL_RELATIONSHIP;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.ADDITIONAL_RELATIONSHIP_CHARACTERISTIC_TYPE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.DEFINED;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.ENTIRE_TERM_CASE_SENSITIVE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.INFERRED_RELATIONSHIP;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MAP_TARGET;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MAP_TYPE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PRIMITIVE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.SOME_MODIFIER;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.STATED_RELATIONSHIP;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE;

import au.csiro.snowstorm_client.model.*;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ReferenceSetDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.MappingType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;
import au.gov.digitalhealth.lingo.exception.AtomicDataExtractionProblem;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.lingo.product.NewConceptDetails;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.details.Quantity;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import lombok.extern.java.Log;

@Log
public class SnowstormDtoUtil {

  private SnowstormDtoUtil() {}

  /**
   * Convert a {@link SnowstormConceptMini} to a {@link SnowstormConceptMini}. Annoying that this is
   * necessary because of the odd return types from some of the generated web client.
   *
   * @param o a {@link LinkedHashMap} representing a {@link SnowstormConceptMini}
   * @return {@link SnowstormConceptMini} with the same data as the input
   */
  public static SnowstormConceptMini fromLinkedHashMap(Object o) {

    @SuppressWarnings("unchecked")
    LinkedHashMap<String, Object> map = (LinkedHashMap<String, Object>) o;
    SnowstormConceptMini component = new SnowstormConceptMini();
    component.setConceptId((String) map.get("conceptId"));
    component.setActive((Boolean) map.get("active"));
    component.setDefinitionStatus((String) map.get("definitionStatus"));
    component.setModuleId((String) map.get("moduleId"));
    component.setEffectiveTime((String) map.get("effectiveTime"));

    @SuppressWarnings("unchecked")
    LinkedHashMap<String, String> fsn = (LinkedHashMap<String, String>) map.get("fsn");
    component.setFsn(new SnowstormTermLangPojo().lang(fsn.get("lang")).term(fsn.get("term")));

    @SuppressWarnings("unchecked")
    LinkedHashMap<String, String> pt = (LinkedHashMap<String, String>) map.get("pt");
    component.setPt(new SnowstormTermLangPojo().lang(pt.get("lang")).term(pt.get("term")));
    component.id((String) map.get("id"));
    component.idAndFsnTerm((String) map.get("idAndFsnTerm"));
    return component;
  }

  public static Set<SnowstormRelationship> filterActiveStatedRelationshipByType(
      Set<SnowstormRelationship> relationships, String... type) {
    return relationships.stream()
        .filter(
            r ->
                Set.of(type)
                    .contains(
                        Objects.requireNonNull(r.getType(), "relationship must have a type")
                            .getConceptId()))
        .filter(r -> r.getActive() != null && r.getActive())
        .filter(r -> STATED_RELATIONSHIP.getValue().equals(r.getCharacteristicType()))
        .collect(Collectors.toSet());
  }

  public static Set<SnowstormRelationship> filterActiveInferredRelationshipByType(
      Set<SnowstormRelationship> relationships, String type) {
    return relationships.stream()
        .filter(
            r ->
                type.equals(
                    Objects.requireNonNull(r.getType(), "relationship must have a type")
                        .getConceptId()))
        .filter(r -> r.getActive() != null && r.getActive())
        .filter(r -> INFERRED_RELATIONSHIP.getValue().equals(r.getCharacteristicType()))
        .collect(Collectors.toSet());
  }

  public static Set<SnowstormRelationship> getRelationshipsFromAxioms(SnowstormConcept concept) {
    return getSingleAxiom(concept).getRelationships();
  }

  public static boolean inferredRelationshipOfTypeExists(
      Set<SnowstormRelationship> subRoleGroup, String type) {
    return !filterActiveInferredRelationshipByType(subRoleGroup, type).isEmpty();
  }

  public static boolean relationshipOfTypeExists(
      Set<SnowstormRelationship> subRoleGroup, String... type) {
    return !filterActiveStatedRelationshipByType(subRoleGroup, type).isEmpty();
  }

  public static String getSingleActiveConcreteValue(
      Set<SnowstormRelationship> relationships, String type) {
    return Objects.requireNonNull(
            findSingleRelationshipsForActiveInferredByType(relationships, type).getConcreteValue(),
            "relationship of type " + type + " does not have a concrete value as expected")
        .getValue();
  }

  public static BigDecimal getSingleActiveBigDecimal(
      Set<SnowstormRelationship> relationships, String type) {
    return new BigDecimal(getSingleActiveConcreteValue(relationships, type));
  }

  public static BigDecimal getSingleOptionalActiveBigDecimal(
      Set<SnowstormRelationship> relationships, String type) {
    if (relationshipOfTypeExists(relationships, type)) {
      return getSingleActiveBigDecimal(relationships, type);
    }
    return null;
  }

  public static @NotNull SnowstormRelationship findSingleRelationshipsForActiveInferredByType(
      Set<SnowstormRelationship> relationships, String type) {
    Set<SnowstormRelationship> filteredRelationships =
        filterActiveStatedRelationshipByType(relationships, type);

    if (filteredRelationships.size() != 1) {
      throw new AtomicDataExtractionProblem(
          "Expected 1 " + type + " relationship but found " + filteredRelationships.size(),
          relationships.iterator().next().getSourceId());
    }

    return filteredRelationships.iterator().next();
  }

  public static Set<SnowstormRelationship> getActiveRelationshipsInRoleGroup(
      Integer group, Set<SnowstormRelationship> relationships) {
    return relationships.stream()
        .filter(r -> Objects.equals(r.getGroupId(), group))
        .filter(r -> r.getActive() != null && r.getActive())
        .filter(r -> "STATED_RELATIONSHIP".equals(r.getCharacteristicType()))
        .collect(Collectors.toSet());
  }

  public static Set<SnowstormRelationship> getActiveRelationshipsInRoleGroup(
      SnowstormRelationship subpacksRelationship, Set<SnowstormRelationship> relationships) {
    return relationships.stream()
        .filter(r -> Objects.equals(r.getGroupId(), subpacksRelationship.getGroupId()))
        .filter(r -> r.getActive() != null && r.getActive())
        .filter(r -> "STATED_RELATIONSHIP".equals(r.getCharacteristicType()))
        .collect(Collectors.toSet());
  }

  public static Set<SnowstormRelationship> getActiveRelationshipsOfType(
      Set<SnowstormRelationship> relationships, String type) {
    return filterActiveStatedRelationshipByType(relationships, type);
  }

  public static SnowstormConceptMini getSingleOptionalActiveTarget(
      Set<SnowstormRelationship> relationships, String type) {
    if (relationshipOfTypeExists(relationships, type)) {
      return getSingleActiveTarget(relationships, type);
    }
    return null;
  }

  public static SnowstormConceptMini getSingleActiveTarget(
      Set<SnowstormRelationship> relationships, String type) {
    SnowstormConceptMini target =
        findSingleRelationshipsForActiveInferredByType(relationships, type).getTarget();

    if (target == null) {
      throw new AtomicDataExtractionProblem(
          "relationship of type " + type + " does not have a target as expected",
          relationships.iterator().next().getSourceId());
    }

    // need to fix the id and fsn because it isn't set properly for some reason
    target.setIdAndFsnTerm(
        target.getConceptId()
            + " | "
            + Objects.requireNonNull(
                    target.getFsn(),
                    "concept " + target.getConceptId() + "did not have an FSN populated")
                .getTerm()
            + " |");
    return target;
  }

  public static SnowstormRelationship getSnowstormRelationship(
      LingoConstants type, LingoConstants destination, int group, String moduleId) {
    SnowstormRelationship relationship =
        createBaseSnowstormRelationship(type, group, STATED_RELATIONSHIP, moduleId);
    relationship.setConcrete(false);
    relationship.setDestinationId(destination.getValue());
    relationship.setTarget(toSnowstormConceptMini(destination));
    return relationship;
  }

  public static SnowstormRelationship getSnowstormRelationship(
      LingoConstants type,
      String destinationId,
      String destinationName,
      int group,
      String moduleId) {
    SnowstormRelationship relationship =
        createBaseSnowstormRelationship(type, group, STATED_RELATIONSHIP, moduleId);
    relationship.setConcrete(false);
    relationship.setDestinationId(destinationId);
    relationship.setTarget(toSnowstormConceptMini(destinationId, destinationName));
    return relationship;
  }

  public static SnowstormRelationship getSnowstormRelationship(
      LingoConstants type, Node destination, int group, String moduleId) {
    SnowstormRelationship relationship =
        createBaseSnowstormRelationship(type, group, STATED_RELATIONSHIP, moduleId);
    relationship.setConcrete(false);
    relationship.setDestinationId(destination.getConceptId());
    relationship.setTarget(toSnowstormConceptMini(destination));
    return relationship;
  }

  public static SnowstormRelationship getSnowstormRelationship(
      LingoConstants type,
      SnowstormConceptMini destination,
      int group,
      SnomedConstants characteristicType,
      String moduleId) {
    SnowstormRelationship relationship =
        createBaseSnowstormRelationship(type, group, characteristicType, moduleId);
    relationship.setConcrete(false);
    relationship.setDestinationId(destination.getConceptId());
    relationship.setTarget(destination);
    return relationship;
  }

  public static SnowstormRelationship getSnowstormRelationship(
      String typeId,
      String typeTerm,
      SnowstormConceptMini destination,
      int group,
      SnomedConstants characteristicType,
      @NotEmpty String moduleId) {
    SnowstormRelationship relationship =
        createBaseSnowstormRelationship(typeId, typeTerm, group, characteristicType, moduleId);
    relationship.setConcrete(false);
    relationship.setDestinationId(destination.getConceptId());
    relationship.setTarget(destination);
    return relationship;
  }

  public static SnowstormRelationship getSnowstormDatatypeComponent(
      LingoConstants propertyType,
      String value,
      DataTypeEnum type,
      int group,
      SnomedConstants characteristicType,
      String moduleId) {
    String prefixedValue = null;
    if (Objects.requireNonNull(type) == DataTypeEnum.DECIMAL || type == DataTypeEnum.INTEGER) {
      prefixedValue = "#" + value;
    } else if (type == DataTypeEnum.STRING) {
      prefixedValue = "\"" + value + "\"";
    }
    SnowstormRelationship relationship =
        createBaseSnowstormRelationship(propertyType, group, characteristicType, moduleId);
    relationship.setConcrete(true);
    relationship.setConcreteValue(
        new SnowstormConcreteValue().value(value).dataType(type).valueWithPrefix(prefixedValue));
    return relationship;
  }

  private static SnowstormRelationship createBaseSnowstormRelationship(
      LingoConstants type, int group, SnomedConstants characteristicType, String moduleId) {
    return createBaseSnowstormRelationship(
        type.getValue(), type.getLabel(), group, characteristicType, moduleId);
  }

  private static SnowstormRelationship createBaseSnowstormRelationship(
      String type,
      String typeTerm,
      int group,
      SnomedConstants characteristicType,
      String moduleId) {
    SnowstormRelationship relationship = new SnowstormRelationship();
    relationship.setActive(true);
    relationship.setModuleId(moduleId);
    relationship.setReleased(false);
    relationship.setGrouped(group > 0);
    relationship.setGroupId(group);
    relationship.setRelationshipGroup(group);
    relationship.setType(toSnowstormConceptMini(type, typeTerm));
    relationship.setTypeId(type);
    relationship.setModifier("EXISTENTIAL");
    relationship.setModifierId(SOME_MODIFIER.getValue());
    relationship.setCharacteristicType(characteristicType.getValue());
    if (characteristicType == STATED_RELATIONSHIP) {
      relationship.setCharacteristicTypeId(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE.getValue());
    } else if (characteristicType == ADDITIONAL_RELATIONSHIP) {
      relationship.setCharacteristicTypeId(ADDITIONAL_RELATIONSHIP_CHARACTERISTIC_TYPE.getValue());
    } else {
      throw new IllegalArgumentException("Unknown characteristic type " + characteristicType);
    }

    relationship.setInferred(null);
    return relationship;
  }

  public static SnowstormConceptMini toSnowstormConceptMini(SnowstormConceptView c) {
    return new SnowstormConceptMini()
        .fsn(c.getFsn())
        .pt(c.getPt())
        .id(c.getConceptId())
        .conceptId(c.getConceptId())
        .active(c.getActive())
        .definitionStatus(c.getDefinitionStatusId())
        .definitionStatusId(c.getDefinitionStatusId())
        .effectiveTime(c.getEffectiveTime())
        .moduleId(c.getModuleId());
  }

  public static SnowstormConceptMini toSnowstormConceptMini(SnowstormConcept c) {
    String definitionStatusId = c.getDefinitionStatusId();
    if (definitionStatusId == null) {
      definitionStatusId =
          c.getDefinitionStatus().equals(PRIMITIVE.getLabel())
              ? PRIMITIVE.getValue()
              : DEFINED.getValue();
    }
    return new SnowstormConceptMini()
        .fsn(c.getFsn())
        .pt(c.getPt())
        .id(c.getConceptId())
        .conceptId(c.getConceptId())
        .active(c.getActive())
        .definitionStatus(c.getDefinitionStatus())
        .definitionStatusId(definitionStatusId)
        .effectiveTime(c.getEffectiveTime())
        .moduleId(c.getModuleId());
  }

  public static SnowstormConceptView toSnowstormConceptView(SnowstormConcept c) {
    String definitionStatusId = c.getDefinitionStatusId();
    if (definitionStatusId == null) {
      definitionStatusId =
          c.getDefinitionStatus().equals(PRIMITIVE.getLabel())
              ? PRIMITIVE.getValue()
              : DEFINED.getValue();
    }
    return new SnowstormConceptView()
        .fsn(c.getFsn())
        .pt(c.getPt())
        .descriptions(c.getDescriptions())
        .conceptId(c.getConceptId())
        .active(c.getActive())
        .definitionStatusId(definitionStatusId)
        .classAxioms(c.getClassAxioms())
        .gciAxioms(c.getGciAxioms())
        .relationships(c.getRelationships())
        .effectiveTime(c.getEffectiveTime())
        .moduleId(c.getModuleId());
  }

  public static SnowstormConceptMini toSnowstormConceptMini(Node c) {
    if (c.getConcept() != null) {
      return c.getConcept();
    }
    return new SnowstormConceptMini()
        .fsn(new SnowstormTermLangPojo().term(c.getFullySpecifiedName()).lang("en"))
        .pt(new SnowstormTermLangPojo().term(c.getPreferredTerm()).lang("en"))
        .conceptId(c.getConceptId())
        .active(true)
        .definitionStatus(
            c.getNewConceptDetails().getAxioms().iterator().next().getDefinitionStatus())
        .definitionStatusId(
            c.getNewConceptDetails().getAxioms().iterator().next().getDefinitionStatus())
        .effectiveTime(null)
        .moduleId(SCT_AU_MODULE.getValue());
  }

  public static boolean addQuantityIfNotNull(
      Quantity quantity,
      int decimalScale,
      Set<SnowstormRelationship> relationships,
      LingoConstants valueType,
      LingoConstants unitType,
      DataTypeEnum datatype,
      int group,
      ModelConfiguration modelConfiguration) {
    if (quantity != null && quantity.getValue() != null && quantity.getUnit() != null) {
      relationships.add(
          getSnowstormDatatypeComponent(
              valueType,
              BigDecimalFormatter.formatBigDecimal(
                  quantity.getValue(), decimalScale, modelConfiguration.isTrimWholeNumbers()),
              datatype,
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      relationships.add(
          getSnowstormRelationship(
              unitType,
              quantity.getUnit(),
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      return true;
    }
    return false;
  }

  public static void addRelationshipIfNotNull(
      Set<SnowstormRelationship> relationships,
      SnowstormConceptMini property,
      LingoConstants type,
      int group,
      String moduleId) {
    if (property != null) {
      relationships.add(
          getSnowstormRelationship(type, property, group, STATED_RELATIONSHIP, moduleId));
    }
  }

  public static void addSynoynms(
      SnowstormConceptView concept, Set<SnowstormDescription> descriptions) {
    if (descriptions == null) {
      return;
    }

    descriptions.forEach(
        snowstormDescription -> {
          SnowstormDescription desc =
              new SnowstormDescription()
                  .active(true)
                  .lang("en")
                  .term(snowstormDescription.getTerm())
                  .type(SnomedConstants.SYNONYM.toString())
                  .caseSignificance(ENTIRE_TERM_CASE_SENSITIVE.getValue())
                  .moduleId(SCT_AU_MODULE.getValue())
                  .acceptabilityMap(
                      // TODO: this needs to be set up for ireland.
                      Map.of(AmtConstants.ADRS.getValue(), SnomedConstants.ACCEPTABLE.getValue()));
          concept.getDescriptions().add(desc);
        });
  }

  public static void addDescription(
      SnowstormConceptView concept,
      String term,
      String type,
      ModelConfiguration modelConfiguration,
      String caseSignificance) {
    Set<SnowstormDescription> descriptions = concept.getDescriptions();

    descriptions.add(
        new SnowstormDescription()
            .active(true)
            .lang("en")
            .term(term)
            .type(type)
            .caseSignificance(caseSignificance)
            .moduleId(modelConfiguration.getModuleId())
            .acceptabilityMap(modelConfiguration.getAcceptabilityMap()));

    concept.setDescriptions(descriptions);
  }

  public static void removeDescription(SnowstormConceptView concept, String term, String type) {
    concept
        .getDescriptions()
        .removeIf(d -> d.getTerm().equals(term) && Objects.equals(d.getType(), type));
  }

  public static String getFsnTerm(@NotNull SnowstormConceptMini snowstormConceptMini) {
    if (snowstormConceptMini.getFsn() == null) {
      throw new ResourceNotFoundProblem("FSN is null for " + snowstormConceptMini.getConceptId());
    }
    return snowstormConceptMini.getFsn().getTerm();
  }

  public static String getPtTerm(SnowstormConceptMini snowstormConceptMini) {
    if (snowstormConceptMini.getPt() == null) {
      throw new ResourceNotFoundProblem("PT is null for " + snowstormConceptMini.getConceptId());
    }
    return snowstormConceptMini.getPt().getTerm();
  }

  public static SnowstormReferenceSetMemberViewComponent toSnowstormReferenceSetMember(
      SnowstormReferenceSetMember referenceSetMember) {
    return new SnowstormReferenceSetMemberViewComponent()
        .active(referenceSetMember.getActive())
        .moduleId(referenceSetMember.getModuleId())
        .memberId(referenceSetMember.getMemberId())
        .effectiveTime(referenceSetMember.getEffectiveTime())
        .released(referenceSetMember.getReleased())
        .releasedEffectiveTime(referenceSetMember.getReleasedEffectiveTime())
        .refsetId(referenceSetMember.getRefsetId())
        .referencedComponentId(referenceSetMember.getReferencedComponentId())
        .additionalFields(referenceSetMember.getAdditionalFields());
  }

  public static SnowstormConceptView toSnowstormConceptView(
      Node node, ModelConfiguration modelConfiguration) {
    SnowstormConceptView concept = new SnowstormConceptView();

    if (node.getNewConceptDetails().getConceptId() != null) {
      concept.setConceptId(node.getNewConceptDetails().getConceptId().toString());
    }
    concept.setModuleId(modelConfiguration.getModuleId());

    NewConceptDetails newConceptDetails = node.getNewConceptDetails();

    SnowstormDtoUtil.addDescription(
        concept,
        newConceptDetails.getPreferredTerm(),
        SnomedConstants.SYNONYM.getValue(),
        modelConfiguration,
        // todo need to revise hard coding of ENTIRE_TERM_CASE_SENSITIVE
        ENTIRE_TERM_CASE_SENSITIVE.getValue());
    SnowstormDtoUtil.addDescription(
        concept,
        newConceptDetails.getFullySpecifiedName(),
        SnomedConstants.FSN.getValue(),
        modelConfiguration,
        ENTIRE_TERM_CASE_SENSITIVE.getValue());
    SnowstormDtoUtil.addSynoynms(concept, node.getNewConceptDetails().getDescriptions());

    concept.setActive(true);
    concept.setDefinitionStatusId(
        newConceptDetails.getAxioms().stream()
                .anyMatch(a -> DEFINED.getValue().equals(a.getDefinitionStatus()))
            ? DEFINED.getValue()
            : PRIMITIVE.getValue());
    concept.setClassAxioms(newConceptDetails.getAxioms());
    concept.setRelationships(newConceptDetails.getNonDefiningProperties());

    concept.setConceptId(newConceptDetails.getSpecifiedConceptId());
    if (concept.getConceptId() == null) {
      concept.setConceptId(newConceptDetails.getConceptId().toString());
    }
    return concept;
  }

  public static SnowstormConceptView toSnowstormConceptView(
      Node node, ModelConfiguration modelConfiguration, @NotNull SnowstormConcept existingConcept) {
    SnowstormConceptView conceptView = toSnowstormConceptView(node, modelConfiguration);

    // merge the existing concept's properties into the new concept view
    if (existingConcept != null) {
      // Merge descriptions
      if (existingConcept.getDescriptions() != null) {
        // add in the existing descriptions that are not the FSN or PT
        conceptView
            .getDescriptions()
            .addAll(
                existingConcept.getDescriptions().stream()
                    .filter(
                        d ->
                            !d.getTerm().equals(existingConcept.getFsn().getTerm())
                                && !d.getTerm().equals(existingConcept.getPt().getTerm()))
                    .collect(Collectors.toSet()));
      }
      // no need to keep the inferred axiomx - classification is required anyway
      // class axioms have been updated so nothing to keep from the existing concept

      // add back any GCIs
      conceptView.setGciAxioms(existingConcept.getGciAxioms());
    }

    return conceptView;
  }

  public static Set<SnowstormReferenceSetMemberViewComponent>
      getExternalIdentifierReferenceSetEntries(
          Collection<ExternalIdentifier> externalIdentifiers,
          ModelConfiguration modelConfiguration,
          ModelLevelType modelLevelType) {

    Map<String, ExternalIdentifierDefinition> mappingRefsetMap =
        modelConfiguration.getMappingsByName();
    Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers = new HashSet<>();
    for (ExternalIdentifier identifier : externalIdentifiers) {
      ExternalIdentifierDefinition externalIdentifierDefinition =
          mappingRefsetMap.get(identifier.getIdentifierScheme());

      if (externalIdentifierDefinition == null) {
        throw new ProductAtomicDataValidationProblem(
            "Unknown identifier scheme " + identifier.getIdentifierScheme());
      }

      if (identifier.isAdditionalFieldMismatch(externalIdentifierDefinition)) {
        throw new ProductAtomicDataValidationProblem(
            "ExternalIdentifierDefinition additional fields do not match the reference set member additional fields. "
                + "Expected: "
                + String.join(", ", externalIdentifierDefinition.getAdditionalFields().keySet())
                + ", but got: "
                + String.join(", ", identifier.getAdditionalFields().keySet())
                + " for identifier: "
                + identifier.getTitle());
      }

      if (externalIdentifierDefinition.getModelLevels().contains(modelLevelType)) {

        Map<String, String> additionalFields = new HashMap<>();

        if (externalIdentifierDefinition.getDataType().equals(NonDefiningPropertyDataType.CODED)) {
          additionalFields.put("mapTarget", identifier.getValueObject().getConceptId());
        } else {
          additionalFields.put("mapTarget", identifier.getValue());
        }

        if (!MappingType.RELATED.equals(identifier.getRelationshipType())) {
          additionalFields.put("mapType", identifier.getRelationshipType().getSctid());
        }

        if (identifier.getAdditionalFields() != null) {
          identifier
              .getAdditionalFields()
              .forEach(
                  (key, value) ->
                      additionalFields.put(
                          key,
                          value.getValue() == null
                              ? value.getValueObject().getConceptId()
                              : value.getValue()));
        }

        SnowstormReferenceSetMemberViewComponent refsetMember =
            new SnowstormReferenceSetMemberViewComponent()
                .active(true)
                .refsetId(externalIdentifierDefinition.getIdentifier())
                .additionalFields(additionalFields);

        referenceSetMembers.add(refsetMember);
      }
    }

    return referenceSetMembers;
  }

  public static SnowstormReferenceSetMemberViewComponent
      createSnowstormReferenceSetMemberViewComponent(
          NonDefiningBase baseProperty,
          String referencedComponentId,
          Collection<ExternalIdentifierDefinition> externalIdentifierDefinitions,
          Collection<ReferenceSetDefinition> referenceSetDefinitions) {
    switch (baseProperty.getType()) {
      case REFERENCE_SET -> {
        return createSnowstormReferenceSetMemberViewComponent(
            (ReferenceSet) baseProperty, referencedComponentId, referenceSetDefinitions);
      }
      case EXTERNAL_IDENTIFIER -> {
        return createSnowstormReferenceSetMemberViewComponent(
            (ExternalIdentifier) baseProperty,
            referencedComponentId,
            externalIdentifierDefinitions);
      }
      default ->
          throw new ProductAtomicDataValidationProblem(
              "Cannot create a reference set member for a property of type "
                  + baseProperty.getType());
    }
  }

  public static SnowstormReferenceSetMemberViewComponent
      createSnowstormReferenceSetMemberViewComponent(
          ExternalIdentifier externalIdentifier,
          String referencedComponentId,
          Collection<ExternalIdentifierDefinition> externalIdentifierDefinitions) {

    ExternalIdentifierDefinition externalIdentifierDefinition =
        externalIdentifierDefinitions.stream()
            .filter(m -> m.getName().equals(externalIdentifier.getIdentifierScheme()))
            .findFirst()
            .orElseThrow(
                () ->
                    new ProductAtomicDataValidationProblem(
                        "Unknown identifier scheme " + externalIdentifier.getIdentifierScheme()));

    Map<String, String> additionalFields = new HashMap<>();

    additionalFields.put(MAP_TARGET.getValue(), externalIdentifier.getValue());

    if (!MappingType.RELATED.equals(externalIdentifier.getRelationshipType())) {
      additionalFields.put(
          MAP_TYPE.getValue(), externalIdentifier.getRelationshipType().getSctid());
    }

    return new SnowstormReferenceSetMemberViewComponent()
        .active(true)
        .referencedComponentId(referencedComponentId)
        .refsetId(externalIdentifierDefinition.getIdentifier())
        .additionalFields(additionalFields);
  }

  public static SnowstormReferenceSetMemberViewComponent
      createSnowstormReferenceSetMemberViewComponent(
          ReferenceSet referenceSet,
          String referencedComponentId,
          Collection<ReferenceSetDefinition> referenceSetDefinitionDefinitions) {

    ReferenceSetDefinition referenceSetDefinition =
        referenceSetDefinitionDefinitions.stream()
            .filter(m -> m.getName().equals(referenceSet.getIdentifierScheme()))
            .findFirst()
            .orElseThrow(
                () ->
                    new ProductAtomicDataValidationProblem(
                        "Unknown identifier scheme " + referenceSet.getIdentifierScheme()));

    return new SnowstormReferenceSetMemberViewComponent()
        .active(true)
        .referencedComponentId(referencedComponentId)
        .refsetId(referenceSetDefinition.getIdentifier());
  }

  public static String getIdAndFsnTerm(SnowstormConceptMini component) {
    return component.getConceptId()
        + "|"
        + Objects.requireNonNull(component.getFsn()).getTerm()
        + "|";
  }

  public static SnowstormConceptMini toSnowstormConceptMini(LingoConstants lingoConstants) {
    return new SnowstormConceptMini()
        .conceptId(lingoConstants.getValue())
        .id(lingoConstants.getValue())
        .definitionStatus(PRIMITIVE.name())
        .definitionStatusId(PRIMITIVE.getValue())
        .active(true)
        .fsn(new SnowstormTermLangPojo().lang("en").term(lingoConstants.getLabel()))
        .pt(
            new SnowstormTermLangPojo()
                .lang("en")
                .term(
                    lingoConstants
                        .getLabel()
                        .substring(0, lingoConstants.getLabel().indexOf("(") - 1)));
  }

  public static SnowstormConceptMini toSnowstormConceptMini(String id, String term) {
    return new SnowstormConceptMini()
        .conceptId(id)
        .id(id)
        .definitionStatus(PRIMITIVE.name())
        .definitionStatusId(PRIMITIVE.getValue())
        .active(true)
        .fsn(new SnowstormTermLangPojo().lang("en").term(term))
        .pt(new SnowstormTermLangPojo().lang("en").term(term.substring(0, term.indexOf("(") - 1)));
  }

  public static SnowstormAxiom getSingleAxiom(SnowstormConceptView concept) {
    if (getActiveClassAxioms(concept).size() != 1) {
      throw new AtomicDataExtractionProblem(
          "Expected 1 class axiom but found " + getActiveClassAxioms(concept).size(),
          concept.getConceptId());
    }
    return getActiveClassAxioms(concept).iterator().next();
  }

  public static SnowstormAxiom getSingleAxiom(SnowstormConcept concept) {
    if (getActiveClassAxioms(concept).size() != 1) {
      throw new AtomicDataExtractionProblem(
          "Expected 1 class axiom but found " + getActiveClassAxioms(concept).size(),
          concept.getConceptId());
    }
    return getActiveClassAxioms(concept).iterator().next();
  }

  public static Set<SnowstormAxiom> getActiveClassAxioms(SnowstormConcept concept) {
    return concept.getClassAxioms().stream()
        .filter(a -> a.getActive() == null || a.getActive())
        .collect(Collectors.toSet());
  }

  public static Set<SnowstormAxiom> getActiveClassAxioms(SnowstormConceptView concept) {
    return concept.getClassAxioms().stream()
        .filter(a -> a.getActive() == null || a.getActive())
        .collect(Collectors.toSet());
  }

  public static SnowstormAxiom getSingleAxiom(NewConceptDetails concept) {
    SnowstormAxiom axiom = concept.getAxioms().iterator().next();
    if (concept.getAxioms().size() > 1) {
      throw new AtomicDataExtractionProblem(
          "Cannot handle more than one axiom determining brands",
          concept.getConceptId().toString());
    }
    return axiom;
  }

  /**
   * Clone the relationships in the set to a new set of new SnowstormRelationship objects with blank
   * ids
   *
   * @param existingRelationships the relationships to clone
   * @param moduleId the module id to set on the cloned relationships
   * @return a new set of relationships with blank ids
   */
  public static Set<SnowstormRelationship> cloneNewRelationships(
      Set<SnowstormRelationship> existingRelationships, @NotEmpty String moduleId) {

    return existingRelationships.stream()
        .map(
            r ->
                new SnowstormRelationship()
                    .active(r.getActive())
                    .characteristicType(r.getCharacteristicType())
                    .concrete(r.getConcreteValue() != null)
                    .concreteValue(
                        r.getConcreteValue() == null
                            ? null
                            : new SnowstormConcreteValue()
                                .dataType(r.getConcreteValue().getDataType())
                                .value(r.getConcreteValue().getValue())
                                .valueWithPrefix(r.getConcreteValue().getValueWithPrefix()))
                    .destinationId(r.getDestinationId())
                    .effectiveTime(r.getEffectiveTime())
                    .groupId(r.getGroupId())
                    .grouped(r.getGrouped())
                    .moduleId(moduleId)
                    .modifier(r.getModifier())
                    .sourceId(r.getSourceId())
                    .target(r.getTarget())
                    .type(r.getType())
                    .typeId(r.getTypeId()))
        .collect(Collectors.toSet());
  }

  public static SnowstormDescription getFsnFromDescriptions(
      Set<SnowstormDescription> descriptions) {

    return descriptions.stream()
        .filter(
            description -> {
              return description.getType().equals("FSN") && description.getActive();
            })
        .findFirst()
        .orElse(null);
  }

  public static SnowstormDescription getPreferredTerm(
      Set<SnowstormDescription> descriptions, String dialectKey) {
    return descriptions.stream()
        .filter(
            description ->
                Objects.equals(description.getType(), "SYNONYM")
                    && description.getAcceptabilityMap() != null
                    && description.getAcceptabilityMap().get(dialectKey) != null
                    && description.getAcceptabilityMap().get(dialectKey).equals("PREFERRED"))
        .findFirst()
        .orElse(null);
  }

  public static SnowstormConceptView cloneConceptView(SnowstormConceptView existingConcept) {
    Set<SnowstormDescription> desc = new HashSet<>(existingConcept.getDescriptions());
    return new SnowstormConceptView()
        .fsn(existingConcept.getFsn())
        .pt(existingConcept.getPt())
        .descriptions(desc)
        .conceptId(existingConcept.getConceptId())
        .active(existingConcept.getActive())
        .definitionStatusId(existingConcept.getDefinitionStatusId())
        .classAxioms(existingConcept.getClassAxioms())
        .gciAxioms(existingConcept.getGciAxioms())
        .relationships(existingConcept.getRelationships())
        .effectiveTime(existingConcept.getEffectiveTime())
        .moduleId(existingConcept.getModuleId());
  }

  public static SnowstormConcept cloneConcept(SnowstormConcept existingConcept) {
    Set<SnowstormDescription> desc = new HashSet<>(existingConcept.getDescriptions());
    return new SnowstormConcept()
        .definitionStatus(existingConcept.getDefinitionStatus())
        .definitionStatusId(existingConcept.getDefinitionStatusId())
        .fsn(existingConcept.getFsn())
        .pt(existingConcept.getPt())
        .descriptions(desc)
        .conceptId(existingConcept.getConceptId())
        .active(existingConcept.getActive())
        .definitionStatusId(existingConcept.getDefinitionStatusId())
        .classAxioms(existingConcept.getClassAxioms())
        .gciAxioms(existingConcept.getGciAxioms())
        .relationships(existingConcept.getRelationships())
        .effectiveTime(existingConcept.getEffectiveTime())
        .moduleId(existingConcept.getModuleId());
  }

  public static SnowstormDescription cloneSnowstormDescription(SnowstormDescription description) {
    return new SnowstormDescription()
        // Required fields (marked with @Nonnull)
        .term(description.getTerm())
        .languageCode(description.getLanguageCode())
        .typeId(description.getTypeId())
        .caseSignificanceId(description.getCaseSignificanceId())

        // Optional fields (marked with @Nullable)
        .internalId(description.getInternalId())
        .path(description.getPath())
        .start(description.getStart())
        .end(description.getEnd())
        .deleted(description.getDeleted())
        .changed(description.getChanged())
        .active(description.getActive())
        .moduleId(description.getModuleId())
        .effectiveTimeI(description.getEffectiveTimeI())
        .released(description.getReleased())
        .releaseHash(description.getReleaseHash())
        .releasedEffectiveTime(description.getReleasedEffectiveTime())
        .descriptionId(description.getDescriptionId())
        .termFolded(description.getTermFolded())
        .termLen(description.getTermLen())
        .tag(description.getTag())
        .conceptId(description.getConceptId())
        .lang(description.getLang())
        .caseSignificance(description.getCaseSignificance())
        .type(description.getType())
        .effectiveTime(description.getEffectiveTime())
        .inactivationIndicator(description.getInactivationIndicator())

        // Collection fields - creating new instances to avoid sharing references
        .acceptabilityMap(
            description.getAcceptabilityMap() != null
                ? new HashMap<>(description.getAcceptabilityMap())
                : new HashMap<>())
        .acceptabilityMapFromLangRefsetMembers(
            description.getAcceptabilityMapFromLangRefsetMembers() != null
                ? new HashMap<>(description.getAcceptabilityMapFromLangRefsetMembers())
                : new HashMap<>())
        .associationTargets(
            description.getAssociationTargets() != null
                ? new HashMap<>(description.getAssociationTargets())
                : new HashMap<>());
  }
}
