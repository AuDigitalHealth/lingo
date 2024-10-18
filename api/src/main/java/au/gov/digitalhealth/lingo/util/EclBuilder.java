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

import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_CONTAINER_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.COUNT_OF_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.COUNT_OF_BASE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_MANUFACTURED_DOSE_FORM;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT_PACKAGE;
import static java.util.stream.Collectors.mapping;

import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.exception.UnexpectedSnowstormResponseProblem;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import lombok.extern.java.Log;

@Log
public class EclBuilder {

  private EclBuilder() {}

  @SuppressWarnings("java:S1192")
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
                    Boolean.TRUE.equals(r.getConcrete())
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

  @SuppressWarnings("java:S1192")
  private static String buildUngroupedRelationships(
      Set<SnowstormRelationship> relationships, boolean suppressNegativeStatements) {
    StringBuilder response = new StringBuilder();

    response.append(getRelationshipFilters(relationships));

    if (!suppressNegativeStatements) {
      if (relationships.stream()
          .anyMatch(
              r ->
                  r.getTypeId().equals(SnomedConstants.IS_A.getValue())
                      && r.getDestinationId() != null
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
                          && r.getDestinationId() != null
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
        .filter(
            r ->
                Boolean.TRUE.equals(r.getConcrete())
                    || (r.getDestinationId() != null && Long.parseLong(r.getDestinationId()) > 0))
        .map(EclBuilder::toRelationshipEclFilter)
        .distinct()
        .collect(Collectors.joining(", "));
  }

  private static String toRelationshipEclFilter(SnowstormRelationship r) {
    StringBuilder response = new StringBuilder();
    response.append(r.getTypeId());
    response.append(" = ");
    if (Boolean.TRUE.equals(r.getConcrete())) {
      if (Objects.equals(
          Objects.requireNonNull(r.getConcreteValue()).getDataType(), DataTypeEnum.STRING)) {
        response.append("\"");
      } else {
        response.append("#");
      }
      response.append(r.getConcreteValue().getValue());
      if (Objects.equals(r.getConcreteValue().getDataType(), DataTypeEnum.STRING)) {
        response.append("\"");
      }
    } else {
      response.append(r.getDestinationId());
    }
    return response.toString();
  }

  @SuppressWarnings("java:S1192")
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

      if (relationshipSet.stream().allMatch(r -> Boolean.TRUE.equals(r.getConcrete()))) {
        DataTypeEnum datatype = relationshipSet.iterator().next().getConcreteValue().getDataType();

        if (!relationshipSet.stream()
            .allMatch(
                r ->
                    r.getConcreteValue() != null
                        && r.getConcreteValue().getDataType() != null
                        && r.getConcreteValue().getDataType().equals(datatype))) {
          throw new UnexpectedSnowstormResponseProblem(
              "Expected all concrete domains to share the same datatype for "
                  + typeId
                  + " for source concept "
                  + relationshipSet.iterator().next().getSourceId()
                  + " set was "
                  + relationshipSet.stream()
                      .map(SnowstormRelationship::getConcreteValue)
                      .map(Objects::toString)
                      .distinct()
                      .collect(Collectors.joining(", ")));
        }

        value =
            relationshipSet.stream()
                .map(
                    r ->
                        datatype.equals(DataTypeEnum.STRING)
                            ? "\"" + Objects.requireNonNull(r.getConcreteValue()).getValue() + "\""
                            : "#" + Objects.requireNonNull(r.getConcreteValue()).getValue())
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

  @SuppressWarnings("java:S1192")
  private static String buildRefsets(Set<String> referencedIds) {
    return referencedIds.stream().map(id -> "^" + id).collect(Collectors.joining(" AND "));
  }

  @SuppressWarnings("java:S1192")
  private static String buildIsaRelationships(Set<SnowstormRelationship> relationships) {
    String isARelationships =
        relationships.stream()
            .filter(r -> r.getTypeId().equals(SnomedConstants.IS_A.getValue()))
            .filter(r -> Boolean.FALSE.equals(r.getConcrete()))
            .filter(r -> r.getDestinationId() != null && Long.parseLong(r.getDestinationId()) > 0)
            .map(r -> "<" + r.getDestinationId())
            .collect(Collectors.joining(" AND "));

    if (isARelationships.isEmpty()) {
      isARelationships = "*";
    }
    return isARelationships;
  }
}
