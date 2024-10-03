package com.csiro.snomio.util;

import static com.csiro.snomio.util.AmtConstants.ARTGID_REFSET;
import static com.csiro.snomio.util.AmtConstants.ARTGID_SCHEME;
import static com.csiro.snomio.util.AmtConstants.SCT_AU_MODULE;
import static com.csiro.snomio.util.SnomedConstants.DEFINED;
import static com.csiro.snomio.util.SnomedConstants.ENTIRE_TERM_CASE_SENSITIVE;
import static com.csiro.snomio.util.SnomedConstants.PRIMITIVE;
import static com.csiro.snomio.util.SnomedConstants.SOME_MODIFIER;
import static com.csiro.snomio.util.SnomedConstants.STATED_RELATIONSHIP;
import static com.csiro.snomio.util.SnomedConstants.STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.csiro.snowstorm_client.model.SnowstormDescription;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import com.csiro.snomio.exception.AtomicDataExtractionProblem;
import com.csiro.snomio.exception.ProductAtomicDataValidationProblem;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.product.NewConceptDetails;
import com.csiro.snomio.product.Node;
import com.csiro.snomio.product.details.ExternalIdentifier;
import com.csiro.snomio.product.details.PackageDetails;
import com.csiro.snomio.product.details.ProductDetails;
import com.csiro.snomio.product.details.Quantity;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
      Set<SnowstormRelationship> relationships, String type) {
    return relationships.stream()
        .filter(r -> r.getType().getConceptId().equals(type))
        .filter(SnowstormRelationship::getActive)
        .filter(r -> r.getCharacteristicType().equals(STATED_RELATIONSHIP.getValue()))
        .collect(Collectors.toSet());
  }

  public static Set<SnowstormRelationship> getRelationshipsFromAxioms(SnowstormConcept concept) {
    if (concept.getClassAxioms().size() != 1) {
      throw new AtomicDataExtractionProblem(
          "Expected 1 class axiom but found " + concept.getClassAxioms().size(),
          concept.getConceptId());
    }
    return concept.getClassAxioms().iterator().next().getRelationships();
  }

  public static boolean relationshipOfTypeExists(
      Set<SnowstormRelationship> subRoleGroup, String type) {
    return !filterActiveStatedRelationshipByType(subRoleGroup, type).isEmpty();
  }

  public static String getSingleActiveConcreteValue(
      Set<SnowstormRelationship> relationships, String type) {
    return findSingleRelationshipsForActiveInferredByType(relationships, type)
        .iterator()
        .next()
        .getConcreteValue()
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

  public static Set<SnowstormRelationship> findSingleRelationshipsForActiveInferredByType(
      Set<SnowstormRelationship> relationships, String type) {
    Set<SnowstormRelationship> filteredRelationships =
        filterActiveStatedRelationshipByType(relationships, type);

    if (filteredRelationships.size() != 1) {
      throw new AtomicDataExtractionProblem(
          "Expected 1 " + type + " relationship but found " + filteredRelationships.size(),
          relationships.iterator().next().getSourceId());
    }

    return filteredRelationships;
  }

  public static Set<SnowstormRelationship> getActiveRelationshipsInRoleGroup(
      SnowstormRelationship subpacksRelationship, Set<SnowstormRelationship> relationships) {
    return relationships.stream()
        .filter(r -> r.getGroupId().equals(subpacksRelationship.getGroupId()))
        .filter(SnowstormRelationship::getActive)
        .filter(r -> r.getCharacteristicType().equals("STATED_RELATIONSHIP"))
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
        findSingleRelationshipsForActiveInferredByType(relationships, type)
            .iterator()
            .next()
            .getTarget();

    // need to fix the id and fsn because it isn't set properly for some reason
    target.setIdAndFsnTerm(target.getConceptId() + " | " + target.getFsn().getTerm() + " |");
    return target;
  }

  public static SnowstormRelationship getSnowstormRelationship(
      SnomioConstants type, SnomioConstants destination, int group) {
    SnowstormRelationship relationship = createBaseSnowstormRelationship(type, group);
    relationship.setConcrete(false);
    relationship.setDestinationId(destination.getValue());
    relationship.setTarget(toSnowstormConceptMini(destination));
    return relationship;
  }

  public static SnowstormRelationship getSnowstormRelationship(
      SnomioConstants type, Node destination, int group) {
    SnowstormRelationship relationship = createBaseSnowstormRelationship(type, group);
    relationship.setConcrete(false);
    relationship.setDestinationId(destination.getConceptId());
    relationship.setTarget(toSnowstormConceptMini(destination));
    return relationship;
  }

  public static SnowstormRelationship getSnowstormRelationship(
      SnomioConstants type, SnowstormConceptMini destination, int group) {
    SnowstormRelationship relationship = createBaseSnowstormRelationship(type, group);
    relationship.setConcrete(false);
    relationship.setDestinationId(destination.getConceptId());
    relationship.setTarget(destination);
    return relationship;
  }

  public static SnowstormRelationship getSnowstormDatatypeComponent(
      SnomioConstants propertyType, String value, DataTypeEnum type, int group) {
    String prefixedValue = null;
    if (Objects.requireNonNull(type) == DataTypeEnum.DECIMAL || type == DataTypeEnum.INTEGER) {
      prefixedValue = "#" + value;
    } else if (type == DataTypeEnum.STRING) {
      prefixedValue = "\"" + value + "\"";
    }
    SnowstormRelationship relationship = createBaseSnowstormRelationship(propertyType, group);
    relationship.setConcrete(true);
    relationship.setConcreteValue(
        new SnowstormConcreteValue().value(value).dataType(type).valueWithPrefix(prefixedValue));
    return relationship;
  }

  private static SnowstormRelationship createBaseSnowstormRelationship(
      SnomioConstants type, int group) {
    SnowstormRelationship relationship = new SnowstormRelationship();
    relationship.setActive(true);
    relationship.setModuleId(SCT_AU_MODULE.getValue());
    relationship.setReleased(false);
    relationship.setGrouped(group > 0);
    relationship.setGroupId(group);
    relationship.setRelationshipGroup(group);
    relationship.setType(toSnowstormConceptMini(type));
    relationship.setTypeId(type.getValue());
    relationship.setModifier("EXISTENTIAL");
    relationship.setModifierId(SOME_MODIFIER.getValue());
    relationship.setCharacteristicType(STATED_RELATIONSHIP.getValue());
    relationship.setCharacteristicTypeId(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE.getValue());
    relationship.setCharacteristicTypeId(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE.getValue());
    relationship.setInferred(false);
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

  public static void addQuantityIfNotNull(
      Quantity quantity,
      int decimalScale,
      Set<SnowstormRelationship> relationships,
      SnomioConstants valueType,
      SnomioConstants unitType,
      DataTypeEnum datatype,
      int group) {
    if (quantity != null) {
      relationships.add(
          getSnowstormDatatypeComponent(
              valueType,
              BigDecimalFormatter.formatBigDecimal(quantity.getValue(), decimalScale),
              datatype,
              group));
      relationships.add(getSnowstormRelationship(unitType, quantity.getUnit(), group));
    }
  }

  public static void addRelationshipIfNotNull(
      Set<SnowstormRelationship> relationships,
      SnowstormConceptMini property,
      SnomioConstants type,
      int group) {
    if (property != null) {
      relationships.add(getSnowstormRelationship(type, property, group));
    }
  }

  public static void addDescription(SnowstormConceptView concept, String term, String type) {
    Set<SnowstormDescription> descriptions = concept.getDescriptions();

    if (descriptions == null) {
      descriptions = new HashSet<>();
    }

    descriptions.add(
        new SnowstormDescription()
            .active(true)
            .lang("en")
            .term(term)
            .type(type)
            .caseSignificance(ENTIRE_TERM_CASE_SENSITIVE.getValue())
            .moduleId(SCT_AU_MODULE.getValue())
            .acceptabilityMap(
                Map.of(
                    AmtConstants.ADRS.getValue(),
                    SnomedConstants.PREFERRED.getValue(),
                    AmtConstants.GB_LANG_REFSET_ID.getValue(),
                    SnomedConstants.PREFERRED.getValue(),
                    AmtConstants.US_LANG_REFSET_ID.getValue(),
                    SnomedConstants.PREFERRED.getValue())));

    concept.setDescriptions(descriptions);
  }

  public static String getFsnTerm(@NotNull SnowstormConceptMini snowstormConceptMini) {
    if (snowstormConceptMini.getFsn() == null) {
      throw new ResourceNotFoundProblem("FSN is null for " + snowstormConceptMini.getConceptId());
    }
    return snowstormConceptMini.getFsn().getTerm();
  }

  public static SnowstormConceptView toSnowstormConceptView(Node node) {
    SnowstormConceptView concept = new SnowstormConceptView();

    if (node.getNewConceptDetails().getConceptId() != null) {
      concept.setConceptId(node.getNewConceptDetails().getConceptId().toString());
    }
    concept.setModuleId(SCT_AU_MODULE.getValue());

    NewConceptDetails newConceptDetails = node.getNewConceptDetails();

    SnowstormDtoUtil.addDescription(
        concept, newConceptDetails.getPreferredTerm(), SnomedConstants.SYNONYM.getValue());
    SnowstormDtoUtil.addDescription(
        concept, newConceptDetails.getFullySpecifiedName(), SnomedConstants.FSN.getValue());

    concept.setActive(true);
    concept.setDefinitionStatusId(
        newConceptDetails.getAxioms().stream()
                .anyMatch(a -> a.getDefinitionStatus().equals(DEFINED.getValue()))
            ? DEFINED.getValue()
            : PRIMITIVE.getValue());
    concept.setClassAxioms(newConceptDetails.getAxioms());

    concept.setConceptId(newConceptDetails.getSpecifiedConceptId());
    if (concept.getConceptId() == null) {
      concept.setConceptId(newConceptDetails.getConceptId().toString());
    }
    return concept;
  }

  public static Set<SnowstormReferenceSetMemberViewComponent>
      getExternalIdentifierReferenceSetEntries(
          PackageDetails<? extends ProductDetails> packageDetails) {
    List<ExternalIdentifier> externalIdentifiers = packageDetails.getExternalIdentifiers();
    return getExternalIdentifierReferenceSetEntries(externalIdentifiers);
  }

  public static Set<SnowstormReferenceSetMemberViewComponent>
      getExternalIdentifierReferenceSetEntries(Collection<ExternalIdentifier> externalIdentifiers) {
    Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers = new HashSet<>();
    for (ExternalIdentifier identifier : externalIdentifiers) {
      if (identifier.getIdentifierScheme().equals(ARTGID_SCHEME.getValue())) {
        referenceSetMembers.add(
            new SnowstormReferenceSetMemberViewComponent()
                .active(true)
                .moduleId(SCT_AU_MODULE.getValue())
                .refsetId(ARTGID_REFSET.getValue())
                .additionalFields(Map.of("mapTarget", identifier.getIdentifierValue())));
      } else {
        throw new ProductAtomicDataValidationProblem(
            "Unknown identifier scheme " + identifier.getIdentifierScheme());
      }
    }
    return referenceSetMembers;
  }

  public static String getIdAndFsnTerm(SnowstormConceptMini component) {
    return component.getConceptId()
        + "|"
        + Objects.requireNonNull(component.getFsn()).getTerm()
        + "|";
  }

  public static SnowstormConceptMini toSnowstormConceptMini(SnomioConstants snomioConstants) {
    return new SnowstormConceptMini()
        .conceptId(snomioConstants.getValue())
        .id(snomioConstants.getValue())
        .definitionStatus("PRIMITIVE")
        .definitionStatusId(PRIMITIVE.getValue())
        .active(true)
        .fsn(new SnowstormTermLangPojo().lang("en").term(snomioConstants.getLabel()))
        .pt(
            new SnowstormTermLangPojo()
                .lang("en")
                .term(
                    snomioConstants
                        .getLabel()
                        .substring(0, snomioConstants.getLabel().indexOf("(") - 1)));
  }

  public static SnowstormAxiom getSingleAxiom(SnowstormConcept concept) {
    SnowstormAxiom axiom = concept.getClassAxioms().iterator().next();
    if (concept.getClassAxioms().size() > 1) {
      throw new AtomicDataExtractionProblem(
          "Cannot handle more than one axiom determining brands", concept.getConceptId());
    }
    return axiom;
  }

  /**
   * Clone the relationships in the set to a new set of new SnowstormRelationship objects with blank
   * ids
   *
   * @param existingRelationships the relationships to clone
   * @return a new set of relationships with blank ids
   */
  public static Set<SnowstormRelationship> cloneNewRelationships(
      Set<SnowstormRelationship> existingRelationships) {

    return existingRelationships.stream()
        .map(
            r ->
                new SnowstormRelationship()
                    .active(r.getActive())
                    .characteristicType(r.getCharacteristicType())
                    .concrete(r.getConcrete())
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
                    .moduleId(r.getModuleId())
                    .modifier(r.getModifier())
                    .sourceId(r.getSourceId())
                    .target(r.getTarget())
                    .type(r.getType())
                    .typeId(r.getTypeId()))
        .collect(Collectors.toSet());
  }
}
