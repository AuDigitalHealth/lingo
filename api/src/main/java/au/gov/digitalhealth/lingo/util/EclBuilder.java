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

import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static au.gov.digitalhealth.lingo.util.NmpcConstants.HAS_OTHER_IDENTIFYING_INFORMATION_NMPC;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static java.util.stream.Collectors.mapping;

import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.exception.UnexpectedSnowstormResponseProblem;
import java.util.List;
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
      boolean suppressNegativeStatements,
      ModelConfiguration modelConfiguration) {
    return build(
        relationships,
        referencedIds,
        suppressIsa,
        suppressNegativeStatements,
        modelConfiguration,
        null);
  }

  @SuppressWarnings("java:S1192")
  public static String build(
      Set<SnowstormRelationship> relationships,
      Set<String> referencedIds,
      boolean suppressIsa,
      boolean suppressNegativeStatements,
      ModelConfiguration modelConfiguration,
      ModelLevel modelLevel) {
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

    String ungrouped =
        buildUngroupedRelationships(
            relationships, suppressNegativeStatements, modelConfiguration, modelLevel);
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
                    r.getConcreteValue() != null
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
      Set<SnowstormRelationship> relationships,
      boolean suppressNegativeStatements,
      ModelConfiguration modelConfiguration,
      ModelLevel modelLevel) {
    StringBuilder response = new StringBuilder();

    response.append(getRelationshipFilters(relationships));

    if (suppressNegativeStatements || modelLevel == null) {
      return response.toString();
    }

    // Derive defining attribute types valid at this level for this model variant. For each such
    // type, emit a negative filter so that candidate concepts carrying additional values are
    // excluded. The concrete shape of the filter depends on whether the attribute is absent,
    // single-valued, or multi-valued and whether the values are concepts or concrete domains —
    // see generateNegativeFilters.
    Set<String> levelDefiningAttributes =
        ModelLevelDefiningAttributes.getDefiningAttributeTypeIds(
            modelLevel.getModelLevelType(), modelConfiguration.getModelType());

    levelDefiningAttributes.stream()
        .sorted()
        .forEach(typeId -> response.append(generateNegativeFilters(relationships, typeId)));

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
            .filter(
                r ->
                    !r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION.getValue())
                        && !r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION_NMPC.getValue()))
            .collect(Collectors.toSet());

    return filteredRelationships.stream()
        .filter(r -> !r.getTypeId().equals(SnomedConstants.IS_A.getValue()))
        .filter(
            r ->
                r.getConcreteValue() != null
                    || (r.getDestinationId() != null && Long.parseLong(r.getDestinationId()) > 0))
        .map(EclBuilder::toRelationshipEclFilter)
        .distinct()
        .collect(Collectors.joining(", "));
  }

  private static String toRelationshipEclFilter(SnowstormRelationship r) {
    StringBuilder response = new StringBuilder();
    response.append(r.getTypeId());
    response.append(" = ");
    if (r.getConcreteValue() != null) {
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
    if (relationships.stream().noneMatch(r -> r.getTypeId().equals(typeId))) {
      return ", [0..0] " + typeId + " = *";
    }

    Set<SnowstormRelationship> relationshipSet =
        relationships.stream()
            .filter(r -> r.getTypeId().equals(typeId))
            .collect(Collectors.toSet());

    boolean concreteValued = relationshipSet.stream().allMatch(r -> r.getConcreteValue() != null);

    List<String> distinctValues;
    if (concreteValued) {
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

      distinctValues =
          relationshipSet.stream()
              .map(
                  r ->
                      datatype.equals(DataTypeEnum.STRING)
                          ? "\"" + Objects.requireNonNull(r.getConcreteValue()).getValue() + "\""
                          : "#" + Objects.requireNonNull(r.getConcreteValue()).getValue())
              .distinct()
              .toList();
    } else {
      distinctValues =
          relationshipSet.stream().map(SnowstormRelationship::getDestinationId).distinct().toList();
    }

    if (distinctValues.size() == 1) {
      return ", [0..0] " + typeId + " != " + distinctValues.get(0);
    }

    // For multi-valued attributes, Snowstorm ECL supports `X != (a OR b)` when the values are
    // concept references but NOT when they are concrete domains (the grammar disallows concrete
    // value disjunctions inside an attribute filter). For concept-valued multi-value attributes
    // we therefore emit the OR form. For concrete-valued multi-value attributes we fall back to a
    // cardinality constraint `[N..N] X = *`, which correctly excludes candidates carrying
    // additional values of the same attribute (concrete defining attributes such as pack-size
    // value appear at most once per role group, so the global count matches the number of
    // distinct supplied values).
    if (!concreteValued) {
      return ", [0..0] " + typeId + " != (" + String.join(" OR ", distinctValues) + ")";
    }
    int cardinality = distinctValues.size();
    return ", [" + cardinality + ".." + cardinality + "] " + typeId + " = *";
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
            .filter(r -> r.getConcreteValue() == null)
            .filter(r -> r.getDestinationId() != null && Long.parseLong(r.getDestinationId()) > 0)
            .map(r -> "<" + r.getDestinationId())
            .collect(Collectors.joining(" AND "));

    if (isARelationships.isEmpty()) {
      isARelationships = "*";
    }
    return isARelationships;
  }
}
