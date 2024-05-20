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
import com.csiro.snomio.exception.UnexpectedSnowstormResponseProblem;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import lombok.extern.java.Log;

@Log
public class EclBuilder {

  private EclBuilder() {}

  public static String build(
      Set<SnowstormRelationship> relationships,
      Set<String> referencedIds,
      boolean suppressIsa,
      boolean suppressNegativeStatements) {
    // first do the isa relationships
    // and the refsets
    // then group 0 relationships, including grouped relationships
    // then grouped relatiopnships
    String isaEcl = suppressIsa ? "" : buildIsaRelationships(relationships);
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

    String ungrouped = buildUngroupedRelationships(relationships, suppressNegativeStatements);
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
            .filter(
                r ->
                    r.getConcrete()
                        || (r.getDestinationId() != null && r.getDestinationId().matches("\\d+")))
            .collect(
                Collectors.groupingBy(
                    SnowstormRelationship::getGroupId,
                    TreeMap::new,
                    mapping(r -> r, Collectors.toSet())));

    return groupMap.keySet().stream()
        .map(k -> "{" + getRelationshipFilters(groupMap.get(k)) + "}")
        .collect(Collectors.joining(","));
  }

  private static String buildUngroupedRelationships(
      Set<SnowstormRelationship> relationships, boolean suppressNegativeStatements) {
    StringBuilder response = new StringBuilder();

    response.append(getRelationshipFilters(relationships));

    if (!suppressNegativeStatements) {
      if (relationships.stream()
          .anyMatch(
              r ->
                  r.getTypeId().equals(SnomedConstants.IS_A.getValue())
                      && r.getDestinationId().equals(MEDICINAL_PRODUCT.getValue()))) {
        response.append(
            generateNegativeFilters(relationships, HAS_MANUFACTURED_DOSE_FORM.getValue()));
        response.append(
            generateNegativeFilters(relationships, COUNT_OF_ACTIVE_INGREDIENT.getValue()));
        response.append(
            generateNegativeFilters(relationships, COUNT_OF_BASE_ACTIVE_INGREDIENT.getValue()));
        response.append(generateNegativeFilters(relationships, HAS_ACTIVE_INGREDIENT.getValue()));
        response.append(
            generateNegativeFilters(relationships, HAS_PRECISE_ACTIVE_INGREDIENT.getValue()));
      }

      if (relationships.stream()
              .anyMatch(
                  r ->
                      r.getTypeId().equals(SnomedConstants.IS_A.getValue())
                          && r.getDestinationId().equals(MEDICINAL_PRODUCT_PACKAGE.getValue()))
          && relationships.stream()
              .noneMatch(r -> r.getTypeId().equals(HAS_CONTAINER_TYPE.getValue()))) {
        response.append(", [0..0] " + HAS_CONTAINER_TYPE + " = *");
      }

      if (relationships.stream()
          .noneMatch(r -> r.getTypeId().equals(HAS_PRODUCT_NAME.getValue()))) {
        response.append(", [0..0] " + HAS_PRODUCT_NAME + " = *");
      }
    }

    return response.toString();
  }

  private static String getRelationshipFilters(Set<SnowstormRelationship> relationships) {
    Set<SnowstormRelationship> filteredRelationships = relationships;

    if (relationships.stream()
        .anyMatch(r -> r.getTypeId().equals(HAS_PRECISE_ACTIVE_INGREDIENT.getValue()))) {
      filteredRelationships =
          relationships.stream()
              .filter(r -> !r.getTypeId().equals(HAS_ACTIVE_INGREDIENT.getValue()))
              .collect(Collectors.toSet());
    }

    // TODO this is a Snowstorm defect - this is needed but has to be filtered out for now
    filteredRelationships =
        filteredRelationships.stream()
            .filter(r -> !r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION.getValue()))
            .collect(Collectors.toSet());

    return filteredRelationships.stream()
        .filter(r -> !r.getTypeId().equals(SnomedConstants.IS_A.getValue()))
        .filter(r -> r.getConcrete() || Long.parseLong(r.getDestinationId()) > 0)
        .map(EclBuilder::toRelationshipEclFilter)
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

  private static String generateNegativeFilters(
      Set<SnowstormRelationship> relationships, String typeId) {
    String response;
    if (relationships.stream().noneMatch(r -> r.getTypeId().equals(typeId))) {
      response = ", [0..0] " + typeId + " = *";
    } else {
      String value;

      Set<SnowstormRelationship> relationshipSet =
          relationships.stream()
              .filter(r -> r.getTypeId().equals(typeId))
              .collect(Collectors.toSet());

      if (relationshipSet.stream().allMatch(r -> r.getConcrete())) {
        DataTypeEnum datatype = relationshipSet.iterator().next().getConcreteValue().getDataType();

        if (!relationshipSet.stream()
            .allMatch(r -> r.getConcreteValue().getDataType().equals(datatype))) {
          throw new UnexpectedSnowstormResponseProblem(
              "Expected all concrete domains to share the same datatype for "
                  + typeId
                  + " for source concept "
                  + relationshipSet.iterator().next().getSourceId()
                  + " set was "
                  + relationshipSet.stream()
                      .map(r -> r.getConcreteValue().getDataType().getValue())
                      .distinct()
                      .collect(Collectors.joining(", ")));
        }

        value =
            relationshipSet.stream()
                .map(
                    r ->
                        datatype.equals(DataTypeEnum.STRING)
                            ? "\"" + r.getConcreteValue().getValue() + "\""
                            : "#" + r.getConcreteValue().getValue())
                .collect(Collectors.joining(" OR "));
      } else {
        value =
            relationshipSet.stream()
                .map(SnowstormRelationship::getDestinationId)
                .collect(Collectors.joining(" OR "));
      }

      if (value.contains(" OR ")) {
        value = "(" + value + ")";
      }
      response = ", [0..0] " + typeId + " != " + value;
    }
    return response;
  }

  private static String buildRefsets(Set<String> referencedIds) {
    return referencedIds.stream().map(id -> "^" + id).collect(Collectors.joining(" AND "));
  }

  private static String buildIsaRelationships(Set<SnowstormRelationship> relationships) {
    String isARelationships =
        relationships.stream()
            .filter(r -> r.getTypeId().equals(SnomedConstants.IS_A.getValue()))
            .filter(r -> r.getConcrete().equals(Boolean.FALSE))
            .filter(r -> Long.parseLong(r.getDestinationId()) > 0)
            .map(r -> "<" + r.getDestinationId())
            .collect(Collectors.joining(" AND "));

    if (isARelationships.isEmpty()) {
      isARelationships = "*";
    }
    return isARelationships;
  }
}
