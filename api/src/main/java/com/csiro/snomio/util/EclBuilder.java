package com.csiro.snomio.util;

import static com.csiro.snomio.util.AmtConstants.HAS_CONTAINER_TYPE;
import static com.csiro.snomio.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static com.csiro.snomio.util.SnomedConstants.COUNT_OF_ACTIVE_INGREDIENT;
import static com.csiro.snomio.util.SnomedConstants.COUNT_OF_BASE_ACTIVE_INGREDIENT;
import static com.csiro.snomio.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static com.csiro.snomio.util.SnomedConstants.HAS_MANUFACTURED_DOSE_FORM;
import static com.csiro.snomio.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static com.csiro.snomio.util.SnomedConstants.HAS_PRODUCT_NAME;
import static com.csiro.snomio.util.SnomedConstants.MEDICINAL_PRODUCT;
import static com.csiro.snomio.util.SnomedConstants.MEDICINAL_PRODUCT_PACKAGE;
import static java.util.stream.Collectors.mapping;

import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import lombok.extern.java.Log;

@Log
public class EclBuilder {

  private EclBuilder() {}

  public static String build(Set<SnowstormRelationship> relationships, Set<String> referencedIds) {
    // first do the isa relationships
    // and the refsets
    // then group 0 relationships, including grouped relationships
    // then grouped relatiopnships
    String isaEcl = buildIsaRelationships(relationships);
    String refsetEcl = buildRefsets(referencedIds);

    StringBuilder ecl = new StringBuilder();
    ecl.append("(");
    if (isaEcl.isEmpty() && refsetEcl.isEmpty()) {
      ecl.append("*");
    } else if (isaEcl.isEmpty()) {
      ecl.append(refsetEcl);
    } else if (refsetEcl.isEmpty()) {
      ecl.append(isaEcl);
    } else {
      ecl.append(isaEcl);
      ecl.append(" AND ");
      ecl.append(refsetEcl);
    }
    ecl.append(")");

    String ungrouped = buildUngroupedRelationships(relationships);
    String grouped = buildGroupedRelationships(relationships);

    if (!ungrouped.isEmpty() && !grouped.isEmpty()) {
      ecl.append(":");
      ecl.append(ungrouped);
      ecl.append(",");
      ecl.append(grouped);
    } else if (!ungrouped.isEmpty()) {
      ecl.append(":");
      ecl.append(ungrouped);
    } else if (!grouped.isEmpty()) {
      ecl.append(":");
      ecl.append(grouped);
    }

    log.info("ECL: " + ecl);
    return ecl.toString();
  }

  private static String buildGroupedRelationships(Set<SnowstormRelationship> relationships) {
    Map<Integer, Set<SnowstormRelationship>> groupMap =
        relationships.stream()
            .filter(r -> r.getGroupId() != 0)
            .filter(r -> r.getConcrete() || r.getDestinationId().matches("\\d+"))
            .collect(
                Collectors.groupingBy(
                    SnowstormRelationship::getGroupId,
                    TreeMap::new,
                    mapping(r -> r, Collectors.toSet())));

    return groupMap.keySet().stream()
        .map(k -> "{" + getRelationshipFilters(groupMap.get(k)) + "}")
        .collect(Collectors.joining(","));
  }

  private static String buildUngroupedRelationships(Set<SnowstormRelationship> relationships) {
    StringBuilder response = new StringBuilder();

    response.append(getRelationshipFilters(relationships));

    if (relationships.stream()
        .anyMatch(
            r ->
                r.getTypeId().equals(SnomedConstants.IS_A)
                    && r.getDestinationId().equals(MEDICINAL_PRODUCT))) {
      response.append(handleMedicinalProduct(relationships));
      response.append(generateNegativeFilters(relationships, HAS_ACTIVE_INGREDIENT));
      response.append(generateNegativeFilters(relationships, HAS_PRECISE_ACTIVE_INGREDIENT));
    }

    if (relationships.stream()
            .anyMatch(
                r ->
                    r.getTypeId().equals(SnomedConstants.IS_A)
                        && r.getDestinationId().equals(MEDICINAL_PRODUCT_PACKAGE))
        && relationships.stream().noneMatch(r -> r.getTypeId().equals(HAS_CONTAINER_TYPE))) {
      response.append(", [0..0] " + HAS_CONTAINER_TYPE + " = *");
    }

    if (relationships.stream().noneMatch(r -> r.getTypeId().equals(HAS_PRODUCT_NAME))) {
      response.append(", [0..0] " + HAS_PRODUCT_NAME + " = *");
    }

    return response.toString();
  }

