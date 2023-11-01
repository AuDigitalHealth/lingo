package com.csiro.snomio.util;

import static com.csiro.snomio.util.AmtConstants.SCT_AU_MODULE;
import static com.csiro.snomio.util.SnomedConstants.SOME_MODIFIER;
import static com.csiro.snomio.util.SnomedConstants.STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE;

import au.csiro.snowstorm_client.model.SnowstormConceptComponent;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import au.csiro.snowstorm_client.model.SnowstormConceptViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationshipComponent;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojoComponent;
import com.csiro.snomio.exception.AtomicDataExtractionProblem;
import com.csiro.snomio.models.product.Quantity;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Set;
import java.util.stream.Collectors;

public class SnowstormDtoUtil {

  private SnowstormDtoUtil() {}

  /**
   * Convert a {@link SnowstormConceptMini} to a {@link SnowstormConceptMiniComponent}. Annoying
   * that this is necessary but these two DTOs are essentially the same but generated differently by
   * a quirk of the OpenAPI generated for Snowstorm.
   *
   * @param mini a {@link SnowstormConceptMini} to convert
   * @return {@link SnowstormConceptMiniComponent} with the same data as the input
   */
  public static SnowstormConceptMiniComponent fromMini(SnowstormConceptMini mini) {
    if (mini == null) return null;
    SnowstormConceptMiniComponent component = new SnowstormConceptMiniComponent();
    component.setConceptId(mini.getConceptId());
    component.setActive(mini.getActive());
    component.setDefinitionStatus(mini.getDefinitionStatus());
    component.setModuleId(mini.getModuleId());
    component.setEffectiveTime(mini.getEffectiveTime());
    component.setFsn(
        new SnowstormTermLangPojoComponent()
            .lang(mini.getFsn().getLang())
            .term(mini.getFsn().getTerm()));
    component.setPt(
        new SnowstormTermLangPojoComponent()
            .lang(mini.getPt().getLang())
            .term(mini.getPt().getTerm()));
    component.setDescendantCount(mini.getDescendantCount());
    component.isLeafInferred(mini.getIsLeafInferred());
    component.isLeafStated(mini.getIsLeafStated());
    component.setId(mini.getId());
    component.setDefinitionStatusId(mini.getDefinitionStatusId());
    component.setLeafInferred(fromMini(mini.getLeafInferred()));
    component.setLeafStated(fromMini(mini.getLeafStated()));
    component.setExtraFields(mini.getExtraFields());
    component.setIdAndFsnTerm(mini.getIdAndFsnTerm());
    return component;
  }

  /**
   * Convert a {@link SnowstormConceptMini} to a {@link SnowstormConceptMiniComponent}. Annoying
   * that this is necessary because of the odd return types from some of the generated web client.
   *
   * @param o a {@link LinkedHashMap} representing a {@link SnowstormConceptMiniComponent}
   * @return {@link SnowstormConceptMiniComponent} with the same data as the input
   */
  public static SnowstormConceptMiniComponent fromLinkedHashMap(Object o) {
    LinkedHashMap<String, Object> map = (LinkedHashMap<String, Object>) o;
    SnowstormConceptMiniComponent component = new SnowstormConceptMiniComponent();
    component.setConceptId((String) map.get("conceptId"));
    component.setActive((Boolean) map.get("active"));
    component.setDefinitionStatus((String) map.get("definitionStatus"));
    component.setModuleId((String) map.get("moduleId"));
    component.setEffectiveTime((String) map.get("effectiveTime"));
    LinkedHashMap<String, String> fsn = (LinkedHashMap<String, String>) map.get("fsn");
    component.setFsn(
        new SnowstormTermLangPojoComponent().lang(fsn.get("lang")).term(fsn.get("term")));
    LinkedHashMap<String, String> pt = (LinkedHashMap<String, String>) map.get("pt");
    component.setPt(new SnowstormTermLangPojoComponent().lang(pt.get("lang")).term(pt.get("term")));
    component.id((String) map.get("id"));
    component.idAndFsnTerm((String) map.get("idAndFsnTerm"));
    return component;
  }

