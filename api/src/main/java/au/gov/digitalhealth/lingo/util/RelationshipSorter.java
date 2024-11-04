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

import static java.util.stream.Collectors.counting;
import static java.util.stream.Collectors.groupingBy;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import java.util.Comparator;
import java.util.Map;
import java.util.Objects;
import java.util.SortedSet;
import java.util.TreeSet;

public class RelationshipSorter {
  private RelationshipSorter() {}

  public static Comparator<SnowstormRelationship> getRelationshipComparator(
      Map<Integer, Long> groupSizeMap) {
    return Comparator.comparing(SnowstormRelationship::getActive)
        .reversed()
        .thenComparingInt(RelationshipSorter::isaComparator)
        .thenComparingInt(r -> extractGroupWeight(r, groupSizeMap))
        .thenComparing(SnowstormRelationship::getTypeId, Comparator.nullsLast(String::compareTo))
        .thenComparing(
            r -> r.getTarget() == null ? null : r.getTarget().getFsn().getTerm(),
            Comparator.nullsLast(String::compareTo))
        .thenComparing(
            SnowstormRelationship::getDestinationId, Comparator.nullsLast(String::compareTo))
        .thenComparing(SnowstormRelationship::hashCode);
  }

  private static int isaComparator(SnowstormRelationship r) {
    if (r.getTypeId().equals("116680003")) {
      return 0;
    }
    return 1;
  }

  private static int extractGroupWeight(SnowstormRelationship r, Map<Integer, Long> groupSizeMap) {
    Number groupKey = r.getGroupId() != null ? r.getGroupId() : r.getRelationshipGroup();

    if (groupKey == null) {
      return 0; // Default to 0 if both groupId and relationshipGroup are null
    }

    if (groupKey.equals(0)) {
      return 0;
    } else if (groupSizeMap.getOrDefault(groupKey, 0L) == 1) {
      return 1;
    } else {
      return groupKey.intValue() * 10;
    }
  }

  public static void sortRelationships(SnowstormAxiom a) {

    Map<Integer, Long> map =
        a.getRelationships().stream()
            .collect(
                groupingBy(
                    r -> {
                      Integer groupId = r.getGroupId();
                      Integer relationshipGroup = r.getRelationshipGroup();
                      return Objects.requireNonNullElseGet(
                          groupId, () -> relationshipGroup != null ? relationshipGroup : 0);
                    },
                    counting()));

    SortedSet<SnowstormRelationship> sortedRelationships =
        new TreeSet<>(getRelationshipComparator(map));

    sortedRelationships.addAll(a.getRelationships());
    a.setRelationships(sortedRelationships);
  }
}