  private static String getRelationshipFilters(Set<SnowstormRelationship> relationships) {
    Set<SnowstormRelationship> filteredRelationships = relationships;

    if (relationships.stream().anyMatch(r -> r.getTypeId().equals(HAS_PRECISE_ACTIVE_INGREDIENT))) {
      filteredRelationships =
          relationships.stream()
              .filter(r -> !r.getTypeId().equals(HAS_ACTIVE_INGREDIENT))
              .collect(Collectors.toSet());
    }

    // TODO this is a Snowstorm defect - this is needed but has to be filtered out for now
    filteredRelationships =
        filteredRelationships.stream()
            .filter(r -> !r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION))
            .collect(Collectors.toSet());

    return filteredRelationships.stream()
        .filter(r -> !r.getTypeId().equals(SnomedConstants.IS_A))
        .filter(r -> r.getConcrete() || r.getDestinationId().matches("\\d+"))
        .map(r -> toRelationshipEclFilter(r))
        .distinct()
        .collect(Collectors.joining(", "));
  }

  private static String toRelationshipEclFilter(SnowstormRelationship r) {
    StringBuilder response = new StringBuilder();
    response.append(r.getTypeId());
    response.append(" = ");
    if (Boolean.TRUE.equals(r.getConcrete())) {
      if (r.getConcreteValue().getDataType().equals(DataTypeEnum.STRING)) {
        response.append("\"");
      } else {
        response.append("#");
      }
      response.append(r.getConcreteValue().getValue());
      if (r.getConcreteValue().getDataType().equals(DataTypeEnum.STRING)) {
        response.append("\"");
      }
    } else {
      response.append(r.getDestinationId());
    }
    return response.toString();
  }

  private static String handleMedicinalProduct(Set<SnowstormRelationship> relationships) {
    if (relationships.stream()
        .noneMatch(
            r ->
                r.getTypeId().equals(HAS_MANUFACTURED_DOSE_FORM)
                    || r.getTypeId().equals(COUNT_OF_ACTIVE_INGREDIENT)
                    || r.getTypeId().equals(COUNT_OF_BASE_ACTIVE_INGREDIENT))) {
      return ", [0..0] "
          + HAS_MANUFACTURED_DOSE_FORM
          + " = *, [0..0] "
          + COUNT_OF_ACTIVE_INGREDIENT
          + " = *, [0..0] "
          + COUNT_OF_BASE_ACTIVE_INGREDIENT
          + " = *";
    }
    return "";
  }

  private static String generateNegativeFilters(
      Set<SnowstormRelationship> relationships, String typeId) {
    String response;
    if (relationships.stream().noneMatch(r -> r.getTypeId().equals(typeId))) {
      response = ", [0..0] " + typeId + " = *";
    } else {
      response =
          ", [0..0] "
              + typeId
              + " != ("
              + relationships.stream()
                  .filter(r -> r.getTypeId().equals(typeId))
                  .map(r -> r.getDestinationId())
                  .collect(Collectors.joining(" OR "))
              + ")";
    }
    return response;
  }

  private static String buildRefsets(Set<String> referencedIds) {
    return referencedIds.stream().map(id -> "^" + id).collect(Collectors.joining(" AND "));
  }

  private static String buildIsaRelationships(Set<SnowstormRelationship> relationships) {
    String isARelationships =
        relationships.stream()
            .filter(r -> r.getTypeId().equals(SnomedConstants.IS_A))
            .filter(r -> r.getConcrete().equals(Boolean.FALSE))
            .filter(r -> r.getDestinationId().matches("\\d+"))
            .map(r -> "<" + r.getDestinationId())
            .collect(Collectors.joining(" AND "));

    if (isARelationships.isEmpty()) {
      isARelationships = "*";
    }
    return isARelationships;
  }
}