  public static Set<SnowstormRelationshipComponent> filterActiveStatedRelationshipByType(
      Set<SnowstormRelationshipComponent> relationships, String type) {
    return relationships.stream()
        .filter(r -> r.getType().getConceptId().equals(type))
        .filter(SnowstormRelationshipComponent::getActive)
        .filter(r -> r.getCharacteristicType().equals("STATED_RELATIONSHIP"))
        .collect(Collectors.toSet());
  }

  public static Set<SnowstormRelationshipComponent> getRelationshipsFromAxioms(
      SnowstormConceptComponent concept) {
    if (concept.getClassAxioms().size() != 1) {
      throw new AtomicDataExtractionProblem(
          "Expected 1 class axiom but found " + concept.getClassAxioms().size(),
          concept.getConceptId());
    }
    return concept.getClassAxioms().iterator().next().getRelationships();
  }

  public static boolean relationshipOfTypeExists(
      Set<SnowstormRelationshipComponent> subRoleGroup, String type) {
    return !filterActiveStatedRelationshipByType(subRoleGroup, type).isEmpty();
  }

  public static String getSingleActiveConcreteValue(
      Set<SnowstormRelationshipComponent> relationships, String type) {
    return findSingleRelationshipsForActiveInferredByType(relationships, type)
        .iterator()
        .next()
        .getConcreteValue()
        .getValue();
  }

  public static BigDecimal getSingleActiveBigDecimal(
      Set<SnowstormRelationshipComponent> relationships, String type) {
    return new BigDecimal(getSingleActiveConcreteValue(relationships, type));
  }

  public static BigDecimal getSingleOptionalActiveBigDecimal(
      Set<SnowstormRelationshipComponent> relationships, String type) {
    if (relationshipOfTypeExists(relationships, type)) {
      return getSingleActiveBigDecimal(relationships, type);
    }
    return null;
  }

  public static Set<SnowstormRelationshipComponent> findSingleRelationshipsForActiveInferredByType(
      Set<SnowstormRelationshipComponent> relationships, String type) {
    Set<SnowstormRelationshipComponent> filteredRelationships =
        filterActiveStatedRelationshipByType(relationships, type);

    if (filteredRelationships.size() != 1) {
      throw new AtomicDataExtractionProblem(
          "Expected 1 " + type + " relationship but found " + filteredRelationships.size(),
          relationships.iterator().next().getSourceId());
    }

    return filteredRelationships;
  }

  public static Set<SnowstormRelationshipComponent> getActiveRelationshipsInRoleGroup(
      SnowstormRelationshipComponent subpacksRelationship,
      Set<SnowstormRelationshipComponent> relationships) {
    return relationships.stream()
        .filter(r -> r.getGroupId().equals(subpacksRelationship.getGroupId()))
        .filter(SnowstormRelationshipComponent::getActive)
        .filter(r -> r.getCharacteristicType().equals("STATED_RELATIONSHIP"))
        .collect(Collectors.toSet());
  }

  public static Set<SnowstormRelationshipComponent> getActiveRelationshipsOfType(
      Set<SnowstormRelationshipComponent> relationships, String type) {
    return filterActiveStatedRelationshipByType(relationships, type);
  }

  public static SnowstormConceptMiniComponent getSingleOptionalActiveTarget(
      Set<SnowstormRelationshipComponent> relationships, String type) {
    if (relationshipOfTypeExists(relationships, type)) {
      return getSingleActiveTarget(relationships, type);
    }
    return null;
  }

  public static SnowstormConceptMiniComponent getSingleActiveTarget(
      Set<SnowstormRelationshipComponent> relationships, String type) {
    return findSingleRelationshipsForActiveInferredByType(relationships, type)
        .iterator()
        .next()
        .getTarget();
  }

  public static SnowstormRelationshipComponent getSnowstormRelationshipComponent(
      String typeId, String destinationId, int group) {
    SnowstormRelationshipComponent relationship =
        createBaseSnowstormRelationshipComponent(typeId, group);
    relationship.setConcrete(false);
    relationship.setDestinationId(destinationId);
    return relationship;
  }

  public static SnowstormRelationshipComponent getSnowstormDatatypeComponent(
      String typeId, BigDecimal value, int group) {
    SnowstormRelationshipComponent relationship =
        createBaseSnowstormRelationshipComponent(typeId, group);
    relationship.setConcrete(true);
    relationship.setValue("#" + value);
    return relationship;
  }

  public static SnowstormRelationshipComponent getSnowstormDatatypeComponent(
      String typeId, String value, int group) {
    SnowstormRelationshipComponent relationship =
        createBaseSnowstormRelationshipComponent(typeId, group);
    relationship.setConcrete(true);
    relationship.setValue("\"" + value + "\"");
    return relationship;
  }

  private static SnowstormRelationshipComponent createBaseSnowstormRelationshipComponent(
      String typeId, int group) {
    SnowstormRelationshipComponent relationship = new SnowstormRelationshipComponent();
    relationship.setActive(true);
    relationship.setModuleId(SCT_AU_MODULE);
    relationship.setGrouped(group > 0);
    relationship.setGroupId(group);
    relationship.setTypeId(typeId);
    relationship.setModifier(SOME_MODIFIER);
    relationship.setCharacteristicType(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE);
    return relationship;
  }

  public static SnowstormConceptMini toSnowstormComceptMini(SnowstormConceptMiniComponent mc) {
    return new SnowstormConceptMini()
        .fsn(toSnowstormTermLangPojo(mc.getFsn()))
        .pt(toSnowstormTermLangPojo(mc.getPt()))
        .conceptId(mc.getConceptId())
        .active(mc.getActive())
        .definitionStatus(mc.getDefinitionStatus())
        .definitionStatusId(mc.getDefinitionStatusId())
        .descendantCount(mc.getDescendantCount())
        .effectiveTime(mc.getEffectiveTime())
        .extraFields(mc.getExtraFields())
        .id(mc.getId())
        .idAndFsnTerm(mc.getIdAndFsnTerm())
        .isLeafInferred(mc.getIsLeafInferred())
        .isLeafStated(mc.getIsLeafStated())
        .moduleId(mc.getModuleId());
  }

  public static SnowstormConceptMiniComponent toSnowstormComceptMini(
      SnowstormConceptViewComponent c) {
    return new SnowstormConceptMiniComponent()
        .fsn(c.getFsn())
        .pt(c.getPt())
        .conceptId(c.getConceptId())
        .active(c.getActive())
        .definitionStatus(c.getDefinitionStatusId())
        .definitionStatusId(c.getDefinitionStatusId())
        .effectiveTime(c.getEffectiveTime())
        .moduleId(c.getModuleId());
  }

  private static SnowstormTermLangPojo toSnowstormTermLangPojo(SnowstormTermLangPojoComponent o) {
    return new SnowstormTermLangPojo().lang(o.getLang()).term(o.getTerm());
  }

  public static void addDatatypeIfNotNull(
      Set<SnowstormRelationshipComponent> relationships, String value, String type, int i) {
    if (value != null) {
      relationships.add(getSnowstormDatatypeComponent(type, value, i));
    }
  }

  public static void addQuantityIfNotNull(
      Quantity quantity,
      Set<SnowstormRelationshipComponent> relationships,
      String valueTypeId,
      String unitTypeId,
      int group) {
    if (quantity != null) {
      relationships.add(getSnowstormDatatypeComponent(valueTypeId, quantity.getValue(), group));
      relationships.add(
          getSnowstormRelationshipComponent(unitTypeId, quantity.getUnit().getConceptId(), group));
    }
  }

  public static void addRelationshipIfNotNull(
      Set<SnowstormRelationshipComponent> relationships,
      SnowstormConceptMiniComponent property,
      String typeId,
      int group) {
    if (property != null) {
      relationships.add(getSnowstormRelationshipComponent(typeId, property.getConceptId(), group));
    }
  }
}
